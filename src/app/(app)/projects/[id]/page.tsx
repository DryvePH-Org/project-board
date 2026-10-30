"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";
import { Icon } from "@/components/Icons";
import { ProjectForm } from "@/components/ProjectForm";
import { FreeFormModule } from "@/components/project/FreeFormModule";
import { FlowModule } from "@/components/project/FlowModule";
import { OverviewModule } from "@/components/project/OverviewModule";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectNav, moduleFromParam } from "@/components/project/ProjectNav";
import { EmptyState } from "@/components/ui";
import { edgesFor, nodesFor, openBlockersFor, projectBlockers, projectHealth, updatesFor } from "@/lib/analytics";
import { dueLabel, formatHours } from "@/lib/format";
import { useWorkspace } from "@/lib/store";

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<ProjectSkeleton />}>
      <ProjectDetail />
    </Suspense>
  );
}

function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data, deleteProject } = useWorkspace();

  const project = data.projects.find((p) => p.id === params.id);
  const module = moduleFromParam(searchParams.get("module"));
  const updates = useMemo(
    () => (project ? updatesFor(data.updates, project.id) : []),
    [data.updates, project],
  );
  const blockers = useMemo(
    () => (project ? projectBlockers(data.blockers, project.id) : []),
    [data.blockers, project],
  );
  const nodes = useMemo(() => (project ? nodesFor(data.nodes, project.id) : []), [data.nodes, project]);
  const edges = useMemo(() => (project ? edgesFor(data.edges, project.id) : []), [data.edges, project]);

  const [editOpen, setEditOpen] = useState(false);
  const [focusComposer, setFocusComposer] = useState(false);
  const onFocusHandled = useCallback(() => setFocusComposer(false), []);

  if (!project) {
    return (
      <div className="card">
        <EmptyState
          icon="projects"
          title="Project not found"
          message="It may have been deleted, or the link is out of date."
          action={
            <Link href="/" className="btn btn-outline" style={{ marginTop: 6 }}>
              Back to projects
            </Link>
          }
        />
      </div>
    );
  }

  const due = dueLabel(project.dueDate, { done: project.stage === "done" });
  const health = projectHealth(project, data.updates, data.blockers);
  const totalHours = updates.reduce((sum, u) => sum + (u.hours ?? 0), 0);
  const last = updates[0];

  function goModule(id: string) {
    router.replace(`${pathname}?module=${id}`, { scroll: false });
  }

  return (
    <>
      <Link href="/" className="back-link">
        <Icon name="chevron-left" size={14} /> All projects
      </Link>

      <div className="project-shell">
        <div className="project-shell__nav">
          <ProjectNav active={module} onSelect={goModule} nodeCount={nodes.length} />
        </div>

        <div className="project-shell__main">
          <ProjectHeader
            project={project}
            health={health}
            due={due}
            totalHours={totalHours}
            last={last}
            onEdit={() => setEditOpen(true)}
            onLogUpdate={() => {
              goModule("freeform");
              setFocusComposer(true);
            }}
            onDelete={() => {
              if (window.confirm(`Delete “${project.name}” and all its history? This cannot be undone.`)) {
                void deleteProject(project.id).then((ok) => {
                  if (ok) router.push("/");
                });
              }
            }}
          />

          {module === "overview" && (
            <OverviewModule
              project={project}
              blockers={blockers}
              open={openBlockersFor(data.blockers, project.id)}
            />
          )}
          {module === "flow" && <FlowModule project={project} nodes={nodes} edges={edges} />}
          {module === "freeform" && (
            <FreeFormModule
              project={project}
              updates={updates}
              focusComposer={focusComposer}
              onFocusHandled={onFocusHandled}
            />
          )}
        </div>
      </div>

      {editOpen && <ProjectForm project={project} onClose={() => setEditOpen(false)} />}
    </>
  );
}

function ProjectSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-busy="true">
      <div className="skeleton" style={{ height: 26, width: 320 }} />
      <div className="skeleton" style={{ height: 62, borderRadius: 14 }} />
      <div className="skeleton" style={{ height: 240, borderRadius: 14 }} />
    </div>
  );
}
