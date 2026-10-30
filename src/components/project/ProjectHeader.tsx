"use client";

import { Icon } from "@/components/Icons";
import { Pill } from "@/components/ui";
import type { Health } from "@/lib/analytics";
import { stageMeta } from "@/lib/constants";
import { dueLabel, formatHours, relativeDay } from "@/lib/format";
import type { Project, Update } from "@/lib/types";

type Due = ReturnType<typeof dueLabel>;

export function ProjectHeader({
  project,
  health,
  due,
  totalHours,
  last,
  onLogUpdate,
  onEdit,
  onDelete,
}: {
  project: Project;
  health: Health;
  due: Due;
  totalHours: number;
  last: Update | undefined;
  onLogUpdate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="detail-head">
      <div className="detail-top">
        <div className="detail-titles">
          <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
            <Pill tone={health.tone} dot>
              {health.label}
            </Pill>
            {stageMeta(project.stage).label !== health.label && (
              <Pill tone="slate">{stageMeta(project.stage).label}</Pill>
            )}
          </div>
          <h1 className="detail-title">{project.name}</h1>
          {project.description && <p className="detail-desc">{project.description}</p>}
          <div className="detail-meta">
            <span>
              Owner <strong>{project.owner || "Unassigned"}</strong>
            </span>
            <span>
              Due{" "}
              <strong style={due.tone === "red" ? { color: "var(--red)" } : undefined}>{due.text}</strong>
            </span>
            <span>
              Updated <strong>{last ? relativeDay(last.updateDate) : "never"}</strong>
            </span>
            <span>
              <strong>{formatHours(totalHours)}</strong> logged
            </span>
          </div>
        </div>
      </div>

      <div className="detail-actions">
        <button className="btn btn-primary btn-sm" type="button" onClick={onLogUpdate}>
          <Icon name="note" size={14} /> Log update
        </button>
        <button className="btn btn-outline btn-sm" type="button" onClick={onEdit}>
          <Icon name="edit" size={14} /> Edit
        </button>
        <span className="spacer" />
        <button className="btn btn-danger btn-sm" type="button" onClick={onDelete}>
          <Icon name="trash" size={14} /> Delete
        </button>
      </div>
    </div>
  );
}
