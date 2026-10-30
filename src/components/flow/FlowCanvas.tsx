"use client";

import "@xyflow/react/dist/style.css";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
} from "@xyflow/react";
import { FlowNodeCard } from "./FlowNode";
import { NodeInspector } from "./NodeInspector";
import { NODE_KINDS } from "@/lib/constants";
import { layoutNodes, toFlowEdges, toFlowNodes, wouldCreateCycle, type FlowNodeType } from "@/lib/flow";
import { useWorkspace } from "@/lib/store";
import type { NodeKind, Project, ProjectEdge, ProjectNode } from "@/lib/types";

const nodeTypes = { pulse: FlowNodeCard };

export function FlowCanvas({
  project,
  nodes,
  edges,
}: {
  project: Project;
  nodes: ProjectNode[];
  edges: ProjectEdge[];
}) {
  const { addNode, addEdge, deleteEdge, deleteNode, notify } = useWorkspace();
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<FlowNodeType>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(toFlowEdges(edges));
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newKind, setNewKind] = useState<NodeKind>("step");

  /** Dragging is a view preference, not data — the nodes table has no position. */
  const dragged = useRef<Record<string, { x: number; y: number }>>({});

  const layout = useMemo(() => layoutNodes(nodes, edges), [nodes, edges]);
  const styled = useMemo(() => toFlowNodes(nodes, layout), [nodes, layout]);

  useEffect(() => {
    setRfNodes(
      styled.map((node) => {
        const position = dragged.current[node.id];
        return position ? { ...node, position } : node;
      }),
    );
  }, [styled, setRfNodes]);

  useEffect(() => {
    setRfEdges(toFlowEdges(edges));
  }, [edges, setRfEdges]);

  const node = nodes.find((n) => n.id === selectedNode) ?? null;
  const link = edges.find((e) => e.id === selectedEdge) ?? null;
  const edgeCount = node ? edges.filter((e) => e.sourceId === node.id || e.targetId === node.id).length : 0;

  function connect(connection: Connection) {
    const source = connection.source;
    const target = connection.target;
    if (!source || !target) return;
    if (source === target) {
      notify("A step cannot link to itself.", "info");
      return;
    }
    if (edges.some((e) => e.sourceId === source && e.targetId === target)) {
      notify("Those steps are already linked.", "info");
      return;
    }
    if (wouldCreateCycle(edges, source, target)) {
      notify("That link would loop back on itself.", "error");
      return;
    }
    void addEdge({ projectId: project.id, sourceId: source, targetId: target });
  }

  async function submitNode(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const ok = await addNode({
      projectId: project.id,
      title,
      note: "",
      kind: newKind,
      state: "idea",
      dueDate: null,
    });
    if (ok) setNewTitle("");
  }

  if (nodes.length === 0) {
    return (
      <div className="flow-canvas flow-canvas--empty">
        <p className="flow-canvas__empty-title">Nothing to draw yet</p>
        <p className="flow-canvas__empty">Add a step above, then drag from its right edge to another step to link them.</p>
      </div>
    );
  }

  return (
    <div className="flow-canvas">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={connect}
        onNodeClick={(_, n) => {
          setSelectedNode(n.id);
          setSelectedEdge(null);
        }}
        onEdgeClick={(_, e) => {
          setSelectedEdge(e.id);
          setSelectedNode(null);
        }}
        onPaneClick={() => {
          setSelectedNode(null);
          setSelectedEdge(null);
        }}
        onNodeDragStop={(_, n) => {
          dragged.current[n.id] = n.position;
        }}
        deleteKeyCode={null}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        minZoom={0.4}
        proOptions={{ hideAttribution: false }}
      >
        <Background gap={22} size={1} />
        <Controls showInteractive={false} position="bottom-left" />

        <Panel position="top-left">
          <form className="flow-add" onSubmit={submitNode}>
            <input
              className="input input-sm"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a step…"
              aria-label="New step"
            />
            <select
              className="select select-sm"
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as NodeKind)}
              aria-label="Kind"
              style={{ width: 104 }}
            >
              {NODE_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
            <button className="btn btn-outline btn-sm" type="submit" disabled={!newTitle.trim()}>
              Add
            </button>
          </form>
        </Panel>

        {link && (
          <Panel position="top-right">
            <div className="flow-link-chip">
              <span className="flow-link-chip__text">
                {nodes.find((n) => n.id === link.sourceId)?.title ?? "Step"} →{" "}
                {nodes.find((n) => n.id === link.targetId)?.title ?? "Step"}
              </span>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => void deleteEdge(link.id)}>
                Remove link
              </button>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {node && (
        <NodeInspector
          node={node}
          edgeCount={edgeCount}
          onClose={() => setSelectedNode(null)}
          onDelete={(id) => {
            setSelectedNode(null);
            void deleteNode(id);
          }}
        />
      )}
    </div>
  );
}
