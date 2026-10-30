import type {
  CommentInput,
  DataSet,
  EdgeBlocker,
  EdgeInput,
  NodeComment,
  NodeInput,
  Project,
  ProjectEdge,
  ProjectInput,
  ProjectNode,
  Repository,
} from "./types";

const KEY = "pulseboard.demo.v3";

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function seed(): DataSet {
  const now = new Date().toISOString();
  const projects: Project[] = [
    {
      id: "p-northwind",
      name: "Northwind website redesign",
      description:
        "Full marketing site rebuild: new information architecture, refreshed visual system, and a lightweight CMS so the client can publish without us.",
      owner: "Aaron",
      status: "on_track",
      color: "#4f46e5",
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "p-q4-campaign",
      name: "Q4 campaign launch",
      description:
        "Multi-channel launch: paid social, email sequence, and a landing page. Creative is approved; waiting on final legal copy review.",
      owner: "Maya",
      status: "at_risk",
      color: "#db2777",
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "p-onboarding",
      name: "Client onboarding revamp",
      description: "Replace the ad-hoc onboarding emails with a documented 30-day journey and a kickoff template.",
      owner: "Dan",
      status: "on_track",
      color: "#0d9488",
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const nodes: ProjectNode[] = [
    {
      id: "n-1",
      projectId: "p-northwind",
      title: "Kickoff call",
      note: "Align on scope and timeline with the client.",
      state: "done",
      positionX: 40,
      positionY: 160,
      createdAt: now,
    },
    {
      id: "n-2",
      projectId: "p-northwind",
      title: "Design system tokens",
      note: "Colors, type scale, spacing.",
      state: "done",
      positionX: 360,
      positionY: 60,
      createdAt: now,
    },
    {
      id: "n-3",
      projectId: "p-northwind",
      title: "Homepage build",
      note: "",
      state: "in_progress",
      positionX: 360,
      positionY: 280,
      createdAt: now,
    },
    {
      id: "n-4",
      projectId: "p-northwind",
      title: "Client review",
      note: "Walk through the homepage and gather feedback.",
      state: "planned",
      positionX: 700,
      positionY: 170,
      createdAt: now,
    },
    {
      id: "n-5",
      projectId: "p-northwind",
      title: "CMS handover",
      note: "",
      state: "idea",
      positionX: 1020,
      positionY: 170,
      createdAt: now,
    },
  ];

  const edges: ProjectEdge[] = [
    { id: "e-1", projectId: "p-northwind", sourceId: "n-1", targetId: "n-2", blockers: [], createdAt: now },
    { id: "e-2", projectId: "p-northwind", sourceId: "n-1", targetId: "n-3", blockers: [], createdAt: now },
    { id: "e-3", projectId: "p-northwind", sourceId: "n-2", targetId: "n-4", blockers: [], createdAt: now },
    {
      id: "e-4",
      projectId: "p-northwind",
      sourceId: "n-3",
      targetId: "n-4",
      blockers: [
        {
          id: "b-1",
          text: "Waiting on final copy from marketing before this can move.",
          resolved: false,
        },
      ],
      createdAt: now,
    },
    { id: "e-5", projectId: "p-northwind", sourceId: "n-4", targetId: "n-5", blockers: [], createdAt: now },
  ];

  const comments: NodeComment[] = [
    {
      id: "c-1",
      nodeId: "n-3",
      projectId: "p-northwind",
      body: "Should we use the new hero photo here instead of the placeholder?",
      author: "Maya",
      resolved: false,
      createdAt: now,
    },
  ];

  return { projects, nodes, edges, comments };
}

/** Older saves stored blockers as plain strings, or a single `blocked` /
 * `blockerNote` pair per edge. Bring everything up to structured blockers. */
type StoredBlocker = string | Partial<EdgeBlocker>;

function normalizeBlocker(value: StoredBlocker, edgeId: string, index: number): EdgeBlocker | null {
  const source = typeof value === "string" ? { text: value } : value;
  const text = String(source.text ?? "").trim();
  if (!text) return null;
  return {
    id: String(source.id ?? `${edgeId}-b${index}`),
    text,
    resolved: Boolean(source.resolved),
  };
}

function normalizeEdge(
  edge: ProjectEdge & { blocked?: boolean; blockerNote?: string },
): ProjectEdge {
  const stored: StoredBlocker[] = Array.isArray(edge.blockers)
    ? (edge.blockers as unknown as StoredBlocker[])
    : edge.blockerNote
      ? [edge.blockerNote]
      : [];
  const blockers = stored
    .map((value, index) => normalizeBlocker(value, edge.id, index))
    .filter((blocker): blocker is EdgeBlocker => blocker !== null);
  const { blocked, blockerNote, ...rest } = edge;
  return { ...rest, blockers };
}

function normalizeComment(comment: NodeComment): NodeComment {
  return { ...comment, resolved: Boolean(comment.resolved) };
}

function read(): DataSet {
  if (typeof window === "undefined") return { projects: [], nodes: [], edges: [], comments: [] };
  const raw = window.localStorage.getItem(KEY);
  if (!raw) {
    const data = seed();
    write(data);
    return data;
  }
  try {
    const parsed = JSON.parse(raw) as DataSet;
    return {
      projects: parsed.projects ?? [],
      nodes: parsed.nodes ?? [],
      edges: (parsed.edges ?? []).map(normalizeEdge),
      comments: (parsed.comments ?? []).map(normalizeComment),
    };
  } catch {
    const data = seed();
    write(data);
    return data;
  }
}

function write(data: DataSet) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(data));
}

