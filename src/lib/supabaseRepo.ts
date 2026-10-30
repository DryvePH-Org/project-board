import { getSupabase } from "./supabase";
import type {
  CommentInput,
  DataSet,
  EdgeInput,
  NodeComment,
  NodeInput,
  Project,
  ProjectEdge,
  ProjectInput,
  ProjectNode,
  Repository,
} from "./types";

type Row = Record<string, unknown>;

function projectFromRow(row: Row): Project {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    owner: String(row.owner ?? ""),
    status: (row.status as Project["status"]) ?? "on_track",
    color: String(row.color ?? "#4f46e5"),
    archived: Boolean(row.archived),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

function nodeFromRow(row: Row): ProjectNode {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title ?? ""),
    note: String(row.note ?? ""),
    state: (row.state as ProjectNode["state"]) ?? "idea",
    positionX: Number(row.position_x ?? 0),
    positionY: Number(row.position_y ?? 0),
    createdAt: String(row.created_at ?? ""),
  };
}

function edgeFromRow(row: Row): ProjectEdge {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    sourceId: String(row.source_id),
    targetId: String(row.target_id),
    blocked: Boolean(row.blocked),
    blockerNote: String(row.blocker_note ?? ""),
    createdAt: String(row.created_at ?? ""),
  };
}

function commentFromRow(row: Row): NodeComment {
  return {
    id: String(row.id),
    nodeId: String(row.node_id),
    projectId: String(row.project_id),
    body: String(row.body ?? ""),
    author: String(row.author ?? ""),
    createdAt: String(row.created_at ?? ""),
  };
}

export const supabaseRepository: Repository = {
  kind: "supabase",

  async loadAll(): Promise<DataSet> {
    const supabase = getSupabase();
    const [projects, nodes, edges, comments] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: true }),
      supabase.from("nodes").select("*").order("created_at", { ascending: true }),
      supabase.from("edges").select("*").order("created_at", { ascending: true }),
      supabase.from("comments").select("*").order("created_at", { ascending: true }),
    ]);

    const error = projects.error ?? nodes.error ?? edges.error ?? comments.error;
    if (error) throw new Error(error.message);

    return {
      projects: (projects.data ?? []).map(projectFromRow),
      nodes: (nodes.data ?? []).map(nodeFromRow),
      edges: (edges.data ?? []).map(edgeFromRow),
      comments: (comments.data ?? []).map(commentFromRow),
    };
  },

  async createProject(input: ProjectInput) {
    const supabase = getSupabase();
    const { error } = await supabase.from("projects").insert({
      name: input.name,
      description: input.description,
      owner: input.owner,
      status: input.status,
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
    if (patch.status !== undefined) row.status = patch.status;
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

  async addNode(input: NodeInput) {
    const supabase = getSupabase();
    const { error } = await supabase.from("nodes").insert({
      project_id: input.projectId,
      title: input.title,
      note: input.note,
      state: input.state,
      position_x: input.positionX,
      position_y: input.positionY,
    });
    if (error) throw new Error(error.message);
  },

  async updateNode(id: string, patch: Partial<ProjectNode>) {
    const supabase = getSupabase();
    const row: Row = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.note !== undefined) row.note = patch.note;
    if (patch.state !== undefined) row.state = patch.state;
    if (patch.positionX !== undefined) row.position_x = patch.positionX;
    if (patch.positionY !== undefined) row.position_y = patch.positionY;

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
    const { error } = await supabase.from("edges").insert({
      project_id: input.projectId,
      source_id: input.sourceId,
      target_id: input.targetId,
    });
    if (error) throw new Error(error.message);
  },

  async updateEdge(id: string, patch: Partial<ProjectEdge>) {
    const supabase = getSupabase();
    const row: Row = {};
    if (patch.blocked !== undefined) row.blocked = patch.blocked;
    if (patch.blockerNote !== undefined) row.blocker_note = patch.blockerNote;

    const { error } = await supabase.from("edges").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  },

  async deleteEdge(id: string) {
    const supabase = getSupabase();
    const { error } = await supabase.from("edges").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async addComment(input: CommentInput) {
    const supabase = getSupabase();
    const { error } = await supabase.from("comments").insert({
      node_id: input.nodeId,
      project_id: input.projectId,
      body: input.body,
      author: input.author,
    });
    if (error) throw new Error(error.message);
  },

  async deleteComment(id: string) {
    const supabase = getSupabase();
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
