"use client";

import { useState, useEffect } from "react";
import { Link } from "@/navigation";
import Layout from "@/components/Layout";

interface Member { id: string; fullName: string; germanLevel: string | null; xpTotal: number; streakDays: number; }
interface Group { id: string; name: string; code: string; level?: string; maxMembers: number; isPaid: boolean; creator: { fullName: string; germanLevel: string | null }; members: { user: Member }[]; }
interface Me { studentType?: string; }

const LEVEL_COLORS: Record<string, string> = { A1: "#10b981", A2: "#34d399", B1: "#6366f1", B2: "#8b5cf6", C1: "#f59e0b" };

export default function GroupPage() {
  const [group, setGroup] = useState<Group | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"members" | "activity" | "leaderboard">("members");

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then(r => r.ok ? r.json() : null),
    ]).then(([meData]) => {
      setMe(meData);
      if (meData?.groupId) {
        fetch(`/api/group?id=${meData.groupId}`).then(r => r.ok ? r.json() : null).then(d => {
          if (d?.group) setGroup(d.group);
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const copyCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCreator = me?.studentType === "group_creator";
  const members = group?.members.map(m => m.user) ?? [];
  const sorted = [...members].sort((a, b) => b.xpTotal - a.xpTotal);

  if (loading) return (
    <Layout title="Mon Groupe">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ color: "rgba(255,255,255,0.3)" }}>Chargement...</div>
      </div>
    </Layout>
  );

  if (!group) return (
    <Layout title="Groupe d'étude">
      <div style={{ maxWidth: 560, margin: "40px auto", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 20 }}>👥</div>
        <h2 style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, margin: "0 0 10px" }}>
          Vous n'avez pas encore de groupe
        </h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 28px", lineHeight: 1.6 }}>
          Créez votre propre groupe d'étude ou rejoignez-en un avec le code d'un ami.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/group/create" style={{ background: "#10b981", color: "#fff", borderRadius: 12, padding: "13px 24px", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            + Créer un groupe — 1.500 XAF/mois
          </Link>
          <Link href="/group/join" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "13px 24px", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            Rejoindre →
          </Link>
        </div>
      </div>
    </Layout>
  );

  const lc = group.level ? (LEVEL_COLORS[group.level] ?? "#10b981") : "#10b981";

  return (
    <Layout title={group.name}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');`}</style>

      {/* Header */}
      <div style={{ background: "rgba(13,17,23,0.85)", border: `1px solid ${lc}20`, borderTop: `3px solid ${lc}`, borderRadius: 16, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              {group.level && <span style={{ background: `${lc}20`, color: lc, border: `1px solid ${lc}40`, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 800 }}>{group.level}</span>}
              {isCreator && <span style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>👑 Chef de groupe</span>}
            </div>
            <h1 style={{ margin: "0 0 6px", color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>{group.name}</h1>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
              {members.length} / {group.maxMembers} membres · Créé par {group.creator.fullName}
            </div>
          </div>

          {isCreator && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginBottom: 4 }}>Code du groupe</div>
                <div style={{ color: "#10b981", fontFamily: "monospace", fontWeight: 700, fontSize: 14, letterSpacing: "0.05em" }}>{group.code}</div>
              </div>
              <button onClick={copyCode} style={{ background: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)", color: copied ? "#10b981" : "rgba(255,255,255,0.4)", border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600, transition: "all 0.2s" }}>
                {copied ? "✓ Copié" : "📋 Copier le code"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 4, marginBottom: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
        {(["members", "leaderboard", "activity"] as const).map(t => {
          const labels = { members: "👥 Membres", leaderboard: "🏆 Classement", activity: "⚡ Activité" };
          return (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "9px 16px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: tab === t ? 700 : 400, fontSize: 13, background: tab === t ? "rgba(16,185,129,0.12)" : "transparent", color: tab === t ? "#10b981" : "rgba(255,255,255,0.4)", transition: "all 0.15s" }}>
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* Members */}
      {tab === "members" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {members.map((m, i) => (
            <div key={m.id} style={{ background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", fontWeight: 700, fontSize: 13 }}>
                {m.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>{m.fullName} {i === 0 && isCreator ? <span style={{ fontSize: 11, color: "#f59e0b" }}>👑</span> : ""}</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>{m.germanLevel ?? "?"} · {m.streakDays}🔥</div>
              </div>
              <div style={{ color: "#10b981", fontWeight: 700, fontSize: 13 }}>{m.xpTotal.toLocaleString()} XP</div>
            </div>
          ))}
          {members.length < (group.maxMembers) && isCreator && (
            <div style={{ background: "rgba(16,185,129,0.04)", border: "1px dashed rgba(16,185,129,0.2)", borderRadius: 12, padding: "20px", textAlign: "center" }}>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginBottom: 10 }}>
                {group.maxMembers - members.length} place{group.maxMembers - members.length > 1 ? "s" : ""} disponible{group.maxMembers - members.length > 1 ? "s" : ""}
              </div>
              <button onClick={copyCode} style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                Partager le code : {group.code}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {tab === "leaderboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((m, i) => (
            <div key={m.id} style={{ background: i === 0 ? "rgba(234,179,8,0.08)" : "rgba(13,17,23,0.8)", border: `1px solid ${i === 0 ? "rgba(234,179,8,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 28, textAlign: "center", color: i === 0 ? "#eab308" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "rgba(255,255,255,0.3)", fontWeight: 700, fontSize: 14 }}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13 }}>{m.fullName}</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{m.germanLevel ?? "?"} · {m.streakDays}🔥 streak</div>
              </div>
              <div style={{ color: "#10b981", fontWeight: 700, fontSize: 14 }}>{m.xpTotal.toLocaleString()} XP</div>
            </div>
          ))}
        </div>
      )}

      {/* Activity */}
      {tab === "activity" && (
        <div style={{ background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Le fil d'activité sera disponible prochainement</div>
          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 6 }}>Sessions d'étude, quiz complétés, badges obtenus...</div>
        </div>
      )}
    </Layout>
  );
}
