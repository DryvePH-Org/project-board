"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icons";
import { useWorkspace } from "@/lib/store";

const ENV_SNIPPET = `NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
NEXT_PUBLIC_TEAM_NAME=My Team`;

export default function SetupPage() {
  const { mode, refresh, data } = useWorkspace();
  const [copied, setCopied] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  async function check() {
    setChecking(true);
    setResult(null);
    await refresh();
    setChecking(false);
    setResult(
      mode === "demo"
        ? "Still in demo mode — add the two environment variables, then restart the server."
        : "Connected. If you can read this, the database is reachable.",
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Connect your database</h1>
          <p className="page-sub">
            Right now this app is in <strong>{mode === "demo" ? "demo mode" : "Supabase mode"}</strong>. Demo mode saves
            data in this browser only. Follow these steps once and every teammate will see the same live projects.
          </p>
        </div>
      </div>

      <div className="setup">
        <div className="banner banner-accent" style={{ marginBottom: 0 }}>
          <Icon name="bolt" size={16} />
          <span>
            Free plan is plenty: Supabase gives you a 500 MB Postgres database, and Vercel hosts the app for free.
          </span>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Five-minute setup</h2>
            <span className="muted">{mode === "supabase" ? "Looks connected" : "Not connected yet"}</span>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="step">
              <span className="step-num">1</span>
              <div style={{ flex: 1 }}>
                <div className="strong" style={{ marginBottom: 3 }}>
                  Create a Supabase project
                </div>
                <p className="small muted" style={{ marginBottom: 6 }}>
                  Go to{" "}
                  <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 600 }}>
                    supabase.com/dashboard
                  </a>{" "}
                  → New project. Pick any name, a strong database password, and the region closest to your team.
                </p>
              </div>
            </div>

            <div className="step">
              <span className="step-num">2</span>
              <div style={{ flex: 1 }}>
                <div className="strong" style={{ marginBottom: 3 }}>
                  Run the schema
                </div>
                <p className="small muted" style={{ marginBottom: 8 }}>
                  In Supabase, open <strong>SQL Editor</strong> → New query. Paste the entire contents of{" "}
                  <span className="mono">supabase/schema.sql</span> from this folder and click <strong>Run</strong>. That
                  sets up sign-in, the team allowlist, and the <span className="mono">projects</span>/
                  <span className="mono">nodes</span>/<span className="mono">edges</span> tables behind the board — read
                  the comment at the top of the file first, it tells you to add your own email before anyone can sign up.
                </p>
                <p className="small muted">
                  Optional: run <span className="mono">supabase/seed.sql</span> too if you want a couple of example
                  projects with a board already mapped out.
                </p>
              </div>
            </div>

            <div className="step">
              <span className="step-num">3</span>
              <div style={{ flex: 1 }}>
                <div className="strong" style={{ marginBottom: 3 }}>
                  Copy your API keys
                </div>
                <p className="small muted" style={{ marginBottom: 8 }}>
                  Supabase → <strong>Project Settings → API</strong>. Copy the <strong>Project URL</strong> and the{" "}
                  <strong>anon public</strong> key.
                </p>
                <div className="row" style={{ alignItems: "stretch", gap: 8 }}>
                  <pre className="code" style={{ flex: 1, margin: 0, minWidth: 0 }}>
                    {ENV_SNIPPET}
                  </pre>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => void copy(ENV_SNIPPET, "env")}
                    style={{ alignSelf: "flex-start" }}
                  >
                    <Icon name={copied === "env" ? "check" : "note"} size={13} />
                    {copied === "env" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <div className="step">
              <span className="step-num">4</span>
              <div style={{ flex: 1 }}>
                <div className="strong" style={{ marginBottom: 3 }}>
                  Add them locally, then deploy
                </div>
                <p className="small muted">
                  Create a file named <span className="mono">.env.local</span> in this folder with the snippet above,
                  then restart <span className="mono">npm run dev</span>. To deploy: push the folder to GitHub, import it
                  in Vercel, and add the same two variables under Project Settings → Environment Variables.
                </p>
              </div>
            </div>

            <div className="step">
              <span className="step-num">5</span>
              <div style={{ flex: 1 }}>
                <div className="strong" style={{ marginBottom: 3 }}>
                  Verify
                </div>
                <p className="small muted" style={{ marginBottom: 8 }}>
                  After restarting, this page should say <strong>Supabase mode</strong>. Test by adding a project from one
                  device and refreshing on another.
                </p>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn btn-outline btn-sm" type="button" onClick={() => void check()} disabled={checking}>
                    <Icon name="database" size={13} />
                    {checking ? "Checking…" : "Run connection check"}
                  </button>
                  <span className="tiny muted">{data.projects.length} projects loaded</span>
                </div>
                {result && <p className="small" style={{ marginTop: 8, color: "var(--ink-2)" }}>{result}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Before you share the link</h2>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="row" style={{ alignItems: "flex-start", gap: 9 }}>
              <Icon name="shield" size={16} style={{ marginTop: 2, flex: "none", color: "var(--amber)" }} />
              <p className="small" style={{ color: "var(--ink-2)", lineHeight: 1.6 }}>
                <strong>Sign-in is required.</strong> Add each teammate's email to the{" "}
                <span className="mono">allowed_emails</span> table — only emails on that list can create an account. Everyone
                else is sent to <span className="mono">/login</span> and emailed a one-time link, no password required.
              </p>
            </div>
            <div className="row" style={{ alignItems: "flex-start", gap: 9 }}>
              <Icon name="clock" size={16} style={{ marginTop: 2, flex: "none", color: "var(--muted)" }} />
              <p className="small" style={{ color: "var(--ink-2)", lineHeight: 1.6 }}>
                <strong>Free projects pause after a week of inactivity.</strong> Daily use keeps it awake. If it ever
                pauses, open the Supabase dashboard and restore it — no data is lost.
              </p>
            </div>
          </div>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <Link href="/" className="btn btn-outline">
            <Icon name="chevron-left" size={14} /> Back to projects
          </Link>
          <a href="https://supabase.com/docs/guides/database/tables" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
            Supabase docs <Icon name="external" size={12} />
          </a>
        </div>
      </div>
    </>
  );
}
