export type Stage = "backlog" | "planning" | "in_progress" | "review" | "launch" | "done";
export type ProjectStatus = "on_track" | "at_risk" | "blocked" | "done";
export type Priority = "low" | "medium" | "high";
export type Severity = "low" | "medium" | "high" | "critical";
export type BlockerStatus = "open" | "resolved";

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
  progress: number;
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
  progress: number;
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

export interface DataSet {
  projects: Project[];
  updates: Update[];
  blockers: Blocker[];
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
  progress: number;
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
}
