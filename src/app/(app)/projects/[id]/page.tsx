"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import { ProjectForm } from "@/components/ProjectForm";
import { EmptyState, Field, Pill, StatusPill } from "@/components/ui";
import { openBlockersFor, projectBlockers, projectHealth, updatesFor } from "@/lib/analytics";
import { SEVERITIES, stageMeta } from "@/lib/constants";
import { dueLabel, fmtShort, formatHours, relativeDay, todayISO } from "@/lib/format";
import { useWorkspace } from "@/lib/store";
import type { ProjectStatus, Severity } from "@/lib/types";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    data,
    user,
    updateProject,
    deleteProject,
    deleteUpdate,
    addUpdate,
    addBlocker,
    updateBlocker,
    deleteBlocker,
  } = useWorkspace();

  const project = data.projects.find((p) => p.id === params.id);
  const updates = useMemo(
    () => (project ? updatesFor(data.updates, project.id) : []),
    [data.updates, project],
  );
  const blockers = useMemo(
    () => (project ? projectBlockers(data.blockers, project.id) : []),
    [data.blockers, project],
  );
  const open = project ? openBlockersFor(data.blockers, project.id) : [];

  const [editOpen, setEditOpen] = useState(false);
  const composerRef = useRef<HTMLDivElement>(null);

  // Daily update form
  const [summary, setSummary] = useState("");
  const [progress, setProgress] = useState(project?.progress ?? 0);
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "on_track");
  const [hours, setHours] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [blockerNote, setBlockerNote] = useState("");
  const [author, setAuthor] = useState(user || "");
  const [date, setDate] = useState(todayISO());
  const [posting, setPosting] = useState(false);

  // Blocker form
  const [blockerTitle, setBlockerTitle] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [addingBlocker, setAddingBlocker] = useState(false);

  if (!project) {
    return (
      <div className="card">
        <EmptyState
          icon="projects"
          title="Project not found"
          message="It may have been deleted, or the link is out of date."
          action={
            <Link href="/" className="btn btn-outline" style={{ marginTop: 6 }}>
              Back to projects
            </Link>
          }
        />
      </div>
    );
  }

  const due = dueLabel(project.dueDate, { done: project.stage === "done" });
  const health = projectHealth(project, data.updates, data.blockers);
  const totalHours = updates.reduce((sum, u) => sum + (u.hours ?? 0), 0);
  const last = updates[0];

  async function postUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) return;
    setPosting(true);
    const ok = await addUpdate({
      projectId: project!.id,
      updateDate: date,
      status,
      progress,
      hours: hours.trim() === "" ? null : Number(hours),
      summary: summary.trim(),
      nextStep: nextStep.trim(),
      blockersNote: blockerNote.trim(),
      author: author.trim(),
    });
    setPosting(false);
    if (ok) {
      setSummary("");
      setNextStep("");
      setBlockerNote("");
      setHours("");
    }
  }

  async function addTrackedBlocker(e: React.FormEvent) {
    e.preventDefault();
    if (!blockerTitle.trim()) return;
    setAddingBlocker(true);
    const ok = await addBlocker({
      projectId: project!.id,
      title: blockerTitle.trim(),
      detail: "",
      severity,
      owner: author.trim() || user,
    });
    setAddingBlocker(false);
    if (ok) setBlockerTitle("");
  }

  return (
    <>
      <Link href="/" className="back-link">
        <Icon name="chevron-left" size={14} /> All projects
      </Link>

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

          <div className="detail-pct">
            <strong>{project.progress}%</strong>
            <span>complete</span>
          </div>
        </div>

        <div className="progress">
          <span style={{ width: `${project.progress}%`, background: project.color }} />
        </div>

        <div className="detail-actions">
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={() => {
              composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              composerRef.current?.querySelector("textarea")?.focus();
            }}
          >
            <Icon name="note" size={14} /> Log update
          </button>
          <button className="btn btn-outline btn-sm" type="button" onClick={() => setEditOpen(true)}>
            <Icon name="edit" size={14} /> Edit
          </button>
          <span className="spacer" />
          <button
            className="btn btn-danger btn-sm"
            type="button"
            onClick={() => {
              if (window.confirm(`Delete “${project.name}” and all its history? This cannot be undone.`)) {
                void deleteProject(project.id).then((ok) => {
                  if (ok) router.push("/");
                });
              }
            }}
          >
            <Icon name="trash" size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="composer section" ref={composerRef}>
        <div className="composer-head">
          <h2>Today&apos;s update</h2>
          <span className="tiny muted">One short note is enough</span>
        </div>
        <form className="composer-body" onSubmit={postUpdate}>
          <textarea
            className="textarea"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="What moved today? Keep it short — what you did, decided or learned."
            required
            style={{ minHeight: 64 }}
          />

          <div className="composer-controls">
            <div className="slider">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                aria-label="Progress"
              />
              <span className="slider-value">{progress}%</span>
            </div>

            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              style={{ width: 132 }}
              aria-label="Status"
            >
              <option value="on_track">On track</option>
              <option value="at_risk">At risk</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>

            <button className="btn btn-primary btn-sm" type="submit" disabled={posting || !summary.trim()}>
              {posting ? "Posting…" : "Post update"}
            </button>
          </div>

          <details className="composer-more">
            <summary>More options</summary>
            <div className="composer-more-grid">
              <Field label="Hours worked">
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Your name">
                <input
                  className="input"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Who is reporting"
                />
              </Field>
              <Field label="Next step" span>
                <input
                  className="input"
                  value={nextStep}
                  onChange={(e) => setNextStep(e.target.value)}
                  placeholder="The most important next thing"
                />
              </Field>
              <Field label="Blocking note" span>
                <input
                  className="input"
                  value={blockerNote}
                  onChange={(e) => setBlockerNote(e.target.value)}
                  placeholder="Anything slowing this down?"
                />
              </Field>
              <Field label="Date">
                <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
            </div>
          </details>
        </form>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Blockers</h2>
          <span>
            {open.length > 0 ? `${open.length} open` : "none open"}
          </span>
        </div>
        <div className="card">
          <div className="card-body" style={{ paddingTop: 12, paddingBottom: blockers.length ? 4 : 12 }}>
            <form className="inline-add" onSubmit={addTrackedBlocker} style={{ marginBottom: blockers.length ? 6 : 0 }}>
              <input
                className="input"
                value={blockerTitle}
                onChange={(e) => setBlockerTitle(e.target.value)}
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
              <button className="btn btn-outline btn-sm" type="submit" disabled={addingBlocker || !blockerTitle.trim()}>
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

      <div className="section">
        <div className="section-head">
          <h2>Updates</h2>
          <span>{updates.length}</span>
        </div>
        <div className="card">
          <div className="card-body" style={{ paddingTop: updates.length ? 10 : 0 }}>
            {updates.length === 0 ? (
              <EmptyState
                icon="note"
                title="No updates yet"
                message="Use the box above to post the first one."
              />
            ) : (
              updates.map((update) => (
                <div key={update.id} className="update-item">
                  <span className="update-dot" style={{ background: project.color }} />
                  <div className="update-main">
                    <div className="update-top">
                      <span className="update-when">{relativeDay(update.updateDate)}</span>
                      <span>{fmtShort(update.updateDate)}</span>
                      <StatusPill status={update.status} />
                      <span className="spacer" />
                      <span>{update.author || "—"}</span>
                      {update.hours ? <span className="tag">{formatHours(update.hours)}</span> : null}
                      <button
                        className="btn btn-icon"
                        type="button"
                        style={{ padding: 3 }}
                        title="Delete update"
                        aria-label="Delete update"
                        onClick={() => {
                          if (window.confirm("Delete this update?")) void deleteUpdate(update.id);
                        }}
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>

                    <p className="update-text">{update.summary}</p>

                    {update.nextStep && (
                      <div className="update-next">
                        <Icon name="arrow-right" size={12} style={{ marginTop: 2, flex: "none", opacity: 0.55 }} />
                        <span>{update.nextStep}</span>
                      </div>
                    )}

                    {update.blockersNote && (
                      <div className="update-note">
                        <Icon name="alert" size={12} style={{ marginTop: 2, flex: "none" }} />
                        <span>{update.blockersNote}</span>
                      </div>
                    )}

                    <div className="update-meta">
                      <span>Progress {update.progress}%</span>
                      {update.hours ? <span>· {formatHours(update.hours)}</span> : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {editOpen && <ProjectForm project={project} onClose={() => setEditOpen(false)} />}
    </>
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
