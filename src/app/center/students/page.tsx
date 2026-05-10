"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import CenterLayout from "@/components/CenterLayout";

const PENDING_STUDENTS = [
  { id: "p1", name: "Alain Nkomo", email: "alain.nkomo@gmail.com", teacher: "Sophie Tanda", classroom: "A1 Matinée", level: "A1", requestedAt: "2026-05-09T14:22:00Z" },
  { id: "p2", name: "Celine Fogue", email: "celine.fogue@gmail.com", teacher: "Dr. Beatrice Momo", classroom: "B1 Avancé", level: "B1", requestedAt: "2026-05-10T08:05:00Z" },
  { id: "p3", name: "Samuel Manga", email: "samuel.manga@gmail.com", teacher: "Jean-Pierre Nkolo", classroom: "B2 Conversation", level: "A2", requestedAt: "2026-05-10T10:30:00Z" },
];

interface Student {
  id: string;
  name: string;
  email: string;
  teacher: string;
  classroom: string;
  level: string;
  xp: number;
  streak: number;
  subscription: "FREE" | "BASIC" | "PREMIUM" | "ANNUAL";
  lastActive: string;
  avgScore: number;
  progress: number;
}

const STUDENTS: Student[] = [
  { id: "s1",  name: "Marie Nguemo",       email: "marie.nguemo@gmail.com",     teacher: "Sophie Tanda",        classroom: "A1 Matinée",     level: "A1", xp: 1850, streak: 12, subscription: "PREMIUM", lastActive: "2025-05-08", avgScore: 8.2, progress: 68 },
  { id: "s2",  name: "Paul Atangana",      email: "paul.atangana@gmail.com",    teacher: "Sophie Tanda",        classroom: "A1 Matinée",     level: "A1", xp: 920,  streak: 3,  subscription: "FREE",    lastActive: "2025-05-06", avgScore: 4.5, progress: 35 },
  { id: "s3",  name: "Diane Biya",         email: "diane.biya@gmail.com",       teacher: "Dr. Beatrice Momo",   classroom: "B1 Avancé",      level: "B1", xp: 2100, streak: 21, subscription: "ANNUAL",  lastActive: "2025-05-09", avgScore: 9.1, progress: 82 },
  { id: "s4",  name: "Eric Fotso",         email: "eric.fotso@gmail.com",       teacher: "Jean-Pierre Nkolo",   classroom: "B2 Conversation",level: "B2", xp: 430,  streak: 0,  subscription: "FREE",    lastActive: "2025-04-28", avgScore: 3.2, progress: 18 },
  { id: "s5",  name: "Sandrine Kamga",     email: "sandrine.kamga@gmail.com",   teacher: "Sophie Tanda",        classroom: "A1 Soir",        level: "A1", xp: 1560, streak: 7,  subscription: "BASIC",   lastActive: "2025-05-07", avgScore: 7.4, progress: 58 },
  { id: "s6",  name: "Jean Mbarga",        email: "jean.mbarga@gmail.com",      teacher: "Arsène Biyong",       classroom: "A2 TELC Prep",   level: "A2", xp: 680,  streak: 2,  subscription: "PREMIUM", lastActive: "2025-05-05", avgScore: 5.8, progress: 42 },
  { id: "s7",  name: "Olivia Tchamba",     email: "olivia.tchamba@gmail.com",   teacher: "Dr. Beatrice Momo",   classroom: "B1 Avancé",      level: "B1", xp: 3200, streak: 30, subscription: "ANNUAL",  lastActive: "2025-05-09", avgScore: 9.4, progress: 94 },
  { id: "s8",  name: "Marc Essono",        email: "marc.essono@gmail.com",      teacher: "Jean-Pierre Nkolo",   classroom: "B2 Conversation",level: "B2", xp: 1100, streak: 5,  subscription: "BASIC",   lastActive: "2025-05-04", avgScore: 6.1, progress: 47 },
  { id: "s9",  name: "Brice Ondoua",       email: "brice.ondoua@gmail.com",     teacher: "Arsène Biyong",       classroom: "A2 TELC Prep",   level: "A2", xp: 780,  streak: 4,  subscription: "PREMIUM", lastActive: "2025-05-08", avgScore: 6.8, progress: 53 },
  { id: "s10", name: "Fatiha Moussa",      email: "fatiha.moussa@gmail.com",    teacher: "Sophie Tanda",        classroom: "A1 Soir",        level: "A1", xp: 460,  streak: 1,  subscription: "FREE",    lastActive: "2025-05-03", avgScore: 3.8, progress: 22 },
];

