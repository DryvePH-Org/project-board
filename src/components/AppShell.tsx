"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useWorkspace } from "@/lib/store";
import { useAuthUser } from "@/lib/useAuthUser";
import { Icon } from "./Icons";
import { ProjectForm } from "./ProjectForm";
import { UpdateForm } from "./UpdateForm";

export function AppShell({ children }: { children: ReactNode }) {
  const { mode, loading, user, setUser } = useWorkspace();
  const me = useAuthUser();
  const [projectOpen, setProjectOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);

  useEffect(() => {
    if (me?.name && me.name !== user) setUser(me.name);
  }, [me?.name, user, setUser]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "n") {
        e.preventDefault();
        setProjectOpen(true);
      }
      if (e.key === "u") {
        e.preventDefault();
        setUpdateOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const teamName = process.env.NEXT_PUBLIC_TEAM_NAME || "Delivery team";

  return (
    <>
      <header className="appbar">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Icon name="bolt" size={15} />
          </span>
          <span className="brand-name">Pulseboard</span>
          <span className="brand-team">{teamName}</span>
        </Link>

        <div className="appbar-actions">
          <button className="btn btn-outline btn-sm" type="button" onClick={() => setUpdateOpen(true)}>
            <Icon name="note" size={14} />
            <span className="hide-sm">Log update</span>
          </button>
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setProjectOpen(true)}>
            <Icon name="plus" size={14} />
            <span className="hide-sm">New project</span>
          </button>

          {me && (
            <div className="appbar-me">
              <span className="avatar" title={me.email}>
                {initials(me.name)}
              </span>
              <span className="appbar-me-name hide-sm">{me.name}</span>
              <form action="/auth/signout" method="post">
                <button className="btn btn-icon" type="submit" title="Sign out" aria-label="Sign out">
                  <Icon name="logout" size={15} />
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      {mode === "demo" && (
        <div className="demo-strip">
          <Icon name="database" size={13} />
          <span>
            <strong>Demo mode</strong> — saved in this browser only, not shared yet.
          </span>
          <Link href="/setup" className="demo-strip-link">
            Connect Supabase <Icon name="arrow-right" size={12} />
          </Link>
        </div>
      )}

      <main className="page">{loading ? <LoadingState /> : children}</main>

      {projectOpen && <ProjectForm onClose={() => setProjectOpen(false)} />}
      {updateOpen && <UpdateForm onClose={() => setUpdateOpen(false)} />}
    </>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }} aria-busy="true">
      <div className="skeleton" style={{ height: 30, width: 180 }} />
      <div className="skeleton" style={{ height: 74, borderRadius: 14 }} />
      <div className="skeleton" style={{ height: 74, borderRadius: 14 }} />
      <div className="skeleton" style={{ height: 74, borderRadius: 14 }} />
      <div className="skeleton" style={{ height: 74, borderRadius: 14 }} />
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
