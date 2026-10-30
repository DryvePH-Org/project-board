"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";
import { NODE_KINDS, NODE_STATES, nodeStateMeta } from "@/lib/constants";
import { useWorkspace } from "@/lib/store";
import type { NodeKind, NodeState, ProjectNode } from "@/lib/types";

export function NodeInspector({
  node,
  edgeCount,
  onClose,
  onDelete,
}: {
  node: ProjectNode;
  edgeCount: number;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const { updateNode } = useWorkspace();
  const [title, setTitle] = useState(node.title);
  const [note, setNote] = useState(node.note);

  useEffect(() => {
    setTitle(node.title);
    setNote(node.note);
  }, [node.id, node.title, node.note]);

  function commitTitle() {
    const next = title.trim();
    if (next && next !== node.title) void updateNode(node.id, { title: next });
    if (!next) setTitle(node.title);
  }

  function commitNote() {
    if (note !== node.note) void updateNode(node.id, { note });
  }

  return (
    <aside className="node-inspector" aria-label="Step details">
      <div className="node-inspector__head">
        <span className={`pill pill-${nodeStateMeta(node.state).tone}`}>{nodeStateMeta(node.state).label}</span>
        <button className="btn btn-icon" type="button" title="Close" aria-label="Close" onClick={onClose}>
          <Icon name="close" size={14} />
        </button>
      </div>

      <label className="node-inspector__field">
        <span>Title</span>
        <input
          className="input input-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitTitle();
          }}
        />
      </label>

      <label className="node-inspector__field">
        <span>Notes</span>
        <textarea
          className="textarea textarea-sm"
          value={note}
          placeholder="Anything worth remembering about this step"
          onChange={(e) => setNote(e.target.value)}
          onBlur={commitNote}
          style={{ minHeight: 58 }}
        />
      </label>

      <label className="node-inspector__field">
        <span>State</span>
        <select
          className="select select-sm"
          value={node.state}
          onChange={(e) => void updateNode(node.id, { state: e.target.value as NodeState })}
        >
          {NODE_STATES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="node-inspector__field">
        <span>Kind</span>
        <select
          className="select select-sm"
          value={node.kind}
          onChange={(e) => void updateNode(node.id, { kind: e.target.value as NodeKind })}
        >
          {NODE_KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </label>

      <label className="node-inspector__field">
        <span>Due</span>
        <input
          className="input input-sm"
          type="date"
          value={node.dueDate ?? ""}
          onChange={(e) => void updateNode(node.id, { dueDate: e.target.value || null })}
        />
      </label>

      <p className="node-inspector__meta">{edgeCount === 0 ? "No links yet" : `${edgeCount} link${edgeCount === 1 ? "" : "s"}`}</p>

      <button
        className="btn btn-outline btn-sm node-inspector__delete"
        type="button"
        onClick={() => {
          if (window.confirm(`Delete “${node.title}” and its links?`)) onDelete(node.id);
        }}
      >
        <Icon name="trash" size={14} /> Delete step
      </button>
    </aside>
  );
}