const SUB_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  FREE:    { color: "#64748b", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.25)" },
  BASIC:   { color: "#6366f1", bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.25)"  },
  PREMIUM: { color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.25)"  },
  ANNUAL:  { color: "#eab308", bg: "rgba(234,179,8,0.12)",   border: "rgba(234,179,8,0.25)"   },
};

function exportCSV(students: Student[]) {
  const header = "Nom,Email,Enseignant,Classe,Niveau,XP,Streak,Abonnement,Dernière activité,Score moyen,Progression\n";
  const rows = students.map(s =>
    `"${s.name}","${s.email}","${s.teacher}","${s.classroom}","${s.level}",${s.xp},${s.streak},"${s.subscription}","${s.lastActive}",${s.avgScore},${s.progress}%`
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "eleves-centre.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function CenterStudentsPage() {
  const [activeTab, setActiveTab] = useState<"actifs" | "validation">("actifs");
  const [pending, setPending] = useState(PENDING_STUDENTS);
  const [validating, setValidating] = useState<string | null>(null);
  const [teacherFilter, setTeacherFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [subFilter, setSubFilter] = useState("");
  const [search, setSearch] = useState("");

  const handleValidate = async (id: string, action: "validate" | "refuse") => {
    setValidating(id);
    await new Promise(r => setTimeout(r, 600));
    setPending(p => p.filter(s => s.id !== id));
    setValidating(null);
  };

  const teachers = [...new Set(STUDENTS.map(s => s.teacher))];
  const levels   = [...new Set(STUDENTS.map(s => s.level))].sort();

  const filtered = useMemo(() => STUDENTS.filter(s => {
    if (teacherFilter && s.teacher !== teacherFilter) return false;
    if (levelFilter && s.level !== levelFilter) return false;
    if (subFilter && s.subscription !== subFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [teacherFilter, levelFilter, subFilter, search]);

  return (
    <CenterLayout title="Gestion des élèves">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>
            Élèves du centre
          </h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
            {filtered.length} élève{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""} sur {STUDENTS.length} au total
          </p>
        </div>
        <button onClick={() => exportCSV(filtered)} style={{
          background: "rgba(16,185,129,0.1)", color: "#10b981",
          border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10,
          padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          ↓ Exporter CSV
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 4, marginBottom: 24, border: "1px solid rgba(255,255,255,0.06)", width: "fit-content" }}>
        {[
          { key: "actifs", label: "👥 Élèves actifs", count: STUDENTS.length },
          { key: "validation", label: "⏳ En attente", count: pending.length },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as "actifs" | "validation")} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer",
            background: activeTab === t.key ? "rgba(16,185,129,0.12)" : "transparent",
            color: activeTab === t.key ? "#10b981" : "rgba(255,255,255,0.4)",
            fontSize: 13, fontWeight: activeTab === t.key ? 700 : 400, transition: "all 0.15s",
          }}>
            {t.label}
            {t.count > 0 && (
              <span style={{
                background: activeTab === t.key ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)",
                color: activeTab === t.key ? "#10b981" : "rgba(255,255,255,0.3)",
                border: `1px solid ${activeTab === t.key ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 99, padding: "0 8px", fontSize: 11, fontWeight: 700,
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Validation tab */}
      {activeTab === "validation" && (
        <div>
          {pending.length === 0 ? (
            <div style={{ background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "48px 0", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>Aucune demande en attente</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pending.map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "16px 20px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    {p.name.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>
                      {p.email} · {p.teacher} · {p.classroom} · Niveau {p.level}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 2 }}>
                      Demande reçue le {new Date(p.requestedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => handleValidate(p.id, "validate")}
                      disabled={validating === p.id}
                      style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                    >
                      {validating === p.id ? "..." : "✅ Valider"}
                    </button>
                    <button
                      onClick={() => handleValidate(p.id, "refuse")}
                      disabled={validating === p.id}
                      style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                    >
                      ❌ Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "actifs" && <>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 9, padding: "8px 14px",
        }}>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un élève..."
            style={{ background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontSize: 13, flex: 1 }} />
        </div>
        {/* Teacher */}
        <select value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)} style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 9, padding: "8px 14px", color: teacherFilter ? "#e2e8f0" : "rgba(255,255,255,0.35)",
          fontSize: 13, outline: "none",
        }}>
          <option value="">Tous les enseignants</option>
          {teachers.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {/* Level */}
        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 9, padding: "8px 14px", color: levelFilter ? "#e2e8f0" : "rgba(255,255,255,0.35)",
          fontSize: 13, outline: "none",
        }}>
          <option value="">Tous les niveaux</option>
          {levels.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        {/* Subscription */}
        <select value={subFilter} onChange={e => setSubFilter(e.target.value)} style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 9, padding: "8px 14px", color: subFilter ? "#e2e8f0" : "rgba(255,255,255,0.35)",
          fontSize: 13, outline: "none",
        }}>
          <option value="">Tous les abonnements</option>
          <option value="FREE">Gratuit</option>
          <option value="BASIC">Basic</option>
          <option value="PREMIUM">Premium</option>
          <option value="ANNUAL">Annuel</option>
        </select>
        {(teacherFilter || levelFilter || subFilter || search) && (
          <button onClick={() => { setTeacherFilter(""); setLevelFilter(""); setSubFilter(""); setSearch(""); }} style={{
            background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 9, padding: "8px 14px", fontSize: 13, cursor: "pointer",
          }}>✕ Réinitialiser</button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Élève", "Enseignant · Classe", "Niveau", "XP", "Score moy.", "Progression", "Abonnement", "Dernière activité", ""].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const ss = SUB_STYLE[s.subscription];
              const scoreColor = s.avgScore >= 7 ? "#10b981" : s.avgScore >= 5 ? "#f59e0b" : "#ef4444";
              const pct = s.progress;
              const progColor = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";

              return (
                <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <td style={{ padding: "13px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.08))",
                        border: "1px solid rgba(16,185,129,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#10b981", fontWeight: 700, fontSize: 11,
                      }}>
                        {s.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{s.teacher}</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{s.classroom}</div>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <span style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                      {s.level}
                    </span>
                  </td>
                  <td style={{ padding: "13px 14px", color: "#e2e8f0", fontSize: 13 }}>{s.xp.toLocaleString()}</td>
                  <td style={{ padding: "13px 14px" }}>
                    <span style={{ color: scoreColor, fontWeight: 700, fontSize: 13 }}>{s.avgScore}/10</span>
                  </td>
                  <td style={{ padding: "13px 14px", minWidth: 120 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ background: "#1e2530", borderRadius: 4, height: 5, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: progColor, borderRadius: 4 }} />
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                      {s.subscription}
                    </span>
                  </td>
                  <td style={{ padding: "13px 14px", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                    {new Date(s.lastActive).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <Link href={`/teacher/students/${s.id}`} style={{
                        background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)",
                        border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6,
                        padding: "3px 10px", fontSize: 11, textDecoration: "none", whiteSpace: "nowrap",
                      }}>Profil</Link>
                      <button style={{
                        background: "rgba(99,102,241,0.08)", color: "#6366f1",
                        border: "1px solid rgba(99,102,241,0.2)", borderRadius: 6,
                        padding: "3px 10px", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap",
                      }}>Abonnement</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
            Aucun élève ne correspond à ces filtres.
          </div>
        )}
      </div>
      </>}
    </CenterLayout>
  );
}
