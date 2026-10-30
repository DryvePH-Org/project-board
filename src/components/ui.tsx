"use client";

import { useEffect, type ReactNode } from "react";
import { Icon, type IconName } from "./Icons";
import { statusMeta } from "@/lib/constants";
import type { ProjectStatus } from "@/lib/types";

/* ---------------------------------------------------------------- pills */

export function Pill({
  tone = "slate",
  children,
  dot = false,
  className = "",
}: {
  tone?: string;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={`pill pill-${tone} ${className}`}>
      {dot && <span className="pill-dot" />}
      {children}
    </span>
  );
}

export function StatusPill({ status, dot = true }: { status: ProjectStatus; dot?: boolean }) {
  const meta = statusMeta(status);
  return (
    <Pill tone={meta.tone} dot={dot}>
      {meta.label}
    </Pill>
  );
}

/* ------------------------------------------------------------------- ui */

export function EmptyState({
  icon = "spark",
  title,
  message,
  action,
}: {
  icon?: IconName;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} size={19} />
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close" type="button">
            <Icon name="close" size={17} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  span = false,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  span?: boolean;
}) {
  return (
    <div className={`field${span ? " span-2" : ""}`}>
      <label>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}
