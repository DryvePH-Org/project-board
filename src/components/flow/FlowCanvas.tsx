"use client";

import "@xyflow/react/dist/style.css";

import { useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  NodeToolbar,
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
} from "@xyflow/react";
import { BoardNotes } from "./BoardNotes";
import { CommentThread } from "./CommentThread";
import { Icon } from "@/components/Icons";
import { FlowNodeCard } from "./FlowNode";
import { EdgePopoverContext, FlowEdgeButton } from "./FlowEdge";
import { NodeInspector } from "./NodeInspector";
import { OverlayLayoutProvider, OverlayViewportSync } from "./OverlayLayout";
import {
  NODE_H,
  NODE_W,
  nextNodePosition,
  toFlowEdges,
  toFlowNodes,
  wouldCreateCycle,
  type FlowNodeType,
} from "@/lib/flow";
import { useWorkspace } from "@/lib/store";
import type { NodeComment, NodeState, Project, ProjectEdge, ProjectNode } from "@/lib/types";

const nodeTypes = { pulse: FlowNodeCard };
const edgeTypes = { pulse: FlowEdgeButton };

const QUICK_STATES: { state: NodeState; label: string; fallback: string }[] = [
  { state: "idea", label: "Idea", fallback: "New idea" },
  { state: "in_progress", label: "In progress", fallback: "New task" },
  { state: "done", label: "Completed", fallback: "New milestone" },
];

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

