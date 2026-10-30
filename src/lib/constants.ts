import type { NodeKind, NodeState, ProjectStatus, Severity, Stage } from "./types";

export const STAGES: { id: Stage; label: string; hint: string }[] = [
  { id: "backlog", label: "Backlog", hint: "Not started yet" },
  { id: "planning", label: "Planning", hint: "Scoping and scheduling" },
  { id: "in_progress", label: "In Progress", hint: "Actively being worked" },
  { id: "review", label: "Review", hint: "Awaiting feedback or QA" },
  { id: "launch", label: "Launch", hint: "Shipping this week" },
  { id: "done", label: "Done", hint: "Delivered and closed" },
];

export const STATUSES: { id: ProjectStatus; label: string; tone: string }[] = [
  { id: "on_track", label: "On track", tone: "green" },
  { id: "at_risk", label: "At risk", tone: "amber" },
  { id: "blocked", label: "Blocked", tone: "red" },
  { id: "done", label: "Done", tone: "slate" },
];

export const SEVERITIES: { id: Severity; label: string; tone: string }[] = [
  { id: "low", label: "Low", tone: "slate" },
  { id: "medium", label: "Medium", tone: "amber" },
  { id: "high", label: "High", tone: "orange" },
  { id: "critical", label: "Critical", tone: "red" },
];

export const NODE_STATES: { id: NodeState; label: string; tone: string }[] = [
  { id: "idea", label: "Idea", tone: "muted" },
  { id: "planned", label: "Planned", tone: "blue" },
  { id: "in_progress", label: "In progress", tone: "amber" },
  { id: "blocked", label: "Blocked", tone: "red" },
  { id: "done", label: "Done", tone: "green" },
];

export const NODE_KINDS: { id: NodeKind; label: string }[] = [
  { id: "step", label: "Step" },
  { id: "milestone", label: "Milestone" },
  { id: "question", label: "Question" },
];

export const PROJECT_COLORS = [
  "#4f46e5",
  "#0ea5e9",
  "#0d9488",
  "#d97706",
  "#db2777",
  "#7c3aed",
  "#2563eb",
  "#65a30d",
];

export function stageMeta(id: Stage) {
  return STAGES.find((s) => s.id === id) ?? STAGES[0];
}

export function statusMeta(id: ProjectStatus) {
  return STATUSES.find((s) => s.id === id) ?? STATUSES[0];
}

export function nodeStateMeta(id: NodeState) {
  return NODE_STATES.find((s) => s.id === id) ?? NODE_STATES[0];
}

export function nodeKindMeta(id: NodeKind) {
  return NODE_KINDS.find((k) => k.id === id) ?? NODE_KINDS[0];
}
