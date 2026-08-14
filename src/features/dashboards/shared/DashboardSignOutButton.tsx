"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { useRouter } from "@/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  locale: "en" | "fr";
  compact?: boolean;
};

export function DashboardSignOutButton({ locale, compact = false }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const label = locale === "en" ? "Sign out" : "Se déconnecter";

  async function signOut() {
    if (pending) return;
    setPending(true);
    try {
      await createClient().auth.signOut();
    } finally {
      router.push("/goodbye");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      aria-label={label}
      title={label}
      style={{
        minHeight: 44,
        minWidth: compact ? 44 : undefined,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: compact ? 0 : 8,
        padding: compact ? 10 : "10px 14px",
        borderRadius: "var(--yema-r-chip)",
        border: "1px solid var(--yema-border)",
        background: "transparent",
        color: "var(--yema-text-muted)",
        cursor: pending ? "wait" : "pointer",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <LogOut size={18} aria-hidden="true" />
      {compact ? null : <span>{pending ? (locale === "en" ? "Signing out…" : "Déconnexion…") : label}</span>}
    </button>
  );
}
