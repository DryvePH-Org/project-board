"use client";

import { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { Icon } from "@/components/Icons";
import { useWorkspace } from "@/lib/store";
import type { FlowEdgeType } from "@/lib/flow";

export function FlowEdgeButton({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps<FlowEdgeType>) {
  const { updateEdge, deleteEdge } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(data?.blockerNote ?? "");

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const blocked = Boolean(data?.blocked);

  function openPopover() {
    setNote(data?.blockerNote ?? "");
    setOpen(true);
  }

  async function saveBlocker(e: React.FormEvent) {
    e.preventDefault();
    await updateEdge(id, { blocked: true, blockerNote: note.trim() });
    setOpen(false);
  }

  async function clearBlocker() {
    await updateEdge(id, { blocked: false, blockerNote: "" });
    setOpen(false);
  }

  async function unlink() {
    if (window.confirm("Remove this link between the two blocks?")) {
      await deleteEdge(id);
    }
  }

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd as string} />
      <EdgeLabelRenderer>
        <div
          className="edge-btn-wrap nodrag nopan"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          <button
            type="button"
            className={`edge-btn${blocked ? " edge-btn--blocked" : ""}`}
            title={blocked ? data?.blockerNote || "Blocked" : "Flag a blocker on this link"}
            aria-label={blocked ? "Edit blocker" : "Add blocker"}
            onClick={openPopover}
          >
            <Icon name={blocked ? "alert" : "plus"} size={12} />
          </button>

          {open && (
            <form className="edge-popover" onSubmit={saveBlocker}>
              <textarea
                className="textarea textarea-sm"
                autoFocus
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's blocking this step?"
                style={{ minHeight: 50 }}
              />
              <div className="edge-popover__actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => void unlink()} title="Remove this link">
                  <Icon name="trash" size={12} />
                </button>
                {blocked && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void clearBlocker()}>
                    Clear
                  </button>
                )}
                <span className="spacer" />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save
                </button>
              </div>
            </form>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
