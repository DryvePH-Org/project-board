"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useOnViewportChange } from "@xyflow/react";

interface OverlayPanel {
  el: HTMLElement;
  scale: number;
  order: number;
}

interface OverlayApi {
  registerPanel: (id: string, el: HTMLElement, scale: number) => void;
  unregisterPanel: (id: string, el?: HTMLElement) => void;
  requestLayout: () => void;
}

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const OverlayApiContext = createContext<OverlayApi | null>(null);

const GAP = 10;
const MARGIN = 8;
const STEP = 8;
const X_TRIES = 6;

function overlaps(a: Rect, b: Rect) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/**
 * Keeps floating panels (comment threads, blocker popovers) from covering
 * each other. Panels stay at their anchor until they collide; newer panels
 * slide to the nearest free spot inside the canvas.
 *
 * Offsets are written straight to the DOM so measurements never race React
 * re-renders: every pass parks panels at their anchor, measures, then places.
 */
export function OverlayLayoutProvider({
  children,
  revision = 0,
}: {
  children: ReactNode;
  revision?: number;
}) {
  const panels = useRef(new Map<string, OverlayPanel>());
  const orders = useRef(new Map<string, number>());
  const orderSeq = useRef(0);
  const observers = useRef(new Map<string, ResizeObserver>());
  const canvasObserver = useRef<ResizeObserver | null>(null);
  const frame = useRef<number | null>(null);

  const compute = useCallback(() => {
    frame.current = null;

    const entries = [...panels.current.entries()]
      .filter(([, panel]) => panel.el.isConnected)
      .sort((a, b) => a[1].order - b[1].order);

    if (entries.length === 0) return;

    const canvas = entries[0][1].el.closest(".flow-canvas");
    const bounds: Rect = canvas
      ? canvas.getBoundingClientRect()
      : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };

    for (const [, panel] of entries) {
      panel.el.style.translate = "0px 0px";
    }

    const bases = entries.map(([id, panel]) => ({ id, panel, rect: panel.el.getBoundingClientRect() }));

    const placed: Rect[] = [];
    const targets: Array<{ el: HTMLElement; x: number; y: number }> = [];

    for (const { panel, rect } of bases) {
      // Layout sizes ignore mount animations (e.g. the scale in `pop`) that
      // would otherwise make a panel look slightly smaller than it settles.
      const width = panel.el.offsetWidth * panel.scale;
      const height = panel.el.offsetHeight * panel.scale;
      if (width === 0 && height === 0) continue;

      const minLeft = bounds.left + MARGIN;
      const minTop = bounds.top + MARGIN;
      const maxLeft = Math.max(minLeft, bounds.right - MARGIN - width);
      const maxTop = Math.max(minTop, bounds.bottom - MARGIN - height);

      const clampLeft = (value: number) => Math.min(Math.max(value, minLeft), maxLeft);
      const clampTop = (value: number) => Math.min(Math.max(value, minTop), maxTop);

      const anchorLeft = clampLeft(rect.left);
      const anchorTop = clampTop(rect.top);

      const candidatesLeft = [anchorLeft, minLeft, maxLeft];
      for (let i = 1; i <= X_TRIES; i += 1) {
        candidatesLeft.push(clampLeft(rect.left - i * (width + GAP)));
        candidatesLeft.push(clampLeft(rect.left + i * (width + GAP)));
      }
      const uniqueLefts = candidatesLeft.filter((x, index) => candidatesLeft.indexOf(x) === index);

      let bestLeft = anchorLeft;
      let bestTop = anchorTop;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const left of uniqueLefts) {
        const right = left + width;
        for (let top = minTop; top <= maxTop + 0.5; top += STEP) {
          const bottom = top + height;
          if (placed.some((r) => overlaps(r, { left, top, right, bottom }))) continue;
          const score = Math.abs(left - rect.left) + Math.abs(top - rect.top);
          if (score < bestScore) {
            bestScore = score;
            bestLeft = left;
            bestTop = top;
          }
        }
      }

      placed.push({ left: bestLeft, top: bestTop, right: bestLeft + width, bottom: bestTop + height });
      targets.push({
        el: panel.el,
        x: Math.round(((bestLeft - rect.left) / panel.scale) * 10) / 10,
        y: Math.round(((bestTop - rect.top) / panel.scale) * 10) / 10,
      });
    }

    for (const target of targets) {
      target.el.style.translate = `${target.x}px ${target.y}px`;
    }
  }, []);

  const schedule = useCallback(() => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(compute);
  }, [compute]);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      canvasObserver.current?.disconnect();
      for (const observer of observers.current.values()) observer.disconnect();
    },
    [],
  );

  const registerPanel = useCallback(
    (id: string, el: HTMLElement, scale: number) => {
      let order = orders.current.get(id);
      if (order === undefined) {
        orderSeq.current += 1;
        order = orderSeq.current;
        orders.current.set(id, order);
      }

      const existing = panels.current.get(id);
      panels.current.set(id, { el, scale, order });

      if (existing?.el !== el) {
        observers.current.get(id)?.disconnect();
        const observer = new ResizeObserver(schedule);
        observer.observe(el);
        observers.current.set(id, observer);
      }

      const canvas = el.closest(".flow-canvas");
      if (canvas && canvasObserver.current === null) {
        const observer = new ResizeObserver(schedule);
        observer.observe(canvas);
        canvasObserver.current = observer;
      }

      schedule();

      // An entrance animation moves the panel, so place it again once that
      // motion has finished to get accurate anchor coordinates.
      const animations = typeof el.getAnimations === "function" ? el.getAnimations() : [];
      if (animations.length > 0) {
        void Promise.all(animations.map((animation) => animation.finished.catch(() => undefined))).then(schedule);
      }
    },
    [schedule],
  );

  const unregisterPanel = useCallback(
    (id: string, el?: HTMLElement) => {
      // A remounted component may register its new element before the old one
      // unregisters. Keep the registration that points at the live element.
      const current = panels.current.get(id);
      if (el && current && current.el !== el) return;
      panels.current.delete(id);
      observers.current.get(id)?.disconnect();
      observers.current.delete(id);
      if (panels.current.size === 0 && canvasObserver.current !== null) {
        canvasObserver.current.disconnect();
        canvasObserver.current = null;
      }
      schedule();
    },
    [schedule],
  );

  const api = useMemo(
    () => ({ registerPanel, unregisterPanel, requestLayout: schedule }),
    [registerPanel, unregisterPanel, schedule],
  );

  useEffect(() => {
    if (revision > 0) schedule();
  }, [revision, schedule]);

  return <OverlayApiContext.Provider value={api}>{children}</OverlayApiContext.Provider>;
}

