"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Icon } from "@/components/Icons";
import type { FlowNodeType } from "@/lib/flow";

const TONE_VAR: Record<string, string> = {
  green: "var(--green)",
  amber: "var(--amber)",
  red: "var(--red)",
  blue: "var(--blue)",
  slate: "var(--slate)",
  muted: "var(--muted)",
};

export function FlowNodeCard({ data }: NodeProps<FlowNodeType>) {
  const accent = TONE_VAR[data.tone] ?? "var(--muted)";
  return (
    <div
      className={`flow-node${data.state === "idea" ? " flow-node--dashed" : ""}`}
      style={{ ["--node-accent" as string]: accent }}
    >
      <Handle type="target" position={Position.Left} className="flow-node__handle" />

      <div className="flow-node__top">
        <span className="flow-node__dot" style={{ background: accent }} />
        <span className="flow-node__state">{data.stateLabel}</span>
        <button
          type="button"
          className="flow-node__comment-btn nodrag"
          title={data.commentCount > 0 ? `${data.commentCount} comment${data.commentCount === 1 ? "" : "s"}` : "Add a comment"}
          aria-label="Comment on this block"
        >
          <Icon name="comment" size={13} />
          {data.commentCount > 0 && <span className="flow-node__comment-count">{data.commentCount}</span>}
        </button>
      </div>

      <p className="flow-node__title">{data.title}</p>

      <Handle type="source" position={Position.Right} className="flow-node__handle" />
    </div>
  );
}
