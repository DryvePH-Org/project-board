"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icons";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      setError("Supabase isn't connected yet. Add the env vars first.");
      return;
    }

    setSending(true);
    const supabase = getSupabase();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setSending(false);

    if (authError) {
      const blocked = /database error|not on the team list/i.test(authError.message);
      setError(
        blocked
          ? "That email isn't on the team list yet. Ask an admin to add it."
          : authError.message,
      );
      return;
    }

    setSentTo(email.trim());
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">
            <Icon name="bolt" size={16} />
          </span>
          <span className="brand-name">Pulseboard</span>
        </div>

        {sentTo ? (
          <>
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-text">
              We sent a sign-in link to <strong>{sentTo}</strong>. Open it on this device to continue.
            </p>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => {
                setSentTo(null);
                setEmail("");
              }}
            >
              Use a different email
            </button>
          </>
        ) : (
          <>
            <h1 className="auth-title">Sign in</h1>
            <p className="auth-text">Use your team email. We&apos;ll send you a one-time link — no password to remember.</p>

            <form className="auth-form" onSubmit={submit}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@team.com"
                autoComplete="email"
                autoFocus
                required
                disabled={sending}
              />
              <button className="btn btn-primary" type="submit" disabled={sending || !email.trim()}>
                {sending ? "Sending…" : "Email me a sign-in link"}
              </button>
            </form>

            {error && <p className="auth-error">{error}</p>}

            {!isSupabaseConfigured && (
              <p className="auth-hint">
                Supabase isn&apos;t configured. <Link href="/setup">Open setup</Link>
              </p>
            )}
          </>
        )}

        <p className="auth-foot">Only emails on the team list can get in.</p>
      </div>
    </main>
  );
}
