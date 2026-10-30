"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Project, ProjectEdge, ProjectNode } from "@/lib/types";
import { NodeList } from "./NodeList";

/** React Flow measures the DOM, so it stays out of the server render and out of
 * the home/overview bundle until the Flow module is opened. */
const FlowCanvas = dynamic(() => import("../flow/FlowCanvas").then((m) => m.FlowCanvas), {
  ssr: false,
  loading: () => <div className="flow-canvas flow-canvas--loading" />,
});

type FlowView = "canvas" | "list";

export function FlowModule({
  project,
  nodes,
  edges,
}: {
  project: Project;
  nodes: ProjectNode[];
  edges: ProjectEdge[];
}) {
  const [view, setView] = useState<FlowView>("canvas");

  return (
    <div className="section">
      <div className="section-head">
        <h2>Flow</h2>
        <span>{nodes.length}</span>
        <span className="spacer" />
        <div className="segmented" role="group" aria-label="Flow view">
          <button
            type="button"
            className={`segmented__item${view === "canvas" ? " active" : ""}`}
            onClick={() => setView("canvas")}
          >
            Canvas
          </button>
          <button
            type="button"
            className={`segmented__item${view === "list" ? " active" : ""}`}
            onClick={() => setView("list")}
          >
            List
          </button>
        </div>
      </div>

      {view === "list" ? (
        <NodeList project={project} nodes={nodes} />
      ) : (
        <FlowCanvas project={project} nodes={nodes} edges={edges} />
      )}
    </div>
  );
}
