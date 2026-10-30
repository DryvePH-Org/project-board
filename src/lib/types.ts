export type Stage = "backlog" | "planning" | "in_progress" | "review" | "launch" | "done";
export type ProjectStatus = "on_track" | "at_risk" | "blocked" | "done";
export type Priority = "low" | "medium" | "high";
export type Severity = "low" | "medium" | "high" | "critical";
export type BlockerStatus = "open" | "resolved";
export type NodeState = "idea" | "planned" | "in_progress" | "blocked" | "done";
export type NodeKind = "step" | "milestone" | "question";

export interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
  stage: Stage;
  priority: Priority;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  color: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Update {
  id: string;
  projectId: string;
  updateDate: string;
  status: ProjectStatus;
  hours: number | null;
  summary: string;
  nextStep: string;
  blockersNote: string;
  author: string;
  createdAt: string;
}

export interface Blocker {
  id: string;
  projectId: string;
  title: string;
  detail: string;
  severity: Severity;
  status: BlockerStatus;
  owner: string;
  createdAt: string;
  resolvedAt: string | null;
}

/** A step, milestone, or open question on a project's checklist/flow. Named
 * ProjectNode, not Node, to avoid colliding with the DOM's global Node type. */
export interface ProjectNode {
  id: string;
  projectId: string;
  title: string;
  note: string;
  kind: NodeKind;
  state: NodeState;
  dueDate: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface DataSet {
  projects: Project[];
  updates: Update[];
  blockers: Blocker[];
  nodes: ProjectNode[];
  edges: ProjectEdge[];
}

/** An arrow between two nodes on the flow canvas. No editable fields, so there
 * is no update path — an edge is created or deleted. */
export interface ProjectEdge {
  id: string;
  projectId: string;
  sourceId: string;
  targetId: string;
  createdAt: string;
}

export interface ProjectInput {
  name: string;
  description: string;
  owner: string;
  stage: Stage;
  priority: Priority;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  color: string;
}

export interface UpdateInput {
  projectId: string;
  updateDate: string;
  status: ProjectStatus;
  hours: number | null;
  summary: string;
  nextStep: string;
  blockersNote: string;
  author: string;
}

export interface BlockerInput {
  projectId: string;
  title: string;
  detail: string;
  severity: Severity;
  owner: string;
}

export interface NodeInput {
  projectId: string;
  title: string;
  note: string;
  kind: NodeKind;
  state: NodeState;
  dueDate: string | null;
}

export interface EdgeInput {
  projectId: string;
  sourceId: string;
  targetId: string;
}

export interface Repository {
  kind: "supabase" | "demo";
  loadAll(): Promise<DataSet>;
  createProject(input: ProjectInput): Promise<void>;
  updateProject(id: string, patch: Partial<Project>): Promise<void>;
  deleteProject(id: string): Promise<void>;
  addUpdate(input: UpdateInput): Promise<void>;
  deleteUpdate(id: string): Promise<void>;
  addBlocker(input: BlockerInput): Promise<void>;
  updateBlocker(id: string, patch: Partial<Blocker>): Promise<void>;
  deleteBlocker(id: string): Promise<void>;
  addNode(input: NodeInput): Promise<void>;
  updateNode(id: string, patch: Partial<ProjectNode>): Promise<void>;
  deleteNode(id: string): Promise<void>;
  addEdge(input: EdgeInput): Promise<void>;
  deleteEdge(id: string): Promise<void>;
}
