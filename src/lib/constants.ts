import type { NodeState, ProjectStatus } from "./types";

export const STATUSES: { id: ProjectStatus; label: string; tone: string }[] = [
  { id: "on_track", label: "On track", tone: "green" },
  { id: "at_risk", label: "At risk", tone: "amber" },
  { id: "blocked", label: "Blocked", tone: "red" },
  { id: "done", label: "Done", tone: "slate" },
];

export const NODE_STATES: { id: NodeState; label: string; tone: string }[] = [
  { id: "idea", label: "Idea", tone: "muted" },
  { id: "planned", label: "Planned", tone: "blue" },
  { id: "in_progress", label: "In progress", tone: "amber" },
  { id: "blocked", label: "Blocked", tone: "red" },
  { id: "done", label: "Done", tone: "green" },
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

export function statusMeta(id: ProjectStatus) {
  return STATUSES.find((s) => s.id === id) ?? STATUSES[0];
}

export function nodeStateMeta(id: NodeState) {
  return NODE_STATES.find((s) => s.id === id) ?? NODE_STATES[0];
}
