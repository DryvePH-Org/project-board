"use client";

import { Icon } from "@/components/Icons";
import { Pill } from "@/components/ui";
import { statusMeta } from "@/lib/constants";
import type { Project } from "@/lib/types";

export function ProjectHeader({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = statusMeta(project.status);

  return (
    <div className="detail-head">
      <div className="detail-top">
        <div className="detail-titles">
          <Pill tone={status.tone} dot>
            {status.label}
          </Pill>
          <h1 className="detail-title">{project.name}</h1>
          <div className="detail-meta">
            <span>
              Owner <strong>{project.owner || "Unassigned"}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="detail-actions">
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
