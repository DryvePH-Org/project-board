"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Icon } from "@/components/Icons";
import { ProjectForm } from "@/components/ProjectForm";
import { FlowModule } from "@/components/project/FlowModule";
import { OverviewModule } from "@/components/project/OverviewModule";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectNav, moduleFromParam } from "@/components/project/ProjectNav";
import { EmptyState } from "@/components/ui";
import { commentsFor, edgesFor, nodesFor } from "@/lib/analytics";
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
  const nodes = useMemo(() => (project ? nodesFor(data.nodes, project.id) : []), [data.nodes, project]);
  const edges = useMemo(() => (project ? edgesFor(data.edges, project.id) : []), [data.edges, project]);
  const comments = useMemo(
    () => (project ? commentsFor(data.comments, project.id) : []),
    [data.comments, project],
  );

  const [editOpen, setEditOpen] = useState(false);

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
            onEdit={() => setEditOpen(true)}
            onDelete={() => {
              if (window.confirm(`Delete “${project.name}” and its board? This cannot be undone.`)) {
                void deleteProject(project.id).then((ok) => {
                  if (ok) router.push("/");
                });
              }
            }}
          />

          {module === "overview" && <OverviewModule project={project} nodeCount={nodes.length} />}
          {module === "board" && (
            <FlowModule project={project} nodes={nodes} edges={edges} comments={comments} />
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
