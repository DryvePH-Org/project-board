"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import { EmptyState, Field, StatusPill } from "@/components/ui";
import { fmtShort, formatHours, relativeDay, todayISO } from "@/lib/format";
import { useWorkspace } from "@/lib/store";
import type { Project, ProjectStatus, Update } from "@/lib/types";

export function FreeFormModule({
  project,
  updates,
  focusComposer,
  onFocusHandled,
}: {
  project: Project;
  updates: Update[];
  focusComposer: boolean;
  onFocusHandled: () => void;
}) {
  const { user, addUpdate, deleteUpdate } = useWorkspace();
  const composerRef = useRef<HTMLDivElement>(null);

  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [hours, setHours] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [blockerNote, setBlockerNote] = useState("");
  const [author, setAuthor] = useState(user || "");
  const [date, setDate] = useState(todayISO());
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!focusComposer) return;
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    composerRef.current?.querySelector("textarea")?.focus();
    onFocusHandled();
  }, [focusComposer, onFocusHandled]);

  async function postUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) return;
    setPosting(true);
    const ok = await addUpdate({
      projectId: project.id,
      updateDate: date,
      status,
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

  return (
    <>
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
          <h2>Updates</h2>
          <span>{updates.length}</span>
        </div>
        <div className="card">
          <div className="card-body" style={{ paddingTop: updates.length ? 10 : 0 }}>
            {updates.length === 0 ? (
              <EmptyState icon="note" title="No updates yet" message="Use the box above to post the first one." />
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
                      {update.hours ? <span>· {formatHours(update.hours)}</span> : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
