import { addDays, toISO, todayISO } from "./format";
import type {
  Blocker,
  BlockerInput,
  DataSet,
  Project,
  ProjectInput,
  Repository,
  Update,
  UpdateInput,
} from "./types";

const KEY = "pulseboard.demo.v1";

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function daysFromNow(n: number): string {
  return toISO(addDays(new Date(), n));
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
      stage: "in_progress",
      priority: "high",
      status: "on_track",
      startDate: daysFromNow(-24),
      dueDate: daysFromNow(9),
      progress: 62,
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
      stage: "review",
      priority: "high",
      status: "at_risk",
      startDate: daysFromNow(-18),
      dueDate: daysFromNow(4),
      progress: 78,
      color: "#db2777",
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "p-onboarding",
      name: "Client onboarding revamp",
      description:
        "Replace the ad-hoc onboarding emails with a documented 30-day journey, shared checklist, and a kickoff template.",
      owner: "Dan",
      stage: "planning",
      priority: "medium",
      status: "on_track",
      startDate: daysFromNow(-6),
      dueDate: daysFromNow(21),
      progress: 25,
      color: "#0d9488",
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "p-analytics",
      name: "Internal analytics dashboard",
      description:
        "Single view of project health, utilization, and delivery time. Blocked on API access to the time-tracking tool.",
      owner: "Aaron",
      stage: "in_progress",
      priority: "medium",
      status: "blocked",
      startDate: daysFromNow(-31),
      dueDate: daysFromNow(14),
      progress: 45,
      color: "#d97706",
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "p-brand",
      name: "Brand guidelines refresh",
      description: "Updated logo lockups, color tokens, and typography rules packaged as a shareable PDF.",
      owner: "Maya",
      stage: "done",
      priority: "low",
      status: "done",
      startDate: daysFromNow(-52),
      dueDate: daysFromNow(-8),
      progress: 100,
      color: "#7c3aed",
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "p-mobile",
      name: "Mobile app v2 discovery",
      description: "Early discovery for the v2 release: interview five power users and map the top friction points.",
      owner: "Dan",
      stage: "backlog",
      priority: "low",
      status: "on_track",
      startDate: daysFromNow(6),
      dueDate: daysFromNow(48),
      progress: 0,
      color: "#0ea5e9",
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const updates: Update[] = [
    {
      id: "u-1",
      projectId: "p-northwind",
      updateDate: todayISO(),
      status: "on_track",
      progress: 62,
      hours: 5.5,
      summary:
        "Homepage and services template are built and responsive. Client reviewed the hero section and asked for a warmer photo treatment.",
      nextStep: "Swap hero imagery, then build the case-study template and hand over the CMS fields.",
      blockersNote: "",
      author: "Aaron",
      createdAt: now,
    },
    {
      id: "u-2",
      projectId: "p-q4-campaign",
      updateDate: todayISO(),
      status: "at_risk",
      progress: 78,
      hours: 3,
      summary:
        "Email sequence is assembled in the ESP. Legal still has not returned the approved claims list, which gates the ad copy.",
      nextStep: "Escalate to the client's legal contact; prepare a fallback version without the disputed claims.",
      blockersNote: "Legal approval pending since Monday.",
      author: "Maya",
      createdAt: now,
    },
    {
      id: "u-3",
      projectId: "p-analytics",
      updateDate: todayISO(),
      status: "blocked",
      progress: 45,
      hours: 1,
      summary:
        "Chart components are done, but the time-tracking vendor has not issued API credentials. Built a temporary CSV importer to keep moving.",
      nextStep: "Follow up with the vendor account manager and confirm the exact scopes needed.",
      blockersNote: "Blocked on third-party API access.",
      author: "Aaron",
      createdAt: now,
    },
    {
      id: "u-4",
      projectId: "p-onboarding",
      updateDate: daysFromNow(-1),
      status: "on_track",
      progress: 25,
      hours: 4,
      summary: "Mapped the current onboarding flow with the delivery team. Found three handoff gaps and one duplicate email.",
      nextStep: "Draft the 30-day journey in a shared doc and circulate for comment.",
      blockersNote: "",
      author: "Dan",
      createdAt: now,
    },
    {
      id: "u-5",
      projectId: "p-northwind",
      updateDate: daysFromNow(-1),
      status: "on_track",
      progress: 55,
      hours: 6,
      summary: "Design system tokens implemented. Header, footer, and navigation are complete.",
      nextStep: "Start the services and case-study templates.",
      blockersNote: "",
      author: "Aaron",
      createdAt: now,
    },
    {
      id: "u-6",
      projectId: "p-q4-campaign",
      updateDate: daysFromNow(-2),
      status: "at_risk",
      progress: 72,
      hours: 5,
      summary: "Landing page copy is final. Paid social creative is rendered in all three aspect ratios.",
      nextStep: "Wait on legal, then schedule the campaign.",
      blockersNote: "Legal claims approval still outstanding.",
      author: "Maya",
      createdAt: now,
    },
    {
      id: "u-7",
      projectId: "p-northwind",
      updateDate: daysFromNow(-2),
      status: "on_track",
      progress: 48,
      hours: 7,
      summary: "Style tile approved by the client. Built the first two page layouts.",
      nextStep: "Finish remaining page layouts.",
      blockersNote: "",
      author: "Aaron",
      createdAt: now,
    },
    {
      id: "u-8",
      projectId: "p-brand",
      updateDate: daysFromNow(-8),
      status: "done",
      progress: 100,
      hours: 2,
      summary: "Delivered the final PDF and source assets. Client signed off.",
      nextStep: "Nothing outstanding.",
      blockersNote: "",
      author: "Maya",
      createdAt: now,
    },
  ];

  const blockers: Blocker[] = [
    {
      id: "b-1",
      projectId: "p-analytics",
      title: "Waiting on time-tracking API credentials",
      detail:
        "The vendor needs a signed data-processing addendum before issuing keys. Requested 6 days ago; no response yet.",
      severity: "high",
      status: "open",
      owner: "Aaron",
      createdAt: now,
      resolvedAt: null,
    },
    {
      id: "b-2",
      projectId: "p-q4-campaign",
      title: "Legal has not approved campaign claims",
      detail: "Three of the ad headlines reference performance numbers that legal must verify.",
      severity: "critical",
      status: "open",
      owner: "Maya",
      createdAt: now,
      resolvedAt: null,
    },
    {
      id: "b-3",
      projectId: "p-northwind",
      title: "Client photo library is incomplete",
      detail: "Team photos and two facility shots are missing. Client will send a Dropbox link.",
      severity: "low",
      status: "resolved",
      owner: "Aaron",
      createdAt: now,
      resolvedAt: now,
    },
  ];

  return { projects, updates, blockers };
}

