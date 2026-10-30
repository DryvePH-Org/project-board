import { MarkerType, type Edge, type Node } from "@xyflow/react";
import { Graph, layout } from "@dagrejs/dagre";
import { nodeKindMeta, nodeStateMeta } from "./constants";
import { dueLabel } from "./format";
import type { NodeKind, NodeState, ProjectEdge, ProjectNode } from "./types";

export const NODE_W = 216;
export const NODE_H = 68;

export type FlowNodeData = {
  title: string;
  state: NodeState;
  kind: NodeKind;
  kindLabel: string;
  dueText: string | null;
  tone: string;
  stateLabel: string;
};

export type FlowNodeType = Node<FlowNodeData, "pulse">;

export function edgesFor(edges: ProjectEdge[], projectId: string): ProjectEdge[] {
  return edges.filter((e) => e.projectId === projectId);
}

/** Left-to-right ranks. Unconnected nodes land in the first column. */
export function layoutNodes(nodes: ProjectNode[], edges: ProjectEdge[]): Record<string, { x: number; y: number }> {
  const graph = new Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "LR", nodesep: 36, ranksep: 84 });

  for (const node of nodes) graph.setNode(node.id, { width: NODE_W, height: NODE_H });
  for (const edge of edges) {
    if (graph.hasNode(edge.sourceId) && graph.hasNode(edge.targetId)) {
      graph.setEdge(edge.sourceId, edge.targetId);
    }
  }

  layout(graph);

  const positions: Record<string, { x: number; y: number }> = {};
  for (const node of nodes) {
    const box = graph.node(node.id) as { x?: number; y?: number } | undefined;
    if (box?.x !== undefined && box?.y !== undefined) {
      positions[node.id] = { x: box.x - NODE_W / 2, y: box.y - NODE_H / 2 };
    }
  }
  return positions;
}

export function toFlowNodes(
  nodes: ProjectNode[],
  positions: Record<string, { x: number; y: number }>,
): FlowNodeType[] {
  return nodes.map((node) => {
    const meta = nodeStateMeta(node.state);
    const due = node.dueDate ? dueLabel(node.dueDate, { done: node.state === "done" }) : null;
    return {
      id: node.id,
      type: "pulse",
      position: positions[node.id] ?? { x: 0, y: 0 },
      data: {
        title: node.title,
        state: node.state,
        kind: node.kind,
        kindLabel: nodeKindMeta(node.kind).label,
        dueText: due?.text ?? null,
        tone: meta.tone,
        stateLabel: meta.label,
      },
    };
  });
}

export function toFlowEdges(edges: ProjectEdge[]): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.sourceId,
    target: edge.targetId,
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "var(--line-strong)" },
  }));
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
