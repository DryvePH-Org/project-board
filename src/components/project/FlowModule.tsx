"use client";

import dynamic from "next/dynamic";
import type { NodeComment, Project, ProjectEdge, ProjectNode } from "@/lib/types";

/** React Flow measures the DOM, so it stays out of the server render and out of
 * the home/overview bundle until the board is opened. */
const FlowCanvas = dynamic(() => import("../flow/FlowCanvas").then((m) => m.FlowCanvas), {
  ssr: false,
  loading: () => <div className="flow-canvas flow-canvas--loading" />,
});

export function FlowModule({
  project,
  nodes,
  edges,
  comments,
}: {
  project: Project;
  nodes: ProjectNode[];
  edges: ProjectEdge[];
  comments: NodeComment[];
}) {
  return <FlowCanvas project={project} nodes={nodes} edges={edges} comments={comments} />;
}