function read(): DataSet {
  if (typeof window === "undefined") return { projects: [], updates: [], blockers: [] };
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
      updates: parsed.updates ?? [],
      blockers: parsed.blockers ?? [],
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

function patchProject(data: DataSet, id: string, patch: Partial<Project>) {
  data.projects = data.projects.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p));
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
      progress: 0,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.projects.unshift(project);
    write(data);
  },

  async updateProject(id, patch) {
    const data = read();
    patchProject(data, id, patch);
    write(data);
  },

  async deleteProject(id) {
    const data = read();
    data.projects = data.projects.filter((p) => p.id !== id);
    data.updates = data.updates.filter((u) => u.projectId !== id);
    data.blockers = data.blockers.filter((b) => b.projectId !== id);
    write(data);
  },

  async addUpdate(input: UpdateInput) {
    const data = read();
    const update: Update = {
      id: uid(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    data.updates.unshift(update);
    patchProject(data, input.projectId, {
      progress: input.progress,
      status: input.status,
      ...(input.status === "done" ? { stage: "done" as const } : {}),
    });
    write(data);
  },

  async deleteUpdate(id) {
    const data = read();
    data.updates = data.updates.filter((u) => u.id !== id);
    write(data);
  },

  async addBlocker(input: BlockerInput) {
    const data = read();
    const blocker: Blocker = {
      id: uid(),
      ...input,
      status: "open",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };
    data.blockers.unshift(blocker);
    patchProject(data, input.projectId, { status: "blocked" });
    write(data);
  },

  async updateBlocker(id, patch) {
    const data = read();
    data.blockers = data.blockers.map((b) =>
      b.id === id
        ? {
            ...b,
            ...patch,
            resolvedAt: patch.status === "resolved" ? new Date().toISOString() : patch.status === "open" ? null : b.resolvedAt,
          }
        : b,
    );
    write(data);
  },

  async deleteBlocker(id) {
    const data = read();
    data.blockers = data.blockers.filter((b) => b.id !== id);
    write(data);
  },
};
