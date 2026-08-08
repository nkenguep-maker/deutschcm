"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/navigation";
import Layout from "@/components/Layout";

interface Member {
  id: string;
  fullName: string;
  germanLevel: string | null;
  xpTotal: number;
  streakDays: number;
}

interface Group {
  id: string;
  name: string;
  code: string;
  level?: string | null;
  maxMembers: number;
  creator: { fullName: string; germanLevel: string | null };
  members: { user: Member }[];
}

interface Me {
  studentType?: string;
  groupId?: string;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: "#10b981",
  A2: "#34d399",
  B1: "#6366f1",
  B2: "#8b5cf6",
  C1: "#f59e0b",
  C2: "#f97316",
};

export default function GroupPage() {
  const [group, setGroup] = useState<Group | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"members" | "leaderboard">("members");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const meRes = await fetch("/api/me");
        if (!meRes.ok) throw new Error("me_failed");
        const meData = await meRes.json() as Me;
        if (cancelled) return;
        setMe(meData);

        if (meData.groupId) {
          const groupRes = await fetch(`/api/group?id=${encodeURIComponent(meData.groupId)}`);
          if (groupRes.ok) {
            const data = await groupRes.json();
            if (!cancelled) setGroup(data.group ?? null);
          } else if (groupRes.status !== 404) {
            throw new Error("group_failed");
          }
        }
      } catch {
        if (!cancelled) setError("Impossible de charger le groupe pour le moment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const members = group?.members.map((m) => m.user) ?? [];
  const leaderboard = useMemo(
    () => [...members].sort((a, b) => b.xpTotal - a.xpTotal),
    [members],
  );
  const isCreator = me?.studentType === "group_creator";

  const copyCode = async () => {
    if (!group) return;
    await navigator.clipboard.writeText(group.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Layout title="Groupe d'étude">
        <div aria-busy="true" style={{ minHeight: 300, display: "grid", placeItems: "center", color: "rgba(255,255,255,0.55)" }}>
          Chargement du groupe…
        </div>
      </Layout>
    );
  }

  if (!group) {
    return (
      <Layout title="Groupe d'étude">
        <main style={{ maxWidth: 620, margin: "48px auto", textAlign: "center", padding: "0 16px" }}>
          <div style={{ fontSize: 52, marginBottom: 18 }}>👥</div>
          <h2 style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, margin: "0 0 10px" }}>
            Vous n'avez pas encore de groupe
          </h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, margin: "0 auto 24px", lineHeight: 1.7, maxWidth: 480 }}>
            Créez un groupe de bêta ou rejoignez celui d'un ami avec son code privé. Aucun paiement n'est demandé pendant la bêta technique.
          </p>
          {error && (
            <div role="alert" style={{ color: "#fca5a5", marginBottom: 18, fontSize: 13 }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/group/create" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", background: "#10b981", color: "#fff", borderRadius: 12, padding: "0 22px", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>
              + Créer un groupe
            </Link>
            <Link href="/group/join" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.72)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "0 22px", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              Rejoindre avec un code →
            </Link>
          </div>
        </main>
      </Layout>
    );
  }

  const accent = group.level ? (LEVEL_COLORS[group.level] ?? "#10b981") : "#10b981";
  const displayed = tab === "leaderboard" ? leaderboard : members;

  return (
    <Layout title={group.name}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');`}</style>

      <main style={{ maxWidth: 920, margin: "0 auto" }}>
        <section style={{ background: "rgba(13,17,23,0.86)", border: `1px solid ${accent}22`, borderTop: `3px solid ${accent}`, borderRadius: 16, padding: "22px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ minWidth: 0, flex: "1 1 260px" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                {group.level && (
                  <span style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}42`, borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 800 }}>
                    {group.level}
                  </span>
                )}
                <span style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.62)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>
                  Bêta technique
                </span>
                {isCreator && (
                  <span style={{ background: "rgba(99,102,241,0.15)", color: "#c7d2fe", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>
                    Créateur
                  </span>
                )}
              </div>
              <h1 style={{ margin: "0 0 6px", color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, overflowWrap: "anywhere" }}>
                {group.name}
              </h1>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.52)", fontSize: 13 }}>
                {members.length} / {group.maxMembers} membres · créé par {group.creator.fullName}
              </p>
            </div>

            {isCreator && (
              <div style={{ minWidth: 190 }}>
                <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "9px 12px", textAlign: "center", marginBottom: 8 }}>
                  <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 10, marginBottom: 4 }}>Code privé</div>
                  <div style={{ color: "#10b981", fontFamily: "monospace", fontWeight: 800, fontSize: 14, letterSpacing: "0.05em" }}>
                    {group.code}
                  </div>
                </div>
                <button onClick={copyCode} style={{ width: "100%", minHeight: 44, background: "rgba(255,255,255,0.05)", color: copied ? "#10b981" : "rgba(255,255,255,0.68)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 9, cursor: "pointer", fontWeight: 700 }}>
                  {copied ? "✓ Copié" : "Copier le code"}
                </button>
              </div>
            )}
          </div>
        </section>

        <nav aria-label="Vue du groupe" style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 4, marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
          {(["members", "leaderboard"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              aria-pressed={tab === item}
              style={{ flex: 1, minHeight: 44, borderRadius: 9, border: "none", cursor: "pointer", fontWeight: tab === item ? 800 : 600, background: tab === item ? "rgba(16,185,129,0.12)" : "transparent", color: tab === item ? "#10b981" : "rgba(255,255,255,0.55)" }}
            >
              {item === "members" ? "👥 Membres" : "🏆 Classement"}
            </button>
          ))}
        </nav>

        <section aria-label={tab === "members" ? "Membres" : "Classement"} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {displayed.map((member, index) => (
            <article key={member.id} style={{ background: index === 0 && tab === "leaderboard" ? "rgba(234,179,8,0.07)" : "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(16,185,129,0.12)", color: "#10b981", fontWeight: 800, fontSize: 12 }}>
                {tab === "leaderboard" && index < 3
                  ? ["🥇", "🥈", "🥉"][index]
                  : member.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, overflowWrap: "anywhere" }}>
                  {member.fullName}
                </div>
                <div style={{ color: "rgba(255,255,255,0.36)", fontSize: 11, marginTop: 2 }}>
                  {member.germanLevel ?? "Niveau non renseigné"} · {member.streakDays} jour{member.streakDays === 1 ? "" : "s"} de série
                </div>
              </div>
              <div style={{ color: "#10b981", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                {member.xpTotal.toLocaleString()} XP
              </div>
            </article>
          ))}
        </section>
      </main>
    </Layout>
  );
}
