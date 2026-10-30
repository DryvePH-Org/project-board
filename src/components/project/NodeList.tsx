"use client";

import { useState } from "react";
import { Icon } from "@/components/Icons";
import { EmptyState, Pill } from "@/components/ui";
import { NODE_KINDS, NODE_STATES, nodeKindMeta, nodeStateMeta } from "@/lib/constants";
import { dueLabel } from "@/lib/format";
import { useWorkspace } from "@/lib/store";
import type { NodeKind, NodeState, Project, ProjectNode } from "@/lib/types";

export function NodeList({ project, nodes }: { project: Project; nodes: ProjectNode[] }) {
  const { addNode, updateNode, deleteNode } = useWorkspace();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<NodeKind>("step");
  const [adding, setAdding] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    const ok = await addNode({
      projectId: project.id,
      title: title.trim(),
      note: "",
      kind,
      state: "idea",
      dueDate: null,
    });
    setAdding(false);
    if (ok) setTitle("");
  }

  function startRenaming(id: string, nodeTitle: string) {
    setEditingNodeId(id);
    setEditingTitle(nodeTitle);
  }

  function commitRename() {
    if (editingNodeId && editingTitle.trim()) {
      void updateNode(editingNodeId, { title: editingTitle.trim() });
    }
    setEditingNodeId(null);
  }

  return (
    <div className="card">
      <div className="card-body" style={{ paddingTop: 12, paddingBottom: nodes.length ? 4 : 12 }}>
        <form className="inline-add" onSubmit={submit} style={{ marginBottom: nodes.length ? 6 : 0 }}>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a step, milestone, or question"
          />
          <select
            className="select"
            value={kind}
            onChange={(e) => setKind(e.target.value as NodeKind)}
            style={{ width: 120 }}
            aria-label="Kind"
          >
            {NODE_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
          <button className="btn btn-outline btn-sm" type="submit" disabled={adding || !title.trim()}>
            Add
          </button>
        </form>

        {nodes.length === 0 ? (
          <EmptyState
            icon="note"
            title="No steps yet"
            message="Break this project into steps, milestones, or open questions."
          />
        ) : (
          nodes.map((node) => {
            const due = node.dueDate ? dueLabel(node.dueDate, { done: node.state === "done" }) : null;
            return (
              <div key={node.id} className="node-item">
                <Pill tone={nodeStateMeta(node.state).tone} dot>
                  {nodeStateMeta(node.state).label}
                </Pill>

                <div className="node-main">
                  {editingNodeId === node.id ? (
                    <input
                      className="input input-sm"
                      autoFocus
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") setEditingNodeId(null);
                      }}
                    />
                  ) : (
                    <span
                      className={`node-title${node.state === "done" ? " done" : ""}`}
                      onDoubleClick={() => startRenaming(node.id, node.title)}
                      title="Double-click to rename"
                    >
                      {node.kind === "question" && <span className="node-q">?</span>}
                      {node.title}
                    </span>
                  )}
                  <span className="node-meta">
                    {node.kind !== "step" && <span className="tag">{nodeKindMeta(node.kind).label}</span>}
                    {due && <span className="tag">{due.text}</span>}
                  </span>
                </div>

                <select
                  className="select select-sm"
                  value={node.state}
                  aria-label="State"
                  onChange={(e) => void updateNode(node.id, { state: e.target.value as NodeState })}
                >
                  {NODE_STATES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>

                <button
                  className="btn btn-icon"
                  type="button"
                  title="Rename"
                  aria-label="Rename"
                  onClick={() => startRenaming(node.id, node.title)}
                >
                  <Icon name="edit" size={14} />
                </button>
                <button
                  className="btn btn-icon"
                  type="button"
                  title="Delete step"
                  aria-label="Delete step"
                  onClick={() => {
                    if (window.confirm("Delete this step?")) void deleteNode(node.id);
                  }}
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
