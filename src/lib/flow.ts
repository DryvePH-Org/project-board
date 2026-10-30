import { MarkerType, type Edge, type Node } from "@xyflow/react";
import { nodeStateMeta } from "./constants";
import type { EdgeBlocker, NodeState, ProjectEdge, ProjectNode } from "./types";

export const EDGE_COLOR = "#4f46e5";
export const EDGE_COLOR_BLOCKED = "#c02626";
export const EDGE_COLOR_WAITING = "#a9acd9";

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
  blockers: EdgeBlocker[];
  waiting: boolean;
};

/** Links only flow once the block they point to is being worked on. */
const FLOWING_STATES: NodeState[] = ["in_progress", "done"];

function openBlockers(edge: ProjectEdge): EdgeBlocker[] {
  return edge.blockers.filter((blocker) => !blocker.resolved);
}

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


/** Edge ids that should stop flowing: every blocked edge, plus every edge
 * reachable after it. */
function haltedEdgeIds(edges: ProjectEdge[]): Set<string> {
  const outgoing = new Map<string, ProjectEdge[]>();
  for (const e of edges) {
    const list = outgoing.get(e.sourceId) ?? [];
    list.push(e);
    outgoing.set(e.sourceId, list);
  }

  const halted = new Set<string>();
  const stack = edges.filter((e) => openBlockers(e).length > 0);
  while (stack.length > 0) {
    const edge = stack.pop()!;
    if (halted.has(edge.id)) continue;
    halted.add(edge.id);
    for (const next of outgoing.get(edge.targetId) ?? []) stack.push(next);
  }
  return halted;
}
export function toFlowEdges(
  edges: ProjectEdge[],
  nodeStates: Record<string, NodeState> = {},
): FlowEdgeType[] {
  const halted = haltedEdgeIds(edges);
  return edges.map((edge) => {
    const isHalted = halted.has(edge.id);
    const blocked = openBlockers(edge).length > 0;
    const waiting = isHalted && !blocked;
    const flowing = FLOWING_STATES.includes(nodeStates[edge.targetId]);
    const color = blocked ? EDGE_COLOR_BLOCKED : waiting ? EDGE_COLOR_WAITING : EDGE_COLOR;
    return {
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      type: "pulse",
      animated: !isHalted && flowing,
      style: { stroke: color, strokeWidth: 2, strokeDasharray: waiting ? "5 5" : undefined },
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color },
      data: { blockers: edge.blockers, waiting },
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