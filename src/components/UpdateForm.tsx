"use client";

import { useMemo, useState } from "react";
import { STAGES, STATUSES } from "@/lib/constants";
import { useWorkspace } from "@/lib/store";
import { todayISO } from "@/lib/format";
import type { ProjectStatus } from "@/lib/types";
import { Field, Modal } from "./ui";

export function UpdateForm({ onClose }: { onClose: () => void }) {
  const { data, user, addUpdate } = useWorkspace();
  const active = useMemo(() => data.projects.filter((p) => !p.archived), [data.projects]);

  const [selected, setSelected] = useState(active[0]?.id ?? "");
  const project = active.find((p) => p.id === selected);

  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "on_track");
  const [date, setDate] = useState(todayISO());
  const [author, setAuthor] = useState(user || "");
  const [hours, setHours] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [blockers, setBlockers] = useState("");
  const [saving, setSaving] = useState(false);

  function pick(id: string) {
    setSelected(id);
    const p = active.find((item) => item.id === id);
    if (p) {
      setStatus(p.status);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !summary.trim()) return;
    setSaving(true);
    const ok = await addUpdate({
      projectId: selected,
      updateDate: date,
      status,
      hours: hours.trim() === "" ? null : Number(hours),
      summary: summary.trim(),
      nextStep: nextStep.trim(),
      blockersNote: blockers.trim(),
      author: author.trim(),
    });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Modal
      title="Log an update"
      subtitle="A short note is enough. Takes about a minute."
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" form="update-form" disabled={saving || !summary.trim() || !selected}>
            {saving ? "Saving…" : "Post update"}
          </button>
        </>
      }
    >
      <form id="update-form" className="form-grid" onSubmit={submit}>
        <Field label="Project" span>
          <select className="select" value={selected} onChange={(e) => pick(e.target.value)} required>
            {active.length === 0 && (
              <option value="" disabled>
                No projects yet
              </option>
            )}
            {active.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {STAGES.find((s) => s.id === p.stage)?.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="What moved?" span>
          <textarea
            className="textarea"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Done, decided, or learned — keep it short."
            autoFocus
            required
          />
        </Field>

        <Field label="Status" span>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <details className="composer-more span-2">
          <summary>More options</summary>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <Field label="Date">
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Reported by">
              <input
                className="input"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Your name"
              />
            </Field>
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
            <Field label="Next step">
              <input
                className="input"
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                placeholder="Most important next thing"
              />
            </Field>
            <Field label="Blocking note" span>
              <input
                className="input"
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="Optional — anything slowing this down?"
              />
            </Field>
          </div>
        </details>
      </form>
    </Modal>
  );
}
