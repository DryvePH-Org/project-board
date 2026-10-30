"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import { NODE_STATES, nodeStateMeta } from "@/lib/constants";
import { fmtShort } from "@/lib/format";
import { useWorkspace } from "@/lib/store";
import type { NodeComment, NodeState, ProjectNode } from "@/lib/types";

export function NodeInspector({
  node,
  comments,
  edgeCount,
  focusComments,
  onClose,
  onDelete,
}: {
  node: ProjectNode;
  comments: NodeComment[];
  edgeCount: number;
  focusComments?: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const { user, updateNode, addComment, updateComment, deleteComment } = useWorkspace();
  const [title, setTitle] = useState(node.title);
  const [note, setNote] = useState(node.note);
  const [commentBody, setCommentBody] = useState("");
  const [posting, setPosting] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const openComments = comments.filter((comment) => !comment.resolved);
  const resolvedComments = comments.filter((comment) => comment.resolved);

  useEffect(() => {
    setTitle(node.title);
    setNote(node.note);
  }, [node.id, node.title, node.note]);

  useEffect(() => {
    if (focusComments) commentRef.current?.focus();
  }, [focusComments, node.id]);

  function commitTitle() {
    const next = title.trim();
    if (next && next !== node.title) void updateNode(node.id, { title: next });
    if (!next) setTitle(node.title);
  }

  function commitNote() {
    if (note !== node.note) void updateNode(node.id, { note });
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    const body = commentBody.trim();
    if (!body) return;
    setPosting(true);
    const ok = await addComment({ nodeId: node.id, projectId: node.projectId, body, author: user });
    setPosting(false);
    if (ok) setCommentBody("");
  }

  return (
    <aside className="node-inspector" aria-label="Block details">
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

      <p className="node-inspector__meta">
        {edgeCount === 0 ? "No links yet" : `${edgeCount} link${edgeCount === 1 ? "" : "s"}`}
      </p>

      <div className="node-inspector__comments">
        <span className="node-inspector__comments-head">
          <Icon name="comment" size={13} /> Comments{openComments.length > 0 ? ` (${openComments.length})` : ""}
        </span>

        {openComments.length > 0 && (
          <div className="node-inspector__comment-list">
            {openComments.map((c) => (
              <div key={c.id} className="node-inspector__comment">
                <div className="node-inspector__comment-meta">
                  <strong>{c.author || "Teammate"}</strong>
                  <span>{fmtShort(c.createdAt.slice(0, 10))}</span>
                  <button
                    type="button"
                    className="btn btn-icon"
                    title="Mark resolved"
                    aria-label="Resolve comment"
                    onClick={() => void updateComment(c.id, { resolved: true })}
                  >
                    <Icon name="check" size={12} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon"
                    title="Delete comment"
                    aria-label="Delete comment"
                    onClick={() => void deleteComment(c.id)}
                  >
                    <Icon name="trash" size={11} />
                  </button>
                </div>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
        )}

        {resolvedComments.length > 0 && (
          <div className="node-inspector__resolved">
            <span className="node-inspector__resolved-label">
              <Icon name="check" size={11} /> Resolved ({resolvedComments.length})
            </span>
            {resolvedComments.map((c) => (
              <div key={c.id} className="node-inspector__comment is-resolved">
                <div className="node-inspector__comment-meta">
                  <strong>{c.author || "Teammate"}</strong>
                  <span>{fmtShort(c.createdAt.slice(0, 10))}</span>
                  <button
                    type="button"
                    className="btn btn-icon"
                    title="Reopen comment"
                    aria-label="Reopen comment"
                    onClick={() => void updateComment(c.id, { resolved: false })}
                  >
                    <Icon name="undo" size={11} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon"
                    title="Delete comment"
                    aria-label="Delete comment"
                    onClick={() => void deleteComment(c.id)}
                  >
                    <Icon name="trash" size={11} />
                  </button>
                </div>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={submitComment} className="node-inspector__comment-form">
          <textarea
            ref={commentRef}
            className="textarea textarea-sm"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Suggest something or leave a comment…"
            style={{ minHeight: 44 }}
          />
          <button className="btn btn-outline btn-sm" type="submit" disabled={posting || !commentBody.trim()}>
            Comment
          </button>
        </form>
      </div>

      <button
        className="btn btn-outline btn-sm node-inspector__delete"
        type="button"
        onClick={() => {
          if (window.confirm(`Delete “${node.title}” and its links?`)) onDelete(node.id);
        }}
      >
        <Icon name="trash" size={14} /> Delete block
      </button>
    </aside>
  );
}
