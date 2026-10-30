"use client";

import { Pill } from "@/components/ui";
import { statusMeta } from "@/lib/constants";
import { fmtShort } from "@/lib/format";
import type { Project } from "@/lib/types";

export function OverviewModule({ project, nodeCount }: { project: Project; nodeCount: number }) {
  const status = statusMeta(project.status);

  return (
    <div className="section">
      <div className="section-head">
        <h2>Details</h2>
      </div>
      <div className="card">
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div className="tiny muted" style={{ marginBottom: 4 }}>
              Description
            </div>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              {project.description || "No description yet."}
            </p>
          </div>

          <div className="overview-grid">
            <div>
              <div className="tiny muted">Status</div>
              <Pill tone={status.tone} dot>
                {status.label}
              </Pill>
            </div>
            <div>
              <div className="tiny muted">Owner</div>
              <strong>{project.owner || "Unassigned"}</strong>
            </div>
            <div>
              <div className="tiny muted">Blocks on board</div>
              <strong>{nodeCount}</strong>
            </div>
            <div>
              <div className="tiny muted">Created</div>
              <strong>{fmtShort(project.createdAt.slice(0, 10))}</strong>
            </div>
            <div>
              <div className="tiny muted">Last updated</div>
              <strong>{fmtShort(project.updatedAt.slice(0, 10))}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