/** Re-runs the layout when the canvas pans or zooms. Must render inside <ReactFlow>. */
export function OverlayViewportSync() {
  const api = useContext(OverlayApiContext);
  useOnViewportChange({ onChange: () => api?.requestLayout() });
  return null;
}

export function useOverlayPanel<T extends HTMLElement>(id: string, active: boolean, scale = 1) {
  const api = useContext(OverlayApiContext);
  const ref = useRef<T | null>(null);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const activeRef = useRef(active);
  activeRef.current = active;

  // Edge components remount on data refreshes, so registration follows the
  // element itself rather than a one-off effect.
  const setRef = useCallback(
    (el: T | null) => {
      if (ref.current === el) return;
      const prev = ref.current;
      ref.current = el;
      if (!api) return;
      if (prev) {
        prev.style.translate = "";
        api.unregisterPanel(id, prev);
      }
      if (el && activeRef.current) api.registerPanel(id, el, scaleRef.current);
    },
    [api, id],
  );

  useEffect(() => {
    const el = ref.current;
    if (!api || !active || !el) return;
    return () => api.unregisterPanel(id, el);
  }, [active, api, id]);

  useEffect(() => {
    if (!api || !active || !ref.current) return;
    api.registerPanel(id, ref.current, scale);
  }, [active, api, id, scale]);

  return setRef;
}
