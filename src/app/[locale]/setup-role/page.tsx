"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";

type Role = "STUDENT" | "TEACHER" | "CENTER_MANAGER";

const ROLES: { key: Role; emoji: string; label: string; sub: string; color: string; dest: string }[] = [
  { key: "STUDENT",        emoji: "🎓", label: "Apprenant",        sub: "J'apprends l'allemand",         color: "#10b981", dest: "/dashboard" },
  { key: "TEACHER",        emoji: "👨‍🏫", label: "Enseignant",       sub: "J'enseigne et gère des classes",  color: "#6366f1", dest: "/teacher" },
  { key: "CENTER_MANAGER", emoji: "🏫", label: "Gestionnaire centre", sub: "Je gère un centre de langues", color: "#eab308", dest: "/center" },
];

export default function SetupRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(role: Role, dest: string) {
    setLoading(role);
    setError(null);
    try {
      const res = await fetch("/api/fix-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      router.push(dest);
      router.refresh();
    } catch {
      setError("Impossible de mettre à jour le rôle. Réessaie.");
      setLoading(null);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.45s ease forwards; }
      `}</style>

      <div
        className="fade-up"
        style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          background: "#080c10", fontFamily: "'DM Mono', monospace", padding: "24px 16px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 440 }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: "2rem", marginBottom: 10 }}></div>
            <h1 style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.3rem" }}>
              Yema
            </h1>
            <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.35)", fontSize: "0.78rem" }}>
              Ton profil n&apos;a pas encore de rôle assigné
            </p>
          </div>

          <div style={{
            borderRadius: 24, padding: "28px 24px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
          }}>
            <h2 style={{ margin: "0 0 6px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
              Quel est ton rôle ?
            </h2>
            <p style={{ margin: "0 0 24px", color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>
              Cette action est unique — choisis correctement.
            </p>

            {error && (
              <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: "0.75rem" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {ROLES.map(({ key, emoji, label, sub, color, dest }) => (
                <button
                  key={key}
                  onClick={() => choose(key, dest)}
                  disabled={loading !== null}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "16px 18px", borderRadius: 16, cursor: loading ? "not-allowed" : "pointer",
                    background: loading === key ? `${color}20` : `${color}0a`,
                    border: `1px solid ${color}${loading === key ? "50" : "22"}`,
                    opacity: loading !== null && loading !== key ? 0.45 : 1,
                    transition: "all 0.15s",
                    textAlign: "left",
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = `${color}18`; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = `${color}0a`; }}
                >
                  <div style={{
                    width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem",
                    background: `${color}18`, border: `1px solid ${color}30`,
                  }}>
                    {loading === key ? "⏳" : emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "rgba(255,255,255,0.9)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.88rem" }}>
                      {loading === key ? "Configuration en cours…" : label}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", marginTop: 2 }}>{sub}</div>
                  </div>
                  <span style={{ color: color, fontSize: 20, opacity: 0.5 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