export const demoRepository: Repository = {
  kind: "demo",

  async loadAll() {
    return read();
  },

  async createProject(input: ProjectInput) {
    const data = read();
    const project: Project = {
      id: uid(),
      ...input,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.projects.unshift(project);
    write(data);
  },

  async updateProject(id, patch) {
    const data = read();
    data.projects = data.projects.map((p) =>
      p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
    );
    write(data);
  },

  async deleteProject(id) {
    const data = read();
    data.projects = data.projects.filter((p) => p.id !== id);
    data.nodes = data.nodes.filter((n) => n.projectId !== id);
    data.edges = data.edges.filter((e) => e.projectId !== id);
    data.comments = data.comments.filter((c) => c.projectId !== id);
    write(data);
  },

  async addNode(input: NodeInput) {
    const data = read();
    const node: ProjectNode = {
      id: uid(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    data.nodes.push(node);
    write(data);
  },

  async updateNode(id, patch) {
    const data = read();
    data.nodes = data.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n));
    write(data);
  },

  async deleteNode(id) {
    const data = read();
    data.nodes = data.nodes.filter((n) => n.id !== id);
    data.edges = data.edges.filter((e) => e.sourceId !== id && e.targetId !== id);
    data.comments = data.comments.filter((c) => c.nodeId !== id);
    write(data);
  },

  async addEdge(input: EdgeInput) {
    const data = read();
    const edge: ProjectEdge = {
      id: uid(),
      ...input,
      blockers: [],
      createdAt: new Date().toISOString(),
    };
    data.edges.push(edge);
    write(data);
  },

  async updateEdge(id, patch) {
    const data = read();
    data.edges = data.edges.map((e) => (e.id === id ? { ...e, ...patch } : e));
    write(data);
  },

  async deleteEdge(id) {
    const data = read();
    data.edges = data.edges.filter((e) => e.id !== id);
    write(data);
  },

  async addComment(input: CommentInput) {
    const data = read();
    const comment: NodeComment = {
      id: uid(),
      ...input,
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    data.comments.push(comment);
    write(data);
  },

  async updateComment(id, patch) {
    const data = read();
    data.comments = data.comments.map((c) => (c.id === id ? { ...c, ...patch } : c));
    write(data);
  },

  async deleteComment(id) {
    const data = read();
    data.comments = data.comments.filter((c) => c.id !== id);
    write(data);
  },
};
