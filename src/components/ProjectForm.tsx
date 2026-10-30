"use client";

import { useState } from "react";
import { PROJECT_COLORS, STATUSES } from "@/lib/constants";
import { useWorkspace } from "@/lib/store";
import type { Project, ProjectStatus } from "@/lib/types";
import { Field, Modal } from "./ui";

export function ProjectForm({ project, onClose }: { project?: Project; onClose: () => void }) {
  const { createProject, updateProject, user } = useWorkspace();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [owner, setOwner] = useState(project?.owner ?? user ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "on_track");
  const [color, setColor] = useState(project?.color ?? PROJECT_COLORS[0]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      owner: owner.trim(),
      status,
      color,
    };
    const ok = project ? await updateProject(project.id, payload) : await createProject(payload);
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Modal
      title={project ? "Edit project" : "New project"}
      subtitle={project ? "Changes are visible to everyone on the team." : "Just the basics — you can map the board right after."}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" form="project-form" disabled={saving || !name.trim()}>
            {saving ? "Saving…" : project ? "Save changes" : "Create project"}
          </button>
        </>
      }
    >
      <form id="project-form" className="form-grid" onSubmit={submit}>
        <Field label="Project name" span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Northwind website redesign"
            autoFocus
            required
          />
        </Field>

        <Field label="Owner">
          <input
            className="input"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Who is driving this?"
          />
        </Field>

        <Field label="Status">
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Colour" span>
          <div className="color-row">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Use colour ${c}`}
                className={`swatch${color === c ? " on" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </Field>

        <Field label="Description" span hint="Optional — one line so anyone can understand this project at a glance.">
          <textarea
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short context for the team."
          />
        </Field>
      </form>
    </Modal>
  );
}
