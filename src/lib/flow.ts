import { MarkerType, type Edge, type Node } from "@xyflow/react";
import { nodeStateMeta } from "./constants";
import type { NodeState, ProjectEdge, ProjectNode } from "./types";

export const EDGE_COLOR = "#4f46e5";
export const EDGE_COLOR_BLOCKED = "#c02626";

export const NODE_W = 260;
export const NODE_H = 92;

export type FlowNodeData = {
  title: string;
  state: NodeState;
  tone: string;
  stateLabel: string;
  commentCount: number;
};

export type FlowNodeType = Node<FlowNodeData, "pulse">;

export type FlowEdgeData = {
  blocked: boolean;
  blockerNote: string;
};

export type FlowEdgeType = Edge<FlowEdgeData, "pulse">;

export function toFlowNodes(nodes: ProjectNode[], commentCounts: Record<string, number>): FlowNodeType[] {
  return nodes.map((node) => {
    const meta = nodeStateMeta(node.state);
    return {
      id: node.id,
      type: "pulse",
      position: { x: node.positionX, y: node.positionY },
      data: {
        title: node.title,
        state: node.state,
        tone: meta.tone,
        stateLabel: meta.label,
        commentCount: commentCounts[node.id] ?? 0,
      },
    };
  });
}

export function toFlowEdges(edges: ProjectEdge[]): FlowEdgeType[] {
  return edges.map((edge) => {
    const color = edge.blocked ? EDGE_COLOR_BLOCKED : EDGE_COLOR;
    return {
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      type: "pulse",
      animated: true,
      style: { stroke: color, strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color },
      data: { blocked: edge.blocked, blockerNote: edge.blockerNote },
    };
  });
}

/** True when linking source → target would close a loop, i.e. target already
 * reaches source. The edges table has no cycle constraint, so this is the guard. */
export function wouldCreateCycle(edges: ProjectEdge[], sourceId: string, targetId: string): boolean {
  const outgoing = new Map<string, string[]>();
  for (const edge of edges) {
    const list = outgoing.get(edge.sourceId) ?? [];
    list.push(edge.targetId);
    outgoing.set(edge.sourceId, list);
  }

  const seen = new Set<string>();
  const stack = [targetId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (id === sourceId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const next of outgoing.get(id) ?? []) stack.push(next);
  }
  return false;
}

/** Where to drop a newly added block: below everything already on the board,
 * so it never lands on top of (or overlapping) an existing block. */
export function nextNodePosition(existing: ProjectNode[]): { x: number; y: number } {
  if (existing.length === 0) return { x: 60, y: 120 };
  const minX = Math.min(...existing.map((n) => n.positionX));
  const maxY = Math.max(...existing.map((n) => n.positionY));
  return { x: minX, y: maxY + NODE_H + 56 };
}
