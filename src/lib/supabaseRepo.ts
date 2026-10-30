import { getSupabase } from "./supabase";
import type {
  Blocker,
  BlockerInput,
  DataSet,
  EdgeInput,
  NodeInput,
  Project,
  ProjectEdge,
  ProjectInput,
  ProjectNode,
  Repository,
  Update,
  UpdateInput,
} from "./types";

type Row = Record<string, unknown>;

function projectFromRow(row: Row): Project {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    owner: String(row.owner ?? ""),
    stage: (row.stage as Project["stage"]) ?? "backlog",
    priority: (row.priority as Project["priority"]) ?? "medium",
    status: (row.status as Project["status"]) ?? "on_track",
    startDate: (row.start_date as string) ?? null,
    dueDate: (row.due_date as string) ?? null,
    color: String(row.color ?? "#4f46e5"),
    archived: Boolean(row.archived),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

function updateFromRow(row: Row): Update {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    updateDate: String(row.update_date ?? "").slice(0, 10),
    status: (row.status as Update["status"]) ?? "on_track",
    hours: row.hours === null || row.hours === undefined ? null : Number(row.hours),
    summary: String(row.summary ?? ""),
    nextStep: String(row.next_step ?? ""),
    blockersNote: String(row.blockers_note ?? ""),
    author: String(row.author ?? ""),
    createdAt: String(row.created_at ?? ""),
  };
}

function nodeFromRow(row: Row): ProjectNode {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title ?? ""),
    note: String(row.note ?? ""),
    kind: (row.kind as ProjectNode["kind"]) ?? "step",
    state: (row.state as ProjectNode["state"]) ?? "idea",
    dueDate: (row.due_date as string) ?? null,
    createdBy: (row.created_by as string) ?? null,
    createdAt: String(row.created_at ?? ""),
  };
}

function edgeFromRow(row: Row): ProjectEdge {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    sourceId: String(row.source_id),
    targetId: String(row.target_id),
    createdAt: String(row.created_at ?? ""),
  };
}

function blockerFromRow(row: Row): Blocker {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title ?? ""),
    detail: String(row.detail ?? ""),
    severity: (row.severity as Blocker["severity"]) ?? "medium",
    status: (row.status as Blocker["status"]) ?? "open",
    owner: String(row.owner ?? ""),
    createdAt: String(row.created_at ?? ""),
    resolvedAt: (row.resolved_at as string) ?? null,
  };
}

export const supabaseRepository: Repository = {
  kind: "supabase",

  async loadAll(): Promise<DataSet> {
    const supabase = getSupabase();
    const [projects, updates, blockers, nodes, edges] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: true }),
      supabase.from("updates").select("*").order("update_date", { ascending: false }),
      supabase.from("blockers").select("*").order("created_at", { ascending: false }),
      supabase.from("nodes").select("*").order("created_at", { ascending: true }),
      supabase.from("edges").select("*").order("created_at", { ascending: true }),
    ]);

    const error = projects.error ?? updates.error ?? blockers.error ?? nodes.error ?? edges.error;
    if (error) throw new Error(error.message);

    return {
      projects: (projects.data ?? []).map(projectFromRow),
      updates: (updates.data ?? []).map(updateFromRow),
      blockers: (blockers.data ?? []).map(blockerFromRow),
      nodes: (nodes.data ?? []).map(nodeFromRow),
      edges: (edges.data ?? []).map(edgeFromRow),
    };
  },

  async createProject(input: ProjectInput) {
    const supabase = getSupabase();
    const { error } = await supabase.from("projects").insert({
      name: input.name,
      description: input.description,
      owner: input.owner,
      stage: input.stage,
      priority: input.priority,
      status: input.status,
      start_date: input.startDate,
      due_date: input.dueDate,
      color: input.color,
    });
    if (error) throw new Error(error.message);
  },

  async updateProject(id: string, patch: Partial<Project>) {
    const supabase = getSupabase();
    const row: Row = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.description !== undefined) row.description = patch.description;
    if (patch.owner !== undefined) row.owner = patch.owner;
    if (patch.stage !== undefined) row.stage = patch.stage;
    if (patch.priority !== undefined) row.priority = patch.priority;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.startDate !== undefined) row.start_date = patch.startDate;
    if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
    if (patch.color !== undefined) row.color = patch.color;
    if (patch.archived !== undefined) row.archived = patch.archived;
    row.updated_at = new Date().toISOString();

    const { error } = await supabase.from("projects").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  },

  async deleteProject(id: string) {
    const supabase = getSupabase();
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async addUpdate(input: UpdateInput) {
    const supabase = getSupabase();
    const { error } = await supabase.from("updates").insert({
      project_id: input.projectId,
      update_date: input.updateDate,
      status: input.status,
      hours: input.hours,
      summary: input.summary,
      next_step: input.nextStep,
      blockers_note: input.blockersNote,
      author: input.author,
    });
    if (error) throw new Error(error.message);
  },

  async deleteUpdate(id: string) {
    const supabase = getSupabase();
    const { error } = await supabase.from("updates").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async addBlocker(input: BlockerInput) {
    const supabase = getSupabase();
    const { error } = await supabase.from("blockers").insert({
      project_id: input.projectId,
      title: input.title,
      detail: input.detail,
      severity: input.severity,
      owner: input.owner,
      status: "open",
    });
    if (error) throw new Error(error.message);
  },

  async updateBlocker(id: string, patch: Partial<Blocker>) {
    const supabase = getSupabase();
    const row: Row = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.detail !== undefined) row.detail = patch.detail;
    if (patch.severity !== undefined) row.severity = patch.severity;
    if (patch.owner !== undefined) row.owner = patch.owner;
    if (patch.status !== undefined) {
      row.status = patch.status;
      row.resolved_at = patch.status === "resolved" ? new Date().toISOString() : null;
    }

    const { error } = await supabase.from("blockers").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  },

  async deleteBlocker(id: string) {
    const supabase = getSupabase();
    const { error } = await supabase.from("blockers").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async addNode(input: NodeInput) {
    const supabase = getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("nodes").insert({
      project_id: input.projectId,
      title: input.title,
      note: input.note,
      kind: input.kind,
      state: input.state,
      due_date: input.dueDate,
      created_by: user?.id ?? null,
    });
    if (error) throw new Error(error.message);
  },

  async updateNode(id: string, patch: Partial<ProjectNode>) {
    const supabase = getSupabase();
    const row: Row = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.note !== undefined) row.note = patch.note;
    if (patch.kind !== undefined) row.kind = patch.kind;
    if (patch.state !== undefined) row.state = patch.state;
    if (patch.dueDate !== undefined) row.due_date = patch.dueDate;

    const { error } = await supabase.from("nodes").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  },

  async deleteNode(id: string) {
    const supabase = getSupabase();
    const { error } = await supabase.from("nodes").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async addEdge(input: EdgeInput) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("edges")
      .insert({ project_id: input.projectId, source_id: input.sourceId, target_id: input.targetId });
    if (error) throw new Error(error.message);
  },

  async deleteEdge(id: string) {
    const supabase = getSupabase();
    const { error } = await supabase.from("edges").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
