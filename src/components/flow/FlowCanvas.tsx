"use client";

import "@xyflow/react/dist/style.css";

import { useEffect, useState } from "react";
import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
} from "@xyflow/react";
import { Icon } from "@/components/Icons";
import { FlowNodeCard } from "./FlowNode";
import { FlowEdgeButton } from "./FlowEdge";
import { NodeInspector } from "./NodeInspector";
import { nextNodePosition, toFlowEdges, toFlowNodes, wouldCreateCycle, type FlowNodeType } from "@/lib/flow";
import { useWorkspace } from "@/lib/store";
import type { NodeComment, Project, ProjectEdge, ProjectNode } from "@/lib/types";

const nodeTypes = { pulse: FlowNodeCard };
const edgeTypes = { pulse: FlowEdgeButton };

function RecenterButton() {
  const { fitView } = useReactFlow();
  return (
    <button
      type="button"
      className="btn btn-icon flow-canvas__recenter"
      title="Find the blocks (recenter the view)"
      aria-label="Recenter on the blocks"
      onClick={() => fitView({ padding: 0.25, duration: 400 })}
    >
      <Icon name="target" size={16} />
    </button>
  );
}

export function FlowCanvas({
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
  const { addNode, addEdge, deleteEdge, deleteNode, updateNode, notify } = useWorkspace();
  const commentCounts = comments.reduce<Record<string, number>>((acc, c) => {
    acc[c.nodeId] = (acc[c.nodeId] ?? 0) + 1;
    return acc;
  }, {});

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<FlowNodeType>(toFlowNodes(nodes, commentCounts));
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(toFlowEdges(edges));
  const [fullscreen, setFullscreen] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [focusComments, setFocusComments] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    setRfNodes(toFlowNodes(nodes, commentCounts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, comments, setRfNodes]);

  useEffect(() => {
    setRfEdges(toFlowEdges(edges));
  }, [edges, setRfEdges]);

  const node = nodes.find((n) => n.id === selectedNode) ?? null;
  const nodeComments = node ? comments.filter((c) => c.nodeId === node.id) : [];
  const edgeCount = node ? edges.filter((e) => e.sourceId === node.id || e.targetId === node.id).length : 0;

  function connect(connection: Connection) {
    const source = connection.source;
    const target = connection.target;
    if (!source || !target) return;
    if (source === target) {
      notify("A block cannot link to itself.", "info");
      return;
    }
    if (edges.some((e) => e.sourceId === source && e.targetId === target)) {
      notify("Those blocks are already linked.", "info");
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
    const { x, y } = nextNodePosition(nodes);
    const ok = await addNode({
      projectId: project.id,
      title,
      note: "",
      state: "idea",
      positionX: x,
      positionY: y,
    });
    if (ok) setNewTitle("");
  }

  function selectNode(id: string, fromCommentButton: boolean) {
    setSelectedNode(id);
    setFocusComments(fromCommentButton);
  }

  const addForm = (
    <form className="flow-add" onSubmit={submitNode}>
      <input
        className="input input-sm"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder="Add a block…"
        aria-label="New block"
      />
      <button className="btn btn-outline btn-sm" type="submit" disabled={!newTitle.trim()}>
        Add
      </button>
    </form>
  );

  const body =
    nodes.length === 0 ? (
      <div className="flow-canvas flow-canvas--empty">
        <p className="flow-canvas__empty-title">Nothing on the board yet</p>
        <p className="flow-canvas__empty">
          Add a block, drag it anywhere, then pull from its right edge to another block to link them.
        </p>
        <form className="flow-add flow-add--centered" onSubmit={submitNode}>
          <input
            className="input input-sm"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a block…"
            aria-label="New block"
            autoFocus
          />
          <button className="btn btn-outline btn-sm" type="submit" disabled={!newTitle.trim()}>
            Add
          </button>
        </form>
      </div>
    ) : (
      <div className={`flow-canvas${fullscreen ? " flow-canvas--full" : ""}`}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={connect}
          onNodeClick={(event, n) => {
            const fromComment = (event.target as HTMLElement).closest(".flow-node__comment-btn") !== null;
            selectNode(n.id, fromComment);
          }}
          onPaneClick={() => setSelectedNode(null)}
          onNodeDragStop={(_, n) => {
            void updateNode(n.id, { positionX: n.position.x, positionY: n.position.y });
          }}
          deleteKeyCode={null}
          defaultViewport={{ x: 40, y: 40, zoom: 1 }}
          minZoom={0.3}
          proOptions={{ hideAttribution: false }}
        >
          <Background gap={22} size={1} />
          <Controls showInteractive={false} position="bottom-left" />
          <Panel position="bottom-left" className="flow-canvas__recenter-panel">
            <RecenterButton />
          </Panel>

          <Panel position="top-left">{addForm}</Panel>
        </ReactFlow>

        {node && (
          <NodeInspector
            node={node}
            comments={nodeComments}
            edgeCount={edgeCount}
            focusComments={focusComments}
            onClose={() => setSelectedNode(null)}
            onDelete={(id) => {
              setSelectedNode(null);
              void deleteNode(id);
            }}
          />
        )}
      </div>
    );

  if (!fullscreen) {
    return (
      <div className="flow-embedded">
        <div className="flow-embedded__bar">
          <button className="btn btn-outline btn-sm" type="button" onClick={() => setFullscreen(true)}>
            <Icon name="maximize" size={14} /> Full screen
          </button>
        </div>
        {body}
      </div>
    );
  }

  return (
    <div className="flow-fullscreen">
      <div className="flow-fullscreen__bar">
        <button className="btn btn-outline btn-sm" type="button" onClick={() => setFullscreen(false)}>
          <Icon name="minimize" size={14} /> Exit full screen
        </button>
        <span className="flow-fullscreen__title">{project.name} — Freeform board</span>
        <span className="tiny muted">{nodes.length} blocks</span>
      </div>
      <div className="flow-fullscreen__canvas">{body}</div>
    </div>
  );
}
