"use client";

import { createContext, useContext } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useStore, type EdgeProps } from "@xyflow/react";
import { Icon } from "@/components/Icons";
import { useWorkspace } from "@/lib/store";
import type { FlowEdgeType } from "@/lib/flow";
import type { EdgeBlocker } from "@/lib/types";
import { useOverlayPanel } from "./OverlayLayout";

function newBlockerId() {
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Popover UI state lives above React Flow because edge components remount
 * whenever the board data refreshes. */
export interface EdgePopoverState {
  openEdgeIds: string[];
  openEdge: (id: string) => void;
  closeEdge: (id: string) => void;
  drafts: Record<string, string>;
  setDraft: (id: string, value: string) => void;
}

export const EdgePopoverContext = createContext<EdgePopoverState | null>(null);

export function FlowEdgeButton({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps<FlowEdgeType>) {
  const { updateEdge, deleteEdge, notify } = useWorkspace();
  const popover = useContext(EdgePopoverContext);
  const open = popover?.openEdgeIds.includes(id) ?? false;
  const note = popover?.drafts[id] ?? "";
  // Edge labels live inside the zoomed viewport, so measurements must be
  // converted back to local pixels before they become an offset.
  const zoom = useStore((state) => state.transform[2]);
  const setPopoverRef = useOverlayPanel<HTMLFormElement>(`blocker:${id}`, open, zoom);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const blockers = data?.blockers ?? [];
  const openBlockers = blockers.filter((blocker) => !blocker.resolved);
  const resolvedBlockers = blockers.filter((blocker) => blocker.resolved);
  const blocked = openBlockers.length > 0;
  const waiting = Boolean(data?.waiting);

  function openPopover() {
    popover?.setDraft(id, "");
    popover?.openEdge(id);
  }

  function closePopover() {
    popover?.closeEdge(id);
  }

  async function addBlocker(e: React.FormEvent) {
    e.preventDefault();
    const text = note.trim();
    if (!text) return;
    await updateEdge(id, {
      blockers: [...blockers, { id: newBlockerId(), text, resolved: false }],
    });
    popover?.setDraft(id, "");
    notify("Blocker added");
  }

  async function setBlockerResolved(blocker: EdgeBlocker, resolved: boolean) {
    await updateEdge(id, {
      blockers: blockers.map((item) => (item.id === blocker.id ? { ...item, resolved } : item)),
    });
  }

  async function removeBlocker(blockerId: string) {
    await updateEdge(id, { blockers: blockers.filter((item) => item.id !== blockerId) });
  }

  async function unlink() {
    if (window.confirm("Remove this link between the two blocks?")) {
      await deleteEdge(id);
    }
  }

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd as string} />
      <EdgeLabelRenderer>
        <div
          className="edge-btn-wrap nodrag nopan"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          <button
            type="button"
            className={`edge-btn${blocked ? " edge-btn--blocked" : ""}${waiting ? " edge-btn--waiting" : ""}`}
            title={
              blocked
                ? `${openBlockers.length} blocker${openBlockers.length === 1 ? "" : "s"}: ${openBlockers[0].text}`
                : "Flag a blocker on this link"
            }
            aria-label={blocked ? "Edit blockers" : "Add blocker"}
            onClick={openPopover}
          >
            <Icon name={blocked ? "alert" : "plus"} size={12} />
          </button>

          {open && (
            <form
              ref={setPopoverRef}
              className="edge-popover nodrag nopan nowheel"
              onSubmit={addBlocker}
            >
              {openBlockers.length > 0 && (
                <ul className="edge-popover__blockers">
                  {openBlockers.map((blocker) => (
                    <li key={blocker.id} className="edge-popover__blocker">
                      <Icon name="alert" size={12} />
                      <span>{blocker.text}</span>
                      <button
                        type="button"
                        className="btn btn-icon"
                        title="Mark resolved"
                        aria-label="Resolve blocker"
                        onClick={() => void setBlockerResolved(blocker, true)}
                      >
                        <Icon name="check" size={11} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-icon"
                        title="Remove blocker"
                        aria-label="Remove blocker"
                        onClick={() => void removeBlocker(blocker.id)}
                      >
                        <Icon name="close" size={11} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {resolvedBlockers.length > 0 && (
                <div className="edge-popover__resolved">
                  <span className="edge-popover__resolved-label">
                    <Icon name="check" size={11} /> Resolved ({resolvedBlockers.length})
                  </span>
                  <ul className="edge-popover__blockers">
                    {resolvedBlockers.map((blocker) => (
                      <li key={blocker.id} className="edge-popover__blocker is-resolved">
                        <Icon name="check" size={12} />
                        <span>{blocker.text}</span>
                        <button
                          type="button"
                          className="btn btn-icon"
                          title="Reopen blocker"
                          aria-label="Reopen blocker"
                          onClick={() => void setBlockerResolved(blocker, false)}
                        >
                          <Icon name="undo" size={11} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-icon"
                          title="Remove blocker"
                          aria-label="Remove blocker"
                          onClick={() => void removeBlocker(blocker.id)}
                        >
                          <Icon name="close" size={11} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <textarea
                className="textarea textarea-sm"
                autoFocus
                value={note}
                onChange={(e) => popover?.setDraft(id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") closePopover();
                }}
                placeholder={blocked ? "Add another blocker…" : "What's blocking this step?"}
                style={{ minHeight: 120 }}
              />
              <div className="edge-popover__actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => void unlink()} title="Remove this link">
                  <Icon name="trash" size={12} />
                </button>
                <span className="spacer" />
                <button type="button" className="btn btn-ghost btn-sm" onClick={closePopover}>
                  Close
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={!note.trim()}>
                  Add
                </button>
              </div>
            </form>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
