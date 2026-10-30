"use client";

import { useState } from "react";
import { Icon } from "@/components/Icons";
import { SEVERITIES } from "@/lib/constants";
import { relativeDay } from "@/lib/format";
import { useWorkspace } from "@/lib/store";
import type { Blocker, Project, Severity } from "@/lib/types";

export function OverviewModule({
  project,
  blockers,
  open,
}: {
  project: Project;
  blockers: Blocker[];
  open: Blocker[];
}) {
  const { user, addBlocker, updateBlocker, deleteBlocker } = useWorkspace();
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [adding, setAdding] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    const ok = await addBlocker({
      projectId: project.id,
      title: title.trim(),
      detail: "",
      severity,
      owner: user,
    });
    setAdding(false);
    if (ok) setTitle("");
  }

  return (
    <div className="section">
      <div className="section-head">
        <h2>Blockers</h2>
        <span>{open.length > 0 ? `${open.length} open` : "none open"}</span>
      </div>
      <div className="card">
        <div className="card-body" style={{ paddingTop: 12, paddingBottom: blockers.length ? 4 : 12 }}>
          <form className="inline-add" onSubmit={submit} style={{ marginBottom: blockers.length ? 6 : 0 }}>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a blocker — what is in the way?"
            />
            <select
              className="select"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              style={{ width: 112 }}
              aria-label="Severity"
            >
              {SEVERITIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <button className="btn btn-outline btn-sm" type="submit" disabled={adding || !title.trim()}>
              Add
            </button>
          </form>

          {blockers.map((blocker) => (
            <div key={blocker.id} className="blocker-item">
              <span
                className={`pill pill-${blocker.status === "open" ? severityTone(blocker.severity) : "slate"}`}
                style={{ marginTop: 1 }}
              >
                {blocker.status === "resolved" ? "Resolved" : severityLabel(blocker.severity)}
              </span>
              <div className="blocker-main">
                <span className={`blocker-title${blocker.status === "resolved" ? " resolved" : ""}`}>
                  {blocker.title}
                </span>
                <span className="blocker-meta">
                  {blocker.owner ? `${blocker.owner} · ` : ""}
                  raised {relativeDay(blocker.createdAt.slice(0, 10)).toLowerCase()}
                </span>
              </div>
              <button
                className="btn btn-icon"
                type="button"
                title={blocker.status === "open" ? "Mark resolved" : "Reopen"}
                aria-label={blocker.status === "open" ? "Mark resolved" : "Reopen"}
                onClick={() =>
                  void updateBlocker(blocker.id, {
                    status: blocker.status === "open" ? "resolved" : "open",
                    resolvedAt: blocker.status === "open" ? new Date().toISOString() : null,
                  })
                }
              >
                <Icon name={blocker.status === "open" ? "check" : "arrow-up"} size={15} />
              </button>
              <button
                className="btn btn-icon"
                type="button"
                title="Delete blocker"
                aria-label="Delete blocker"
                onClick={() => {
                  if (window.confirm("Delete this blocker?")) void deleteBlocker(blocker.id);
                }}
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function severityTone(severity: Severity) {
  if (severity === "critical" || severity === "high") return "red";
  if (severity === "medium") return "amber";
  return "slate";
}

function severityLabel(severity: Severity) {
  return SEVERITIES.find((s) => s.id === severity)?.label ?? "Medium";
}