function CommentToolbar({
  node,
  comments,
  onClose,
}: {
  node: ProjectNode;
  comments: NodeComment[];
  onClose: () => void;
}) {
  const { setCenter, getZoom } = useReactFlow();

  useEffect(() => {
    // Center the block so the thread (which renders at a fixed size,
    // independent of zoom) stays inside the clipped canvas.
    setCenter(node.positionX + NODE_W / 2, node.positionY + NODE_H / 2, {
      zoom: Math.min(getZoom(), 1),
      duration: 250,
    });
  }, [node.id, node.positionX, node.positionY, setCenter, getZoom]);

  return (
    <NodeToolbar nodeId={node.id} isVisible position={Position.Right} align="center" offset={14}>
      <CommentThread node={node} comments={comments} onClose={onClose} />
    </NodeToolbar>
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
    if (c.resolved) return acc;
    acc[c.nodeId] = (acc[c.nodeId] ?? 0) + 1;
    return acc;
  }, {});
  const nodeStates = useMemo(() => {
    const map: Record<string, NodeState> = {};
    for (const n of nodes) map[n.id] = n.state;
    return map;
  }, [nodes]);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<FlowNodeType>(toFlowNodes(nodes, commentCounts));
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(toFlowEdges(edges, nodeStates));
  const [fullscreen, setFullscreen] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [commentNodeIds, setCommentNodeIds] = useState<string[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [openEdgeIds, setOpenEdgeIds] = useState<string[]>([]);
  const [edgeDrafts, setEdgeDrafts] = useState<Record<string, string>>({});
  const [newTitle, setNewTitle] = useState("");
  const [layoutRevision, setLayoutRevision] = useState(0);

  const edgePopover = useMemo(
    () => ({
      openEdgeIds,
      openEdge: (id: string) =>
        setOpenEdgeIds((ids) => (ids.includes(id) ? ids : [...ids, id])),
      closeEdge: (id: string) => setOpenEdgeIds((ids) => ids.filter((x) => x !== id)),
      drafts: edgeDrafts,
      setDraft: (id: string, value: string) =>
        setEdgeDrafts((drafts) => ({ ...drafts, [id]: value })),
    }),
    [openEdgeIds, edgeDrafts],
  );

  useEffect(() => {
    setRfNodes(toFlowNodes(nodes, commentCounts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, comments, setRfNodes]);

  useEffect(() => {
    setRfEdges(toFlowEdges(edges, nodeStates));
  }, [edges, nodeStates, setRfEdges]);

  const node = nodes.find((n) => n.id === selectedNode) ?? null;
  const commentNodes = nodes.filter((n) => commentNodeIds.includes(n.id));
  const nodeComments = node ? comments.filter((c) => c.nodeId === node.id) : [];
  const edgeCount = node ? edges.filter((e) => e.sourceId === node.id || e.targetId === node.id).length : 0;
  const openComments = comments.filter((comment) => !comment.resolved).length;
  const blockerCount = edges.reduce(
    (total, edge) => total + edge.blockers.filter((blocker) => !blocker.resolved).length,
    0,
  );
  const noteCount = openComments + blockerCount;

  function toggleNotes() {
    if (notesOpen) {
      setNotesOpen(false);
      return;
    }
    setSelectedNode(null);
    setCommentNodeIds([]);
    setOpenEdgeIds([]);
    setNotesOpen(true);
  }

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

  async function addQuickBlock(state: NodeState) {
    const preset = QUICK_STATES.find((option) => option.state === state);
    const title = newTitle.trim() || preset?.fallback || "New block";
    const { x, y } = nextNodePosition(nodes);
    const ok = await addNode({
      projectId: project.id,
      title,
      note: "",
      state,
      positionX: x,
      positionY: y,
    });
    if (ok) setNewTitle("");
  }

  const quickAddRow = (
    <div className="flow-add__quick" role="group" aria-label="Quick add a block by state">
      {QUICK_STATES.map((option) => (
        <button
          key={option.state}
          type="button"
          className={`flow-add__quick-btn flow-add__quick-btn--${option.state}`}
          onClick={() => void addQuickBlock(option.state)}
        >
          <span className="flow-add__quick-dot" />
          {option.label}
        </button>
      ))}
    </div>
  );

  const addForm = (
    <form className="flow-add" onSubmit={submitNode}>
      <div className="flow-add__row">
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
      </div>
      {quickAddRow}
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
          <div className="flow-add__row">
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
          </div>
          {quickAddRow}
        </form>
      </div>
    ) : (
      <div className={`flow-canvas${fullscreen ? " flow-canvas--full" : ""}`}>
        <EdgePopoverContext.Provider value={edgePopover}>
          <OverlayLayoutProvider revision={layoutRevision}>
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={connect}
              fitView
              fitViewOptions={{ padding: 0.15 }}
              onNodeClick={(event, n) => {
                setNotesOpen(false);
                const fromComment = (event.target as HTMLElement).closest(".flow-node__comment-btn") !== null;
                if (fromComment) {
                  setCommentNodeIds((ids) =>
                    ids.includes(n.id) ? ids.filter((id) => id !== n.id) : [...ids, n.id],
                  );
                  setSelectedNode(null);
                } else {
                  setSelectedNode(n.id);
                  setCommentNodeIds([]);
                }
              }}
              onNodeDragStop={(_, n) => {
                void updateNode(n.id, { positionX: n.position.x, positionY: n.position.y });
                setLayoutRevision((revision) => revision + 1);
              }}
              onPaneClick={() => {
                setSelectedNode(null);
                setCommentNodeIds([]);
                setNotesOpen(false);
              }}
              deleteKeyCode={null}
              defaultViewport={{ x: 40, y: 40, zoom: 1 }}
              minZoom={0.3}
              proOptions={{ hideAttribution: false }}
            >
              <OverlayViewportSync />
              <Background gap={22} size={1} />
              <Controls showInteractive={false} position="bottom-left" />
              <Panel position="bottom-left" className="flow-canvas__recenter-panel">
                <RecenterButton />
              </Panel>

              <Panel position="top-left">{addForm}</Panel>

              {commentNodes.map((commentNode) => (
                <CommentToolbar
                  key={commentNode.id}
                  node={commentNode}
                  comments={comments.filter((c) => c.nodeId === commentNode.id)}
                  onClose={() => setCommentNodeIds((ids) => ids.filter((id) => id !== commentNode.id))}
                />
              ))}
            </ReactFlow>
          </OverlayLayoutProvider>
        </EdgePopoverContext.Provider>

        {node && (
          <NodeInspector
            node={node}
            comments={nodeComments}
            edgeCount={edgeCount}
            onClose={() => setSelectedNode(null)}
            onDelete={(id) => {
              setSelectedNode(null);
              void deleteNode(id);
            }}
          />
        )}

        {notesOpen && (
          <BoardNotes
            nodes={nodes}
            edges={edges}
            comments={comments}
            onClose={() => setNotesOpen(false)}
          />
        )}
      </div>
    );

  const notesButton = nodes.length > 0 && (
    <button
      className={`btn btn-outline btn-sm${notesOpen ? " btn-outline--active" : ""}`}
      type="button"
      onClick={toggleNotes}
      aria-pressed={notesOpen}
    >
      <Icon name="comment" size={13} /> Notes{noteCount > 0 ? ` (${noteCount})` : ""}
    </button>
  );

  if (!fullscreen) {
    return (
      <div className="flow-embedded">
        <div className="flow-embedded__bar">
          {notesButton}
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
        <span className="spacer" />
        {notesButton}
      </div>
      <div className="flow-fullscreen__canvas">{body}</div>
    </div>
  );
}
