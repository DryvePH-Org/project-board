"use client";

import { useState } from "react";
import { Icon } from "@/components/Icons";
import { fmtShort } from "@/lib/format";
import { useWorkspace } from "@/lib/store";
import type { NodeComment, ProjectNode } from "@/lib/types";
import { useOverlayPanel } from "./OverlayLayout";

export function CommentThread({
  node,
  comments,
  onClose,
}: {
  node: ProjectNode;
  comments: NodeComment[];
  onClose: () => void;
}) {
  const { user, addComment, updateComment, deleteComment } = useWorkspace();
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const setPanelRef = useOverlayPanel<HTMLDivElement>(`comment:${node.id}`, true);
  const openComments = comments.filter((comment) => !comment.resolved);
  const resolvedComments = comments.filter((comment) => comment.resolved);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = body.trim();
    if (!text || posting) return;
    setPosting(true);
    const ok = await addComment({ nodeId: node.id, projectId: node.projectId, body: text, author: user });
    setPosting(false);
    if (ok) setBody("");
  }

  return (
    <div
      ref={setPanelRef}
      className="comment-thread nodrag nopan nowheel"
      role="dialog"
      aria-label={`Comments on ${node.title}`}
    >
      <div className="comment-thread__head">
        <span className="comment-thread__title">
          <Icon name="comment" size={13} />{" "}
          {openComments.length > 0
            ? `${openComments.length} comment${openComments.length === 1 ? "" : "s"}`
            : "Comments"}
        </span>
        <button className="btn btn-icon" type="button" title="Hide comments" aria-label="Hide comments" onClick={onClose}>
          <Icon name="close" size={14} />
        </button>
      </div>

      {openComments.length > 0 && (
        <div className="comment-thread__list">
          {openComments.map((c) => (
            <div key={c.id} className="comment-thread__item">
              <span className="avatar">{(c.author || "T").slice(0, 2).toUpperCase()}</span>
              <div className="comment-thread__content">
                <div className="comment-thread__meta">
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
            </div>
          ))}
        </div>
      )}

      {resolvedComments.length > 0 && (
        <div className="comment-thread__resolved">
          <span className="comment-thread__resolved-label">
            <Icon name="check" size={11} /> Resolved ({resolvedComments.length})
          </span>
          {resolvedComments.map((c) => (
            <div key={c.id} className="comment-thread__item is-resolved">
              <span className="avatar">{(c.author || "T").slice(0, 2).toUpperCase()}</span>
              <div className="comment-thread__content">
                <div className="comment-thread__meta">
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
            </div>
          ))}
        </div>
      )}

      <form className="comment-thread__form" onSubmit={submit}>
        <textarea
          className="textarea textarea-sm"
          autoFocus
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
            if (e.key === "Escape") onClose();
          }}
          placeholder="Add a comment or suggestion…"
          style={{ minHeight: 96 }}
        />
        <div className="comment-thread__actions">
          <span className="tiny muted">Ctrl/⌘ + Enter</span>
          <span className="spacer" />
          <button className="btn btn-ghost btn-sm" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" type="submit" disabled={posting || !body.trim()}>
            Comment
          </button>
        </div>
      </form>
    </div>
  );
}