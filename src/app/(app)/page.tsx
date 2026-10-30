"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProjectForm } from "@/components/ProjectForm";
import { Icon } from "@/components/Icons";
import { EmptyState, Pill } from "@/components/ui";
import { nodesFor } from "@/lib/analytics";
import { statusMeta } from "@/lib/constants";
import { fmtShort } from "@/lib/format";
import { useWorkspace } from "@/lib/store";

export default function HomePage() {
  const { data } = useWorkspace();
  const [creating, setCreating] = useState(false);

  const rows = useMemo(() => {
    return data.projects
      .filter((p) => !p.archived)
      .map((project) => ({ project, blockCount: nodesFor(data.nodes, project.id).length }))
      .sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt));
  }, [data]);

  if (rows.length === 0) {
    return (
      <>
        <div className="home-head">
          <div>
            <h1>Projects</h1>
            <p className="page-sub">Everything the team is working on, in one place.</p>
          </div>
        </div>
        <div className="card">
          <EmptyState
            icon="projects"
            title="No projects yet"
            message="Add your first project, then map its steps on the freeform board."
            action={
              <button className="btn btn-primary" style={{ marginTop: 6 }} type="button" onClick={() => setCreating(true)}>
                <Icon name="plus" size={15} />
                New project
              </button>
            }
          />
        </div>
        {creating && <ProjectForm onClose={() => setCreating(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="home-head">
        <div>
          <h1>Projects</h1>
          <p className="page-sub">{rows.length} project{rows.length === 1 ? "" : "s"}</p>
        </div>
        <span className="spacer" />
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setCreating(true)}>
          <Icon name="plus" size={14} />
          <span className="hide-sm">New project</span>
        </button>
      </div>

      <div className="project-grid">
        {rows.map(({ project, blockCount }) => {
          const status = statusMeta(project.status);
          return (
            <Link key={project.id} href={`/projects/${project.id}`} className="card project-card">
              <span className="project-card__stripe" style={{ background: project.color }} />
              <div className="project-card__body">
                <div className="project-head">
                  <span className="project-name">{project.name}</span>
                  <Pill tone={status.tone} dot>
                    {status.label}
                  </Pill>
                </div>
                <div className="project-summary">{project.description || "No description yet."}</div>
                <div className="project-foot">
                  {project.owner && <span>{project.owner}</span>}
                  {project.owner && <span className="foot-dot" />}
                  <span>
                    {blockCount} block{blockCount === 1 ? "" : "s"}
                  </span>
                  <span className="foot-dot" />
                  <span>Updated {fmtShort(project.updatedAt.slice(0, 10))}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="list-note">Tap a project to see its details and freeform board.</p>

      {creating && <ProjectForm onClose={() => setCreating(false)} />}
    </>
  );
}
