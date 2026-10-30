"use client";

import { Icon, type IconName } from "@/components/Icons";

export type ProjectModule = "overview" | "board";

const MODULES: { id: ProjectModule; label: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", icon: "projects" },
  { id: "board", label: "Freeform board", icon: "spark" },
];

export function ProjectNav({
  active,
  onSelect,
  nodeCount,
}: {
  active: ProjectModule;
  onSelect: (id: ProjectModule) => void;
  nodeCount: number;
}) {
  return (
    <nav className="project-nav" aria-label="Project sections">
      {MODULES.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`project-nav__item${active === m.id ? " active" : ""}`}
          aria-current={active === m.id ? "page" : undefined}
          onClick={() => onSelect(m.id)}
        >
          <Icon name={m.icon} size={15} />
          <span>{m.label}</span>
          {m.id === "board" && nodeCount > 0 && <span className="tab-count">{nodeCount}</span>}
        </button>
      ))}
    </nav>
  );
}

export function moduleFromParam(value: string | null): ProjectModule {
  return MODULES.some((m) => m.id === value) ? (value as ProjectModule) : "overview";
}
