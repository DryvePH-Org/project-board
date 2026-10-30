"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProjectForm } from "@/components/ProjectForm";
import { Icon } from "@/components/Icons";
import { EmptyState, Pill } from "@/components/ui";
import { latestUpdate, openBlockersFor, projectHealth } from "@/lib/analytics";
import { stageMeta } from "@/lib/constants";
import { dueLabel, relativeDay } from "@/lib/format";
import { useWorkspace } from "@/lib/store";

export default function HomePage() {
  const { data } = useWorkspace();
  const [creating, setCreating] = useState(false);

  const rows = useMemo(() => {
    return data.projects
      .filter((p) => !p.archived)
      .map((project) => ({
        project,
        latest: latestUpdate(data.updates, project.id),
        blockers: openBlockersFor(data.blockers, project.id),
        health: projectHealth(project, data.updates, data.blockers),
      }))
      .sort((a, b) => {
        const aDone = a.project.stage === "done" ? 1 : 0;
        const bDone = b.project.stage === "done" ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        const aDate = a.latest?.updateDate ?? a.project.createdAt.slice(0, 10);
        const bDate = b.latest?.updateDate ?? b.project.createdAt.slice(0, 10);
        return bDate.localeCompare(aDate);
      });
  }, [data]);

  const active = rows.filter((r) => r.project.stage !== "done").length;
  const blocked = rows.filter((r) => r.blockers.length > 0).length;
  const done = rows.length - active;

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
            message="Add your first project and start posting a short update each day."
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
          <p className="page-sub">
            {active} active
            {blocked > 0 && <> · {blocked} blocked</>}
            {done > 0 && <> · {done} done</>}
          </p>
        </div>
        <span className="spacer" />
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setCreating(true)}>
          <Icon name="plus" size={14} />
          <span className="hide-sm">New project</span>
        </button>
      </div>

      <div className="project-grid">
        {rows.map(({ project, latest, blockers, health }) => {
          const due = dueLabel(project.dueDate, { done: project.stage === "done" });
          const detail = blockers.length > 0 ? `${health.label} · ${blockers.length}` : health.label;
          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="card project-card"
            >
              <span className="project-card__stripe" style={{ background: project.color }} />
              <div className="project-card__body">
                <div className="project-head">
                  <span className="project-name">{project.name}</span>
                  <Pill tone={health.tone} dot>
                    {detail}
                  </Pill>
                </div>
                <div className="project-summary">
                  {latest ? latest.summary : "No updates yet — open it and post the first one."}
                </div>
                <div className="project-foot">
                  <span>{stageMeta(project.stage).label}</span>
                  <span className="foot-dot" />
                  <span>{latest ? relativeDay(latest.updateDate) : "Not started"}</span>
                  {project.owner && (
                    <>
                      <span className="foot-dot" />
                      <span>{project.owner}</span>
                    </>
                  )}
                  <span
                    className={`project-due${due.tone === "red" ? " due-red" : due.tone === "amber" ? " due-amber" : ""}`}
                  >
                    {due.text}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="list-note">Tap a project to see its updates and blockers.</p>

      {creating && <ProjectForm onClose={() => setCreating(false)} />}
    </>
  );
}
