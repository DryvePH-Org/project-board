import { statusMeta } from "./constants";
import type { NodeComment, Project, ProjectEdge, ProjectNode } from "./types";

export function nodesFor(nodes: ProjectNode[], projectId: string): ProjectNode[] {
  return nodes
    .filter((n) => n.projectId === projectId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function edgesFor(edges: ProjectEdge[], projectId: string): ProjectEdge[] {
  return edges.filter((e) => e.projectId === projectId);
}

export function commentsFor(comments: NodeComment[], projectId: string): NodeComment[] {
  return comments.filter((c) => c.projectId === projectId);
}

export interface Health {
  label: string;
  tone: string;
}

export function projectHealth(project: Project): Health {
  const meta = statusMeta(project.status);
  return { label: meta.label, tone: meta.tone };
}
