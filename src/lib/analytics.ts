import { daysBetween, parseISO } from "./format";
import type { Blocker, Project, Update } from "./types";

export function latestUpdate(updates: Update[], projectId: string): Update | null {
  const list = updates
    .filter((u) => u.projectId === projectId)
    .sort((a, b) => b.updateDate.localeCompare(a.updateDate) || b.createdAt.localeCompare(a.createdAt));
  return list[0] ?? null;
}

export function updatesFor(updates: Update[], projectId: string): Update[] {
  return updates
    .filter((u) => u.projectId === projectId)
    .sort((a, b) => b.updateDate.localeCompare(a.updateDate) || b.createdAt.localeCompare(a.createdAt));
}

export function openBlockersFor(blockers: Blocker[], projectId: string): Blocker[] {
  return blockers.filter((b) => b.projectId === projectId && b.status === "open");
}

export function projectBlockers(blockers: Blocker[], projectId: string): Blocker[] {
  return blockers
    .filter((b) => b.projectId === projectId)
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "open" ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export function isStale(project: Project, updates: Update[]): boolean {
  if (project.stage === "done" || project.stage === "backlog") return false;
  if (project.startDate && daysBetween(new Date(), parseISO(project.startDate)) > 0) return false;
  const latest = latestUpdate(updates, project.id);
  if (!latest) {
    // Give brand-new projects a day before nagging for an update.
    return daysBetween(parseISO(project.createdAt.slice(0, 10)), new Date()) > 1;
  }
  return daysBetween(parseISO(latest.updateDate), new Date()) > 3;
}

export interface Health {
  label: string;
  tone: "green" | "amber" | "red" | "slate" | "blue";
}

export function projectHealth(project: Project, updates: Update[], blockers: Blocker[]): Health {
  if (project.stage === "done" || project.status === "done") return { label: "Done", tone: "slate" };
  if (openBlockersFor(blockers, project.id).length > 0 || project.status === "blocked")
    return { label: "Blocked", tone: "red" };
  if (project.status === "at_risk") return { label: "At risk", tone: "amber" };
  if (project.dueDate && daysBetween(new Date(), parseISO(project.dueDate)) < 0)
    return { label: "Overdue", tone: "red" };
  if (project.stage === "backlog") return { label: "Not started", tone: "slate" };
  if (project.startDate && daysBetween(new Date(), parseISO(project.startDate)) > 0)
    return { label: "Scheduled", tone: "slate" };
  if (isStale(project, updates)) return { label: "Needs update", tone: "blue" };
  return { label: "On track", tone: "green" };
}
