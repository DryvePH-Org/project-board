"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { demoRepository } from "./demoRepo";
import { isSupabaseConfigured } from "./supabase";
import { supabaseRepository } from "./supabaseRepo";
import type {
  Blocker,
  BlockerInput,
  DataSet,
  EdgeInput,
  NodeInput,
  Project,
  ProjectInput,
  ProjectNode,
  Repository,
  UpdateInput,
} from "./types";

const EMPTY: DataSet = { projects: [], updates: [], blockers: [], nodes: [], edges: [] };

type ToastTone = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface WorkspaceValue {
  data: DataSet;
  loading: boolean;
  error: string | null;
  mode: "supabase" | "demo";
  user: string;
  setUser: (name: string) => void;
  refresh: () => Promise<void>;
  createProject: (input: ProjectInput) => Promise<boolean>;
  updateProject: (id: string, patch: Partial<Project>) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  addUpdate: (input: UpdateInput) => Promise<boolean>;
  deleteUpdate: (id: string) => Promise<boolean>;
  addBlocker: (input: BlockerInput) => Promise<boolean>;
  updateBlocker: (id: string, patch: Partial<Blocker>) => Promise<boolean>;
  deleteBlocker: (id: string) => Promise<boolean>;
  addNode: (input: NodeInput) => Promise<boolean>;
  updateNode: (id: string, patch: Partial<ProjectNode>) => Promise<boolean>;
  deleteNode: (id: string) => Promise<boolean>;
  addEdge: (input: EdgeInput) => Promise<boolean>;
  deleteEdge: (id: string) => Promise<boolean>;
  notify: (message: string, tone?: ToastTone) => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const repo: Repository = useMemo(
    () => (isSupabaseConfigured ? supabaseRepository : demoRepository),
    [],
  );

  const [data, setData] = useState<DataSet>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUserState] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const notify = useCallback((message: string, tone: ToastTone = "success") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await repo.loadAll();
      setData(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your data.");
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    const saved = window.localStorage.getItem("pulseboard.user");
    if (saved) setUserState(saved);
    void refresh();
  }, [refresh]);

  // Light polling so teammates see each other's changes without a reload.
  useEffect(() => {
    if (repo.kind !== "supabase") return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [repo.kind, refresh]);

  const setUser = useCallback((name: string) => {
    setUserState(name);
    window.localStorage.setItem("pulseboard.user", name);
  }, []);

  const run = useCallback(
    async (action: () => Promise<void>, successMessage: string): Promise<boolean> => {
      try {
        await action();
        await refresh();
        if (successMessage) notify(successMessage);
        return true;
      } catch (err) {
        notify(err instanceof Error ? err.message : "Something went wrong.", "error");
        return false;
      }
    },
    [notify, refresh],
  );

  const value = useMemo<WorkspaceValue>(
    () => ({
      data,
      loading,
      error,
      mode: repo.kind,
      user,
      setUser,
      refresh,
      createProject: (input) => run(() => repo.createProject(input), "Project created"),
      updateProject: (id, patch) => run(() => repo.updateProject(id, patch), "Project updated"),
      deleteProject: (id) => run(() => repo.deleteProject(id), "Project deleted"),
      addUpdate: (input) => run(() => repo.addUpdate(input), "Update logged"),
      deleteUpdate: (id) => run(() => repo.deleteUpdate(id), "Update removed"),
      addBlocker: (input) => run(() => repo.addBlocker(input), "Blocker added"),
      updateBlocker: (id, patch) => run(() => repo.updateBlocker(id, patch), "Blocker updated"),
      deleteBlocker: (id) => run(() => repo.deleteBlocker(id), "Blocker removed"),
      addNode: (input) => run(() => repo.addNode(input), "Node added"),
      updateNode: (id, patch) => run(() => repo.updateNode(id, patch), "Node updated"),
      deleteNode: (id) => run(() => repo.deleteNode(id), "Node removed"),
      addEdge: (input) => run(() => repo.addEdge(input), ""),
      deleteEdge: (id) => run(() => repo.deleteEdge(id), "Link removed"),
      notify,
      toasts,
      dismissToast,
    }),
    [data, loading, error, repo, user, setUser, refresh, run, notify, toasts, dismissToast],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            className={`toast toast-${toast.tone}`}
            onClick={() => dismissToast(toast.id)}
            type="button"
          >
            {toast.message}
          </button>
        ))}
      </div>
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}

/** Derived selectors used across pages. */
export function useProjects() {
  const { data } = useWorkspace();
  return useMemo(
    () => data.projects.filter((p) => !p.archived).sort((a, b) => a.name.localeCompare(b.name)),
    [data.projects],
  );
}
