"use client";

import { Icon } from "@/components/Icons";
import { fmtShort } from "@/lib/format";
import type { NodeComment, ProjectEdge, ProjectNode } from "@/lib/types";

export function BoardNotes({
  nodes,
  edges,
  comments,
  onClose,
}: {
  nodes: ProjectNode[];
  edges: ProjectEdge[];
  comments: NodeComment[];
  onClose: () => void;
}) {
  const titleFor = (id: string) => nodes.find((n) => n.id === id)?.title ?? "Untitled block";
  const notedEdges = edges.filter((edge) => edge.blockers.length > 0);
  const blockerCount = notedEdges.reduce(
    (total, edge) => total + edge.blockers.filter((blocker) => !blocker.resolved).length,
    0,
  );
  const commentedNodes = nodes.filter((node) => comments.some((c) => c.nodeId === node.id));
  const openCommentCount = comments.filter((comment) => !comment.resolved).length;

  return (
    <aside className="board-notes" aria-label="Comments and blockers">
      <div className="board-notes__head">
        <span className="board-notes__title">
          <Icon name="comment" size={13} /> Comments & blockers
        </span>
        <button className="btn btn-icon" type="button" title="Close" aria-label="Close" onClick={onClose}>
          <Icon name="close" size={14} />
        </button>
      </div>

      {notedEdges.length === 0 && commentedNodes.length === 0 && (
        <p className="tiny muted">No comments or blockers on this board yet.</p>
      )}

      {notedEdges.length > 0 && (
        <section className="board-notes__section">
          <h4>
            <Icon name="alert" size={12} /> Blockers
            <span className="tab-count">{blockerCount}</span>
          </h4>
          {notedEdges.map((edge) => {
            const open = edge.blockers.filter((blocker) => !blocker.resolved);
            const resolved = edge.blockers.filter((blocker) => blocker.resolved);
            return (
              <div key={edge.id} className="board-notes__item">
                <p className="board-notes__label">
                  {titleFor(edge.sourceId)} → {titleFor(edge.targetId)}
                </p>
                {open.length > 0 && (
                  <ul className="board-notes__notes">
                    {open.map((blocker) => (
                      <li key={blocker.id}>{blocker.text}</li>
                    ))}
                  </ul>
                )}
                {resolved.length > 0 && (
                  <>
                    <p className="board-notes__resolved-label">Resolved ({resolved.length})</p>
                    <ul className="board-notes__notes">
                      {resolved.map((blocker) => (
                        <li key={blocker.id} className="is-resolved">
                          {blocker.text}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            );
          })}
        </section>
      )}

      {commentedNodes.length > 0 && (
        <section className="board-notes__section">
          <h4>
            <Icon name="comment" size={12} /> Comments
            <span className="tab-count">{openCommentCount}</span>
          </h4>
          {commentedNodes.map((node) => {
            const nodeComments = comments.filter((comment) => comment.nodeId === node.id);
            const open = nodeComments.filter((comment) => !comment.resolved);
            const resolved = nodeComments.filter((comment) => comment.resolved);
            return (
              <div key={node.id} className="board-notes__item">
                <p className="board-notes__label">{node.title}</p>
                {open.map((comment) => (
                  <div key={comment.id} className="board-notes__comment">
                    <span className="board-notes__meta">
                      <strong>{comment.author || "Teammate"}</strong> ·{" "}
                      {fmtShort(comment.createdAt.slice(0, 10))}
                    </span>
                    <p>{comment.body}</p>
                  </div>
                ))}
                {resolved.length > 0 && (
                  <>
                    <p className="board-notes__resolved-label">Resolved ({resolved.length})</p>
                    {resolved.map((comment) => (
                      <div key={comment.id} className="board-notes__comment is-resolved">
                        <span className="board-notes__meta">
                          <strong>{comment.author || "Teammate"}</strong> ·{" "}
                          {fmtShort(comment.createdAt.slice(0, 10))}
                        </span>
                        <p>{comment.body}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </section>
      )}
    </aside>
  );
}
