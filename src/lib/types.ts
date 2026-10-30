export type ProjectStatus = "on_track" | "at_risk" | "blocked" | "done";
export type NodeState = "idea" | "planned" | "in_progress" | "blocked" | "done";

export interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
  status: ProjectStatus;
  color: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A block on a project's freeform board. Named ProjectNode, not Node, to
 * avoid colliding with the DOM's global Node type. */
export interface ProjectNode {
  id: string;
  projectId: string;
  title: string;
  note: string;
  state: NodeState;
  positionX: number;
  positionY: number;
  createdAt: string;
}

/** An arrow between two nodes on the board. Can be flagged as blocked, with
 * a short reason, directly from the line. */
export interface ProjectEdge {
  id: string;
  projectId: string;
  sourceId: string;
  targetId: string;
  blocked: boolean;
  blockerNote: string;
  createdAt: string;
}

/** A suggestion/comment left on a block. */
export interface NodeComment {
  id: string;
  nodeId: string;
  projectId: string;
  body: string;
  author: string;
  createdAt: string;
}

export interface DataSet {
  projects: Project[];
  nodes: ProjectNode[];
  edges: ProjectEdge[];
  comments: NodeComment[];
}

export interface ProjectInput {
  name: string;
  description: string;
  owner: string;
  status: ProjectStatus;
  color: string;
}

export interface NodeInput {
  projectId: string;
  title: string;
  note: string;
  state: NodeState;
  positionX: number;
  positionY: number;
}

export interface EdgeInput {
  projectId: string;
  sourceId: string;
  targetId: string;
}

export interface CommentInput {
  nodeId: string;
  projectId: string;
  body: string;
  author: string;
}

export interface Repository {
  kind: "supabase" | "demo";
  loadAll(): Promise<DataSet>;
  createProject(input: ProjectInput): Promise<void>;
  updateProject(id: string, patch: Partial<Project>): Promise<void>;
  deleteProject(id: string): Promise<void>;
  addNode(input: NodeInput): Promise<void>;
  updateNode(id: string, patch: Partial<ProjectNode>): Promise<void>;
  deleteNode(id: string): Promise<void>;
  addEdge(input: EdgeInput): Promise<void>;
  updateEdge(id: string, patch: Partial<ProjectEdge>): Promise<void>;
  deleteEdge(id: string): Promise<void>;
  addComment(input: CommentInput): Promise<void>;
  deleteComment(id: string): Promise<void>;
}
