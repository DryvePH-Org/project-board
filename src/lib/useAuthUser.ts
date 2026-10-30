"use client";

import { useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

/** Reads the signed-in user and their profile name on the client. */
export function useAuthUser(): AuthUser | null {
  const [me, setMe] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();
    let alive = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!alive) return;

      if (!user) {
        setMe(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .maybeSingle();

      if (!alive) return;
      const fallback = user.email ? user.email.split("@")[0] : "Teammate";
      setMe({
        id: user.id,
        name: (profile?.name as string | null)?.trim() || fallback,
        email: (profile?.email as string | null) || user.email || "",
      });
    }

    void load();
    const { data } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return me;
}
