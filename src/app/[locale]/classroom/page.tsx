"use client";

import { useState } from "react";
import { Link } from "@/navigation";
import Layout from "@/components/Layout";

// ─── Mock data ────────────────────────────────────────────────────────────────

interface Assignment {
  id: string;
  title: string;
  dueDate: string | null;
  submitted: boolean;
}

interface Classroom {
  id: string;
  name: string;
  teacher: string;
  level: string;
  code: string;
  students: number;
  progress: number;
  nextAssignments: Assignment[];
  color: string;
}

const MOCK_CLASSROOMS: Classroom[] = [
  {
    id: "cls-1",
    name: "Allemand A1 — Débutants",
    teacher: "Prof. Sophie Tanda",
    level: "A1",
    code: "DEUTSCH-A1-2024",
    students: 24,
    progress: 68,
    color: "#10b981",
    nextAssignments: [
      { id: "a1", title: "Vocabulaire : Se présenter", dueDate: "2025-05-15", submitted: false },
      { id: "a2", title: "Grammaire : Der/Die/Das",    dueDate: "2025-05-22", submitted: true  },
    ],
  },
  {
    id: "cls-2",
    name: "Préparation TELC A2",
    teacher: "Prof. Jean-Pierre Nkolo",
    level: "A2",
    code: "DEUTSCH-A2-TELC",
    students: 18,
    progress: 45,
    color: "#6366f1",
    nextAssignments: [
      { id: "a3", title: "Exercices de lecture",     dueDate: "2025-05-18", submitted: false },
    ],
  },
];

const LEVEL_COLORS: Record<string, string> = {
  A1: "#10b981", A2: "#34d399", B1: "#6366f1", B2: "#8b5cf6", C1: "#f59e0b",
};

// ─── Components ───────────────────────────────────────────────────────────────

function ClassCard({ cls }: { cls: Classroom }) {
  const pendingCount = cls.nextAssignments.filter(a => !a.submitted).length;
  const levelColor = LEVEL_COLORS[cls.level] ?? "#10b981";

  return (
    <div style={{
      background: "rgba(13,17,23,0.8)",
      border: `1px solid rgba(255,255,255,0.07)`,
      borderTop: `3px solid ${levelColor}`,
      borderRadius: 16, padding: 22,
      display: "flex", flexDirection: "column", gap: 14,
      transition: "border-color 0.2s, transform 0.2s",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              background: `${levelColor}22`, color: levelColor,
              border: `1px solid ${levelColor}44`, borderRadius: 6,
              padding: "2px 8px", fontSize: 11, fontWeight: 700,
            }}>{cls.level}</span>
            {pendingCount > 0 && (
              <span style={{
                background: "rgba(239,68,68,0.15)", color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20,
                padding: "2px 8px", fontSize: 10, fontWeight: 700,
              }}>
                {pendingCount} devoir{pendingCount > 1 ? "s" : ""} à rendre
              </span>
            )}
          </div>
          <h3 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>
            {cls.name}
          </h3>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 3 }}>
            👨‍🏫 {cls.teacher} · 👥 {cls.students} élèves
          </div>
        </div>
        <Link href={`/classroom/${cls.id}`} style={{
          background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
          padding: "6px 14px", fontSize: 12, textDecoration: "none", whiteSpace: "nowrap",
        }}>
          Entrer →
        </Link>
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Progression du cours</span>
          <span style={{ color: levelColor, fontSize: 11, fontWeight: 700 }}>{cls.progress}%</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 5, overflow: "hidden" }}>
          <div style={{ width: `${cls.progress}%`, height: "100%", background: levelColor, borderRadius: 4, transition: "width 0.6s ease" }} />
        </div>
      </div>

      {/* Assignments */}
      <div>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          Prochains devoirs
        </div>
        {cls.nextAssignments.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>Aucun devoir en attente ✓</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {cls.nextAssignments.map(a => (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "7px 10px", borderRadius: 8,
                background: a.submitted ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                border: `1px solid ${a.submitted ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
              }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.submitted ? "✓" : "○"} {a.title}
                </span>
                {a.dueDate && (
                  <span style={{ color: a.submitted ? "#10b981" : "#ef4444", fontSize: 11, flexShrink: 0, marginLeft: 8 }}>
                    {a.submitted ? "Rendu" : new Date(a.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Code */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <code style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, fontFamily: "monospace" }}>{cls.code}</code>
        <Link href={`/classroom/${cls.id}`} style={{
          background: `${levelColor}22`, color: levelColor,
          border: `1px solid ${levelColor}44`, borderRadius: 8,
          padding: "6px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none",
        }}>
          Voir la classe
        </Link>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClassroomListPage() {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setJoining(true);
    setJoinError("");
    try {
      const r = await fetch("/api/classroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "join", code: code.trim().toUpperCase() }),
      });
      if (!r.ok) {
        const d = await r.json();
        setJoinError(d.error ?? "Erreur inconnue");
      } else {
        setJoinSuccess(true);
        setTimeout(() => { setShowJoinModal(false); setCode(""); setJoinSuccess(false); }, 1800);
      }
    } catch {
      setJoinError("Erreur réseau");
    } finally {
      setJoining(false);
    }
  };

  return (
    <Layout title="Mes Classes">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        .syne { font-family: 'Syne', sans-serif; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 className="syne" style={{ margin: 0, color: "#f1f5f9", fontWeight: 800, fontSize: 24 }}>
            Mes classes
          </h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
            {MOCK_CLASSROOMS.length} classe{MOCK_CLASSROOMS.length > 1 ? "s" : ""} inscrite{MOCK_CLASSROOMS.length > 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => setShowJoinModal(true)} style={{
          background: "rgba(16,185,129,0.12)", color: "#10b981",
          border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10,
          padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          + Rejoindre une classe
        </button>
      </div>

      {/* Class grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 20 }}>
        {MOCK_CLASSROOMS.map(cls => <ClassCard key={cls.id} cls={cls} />)}

        {/* Empty state */}
        {MOCK_CLASSROOMS.length === 0 && (
          <div style={{
            gridColumn: "1/-1", textAlign: "center", padding: "60px 20px",
            background: "rgba(13,17,23,0.6)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏫</div>
            <div className="syne" style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              Pas encore de classe
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 20 }}>
              Rejoignez une classe avec le code fourni par votre enseignant.
            </div>
            <button onClick={() => setShowJoinModal(true)} style={{
              background: "#10b981", color: "#fff", border: "none", borderRadius: 10,
              padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>
              Rejoindre une classe
            </button>
          </div>
        )}
      </div>

      {/* Join modal */}
      {showJoinModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }} onClick={e => e.target === e.currentTarget && setShowJoinModal(false)}>
          <div style={{
            background: "#0d1117", border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: 16, padding: 32, width: 420, maxWidth: "90vw",
          }}>
            {joinSuccess ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div className="syne" style={{ color: "#10b981", fontWeight: 800, fontSize: 20 }}>Classe rejointe !</div>
              </div>
            ) : (
              <>
                <div className="syne" style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
                  Rejoindre une classe
                </div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 24 }}>
                  Entrez le code fourni par votre enseignant (ex: DEUTSCH-A1-2024)
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setJoinError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleJoin()}
                  placeholder="DEUTSCH-A1-2024"
                  autoFocus
                  style={{
                    width: "100%", background: "#161b22", border: `1px solid ${joinError ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 10, padding: "12px 16px", color: "#10b981",
                    fontSize: 16, fontFamily: "monospace", letterSpacing: "0.05em",
                    outline: "none", boxSizing: "border-box", marginBottom: 8,
                  }}
                />
                {joinError && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>{joinError}</div>}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                  <button onClick={() => setShowJoinModal(false)} style={{
                    background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 20px", cursor: "pointer",
                  }}>Annuler</button>
                  <button onClick={handleJoin} disabled={joining || !code.trim()} style={{
                    background: joining ? "rgba(16,185,129,0.5)" : "#10b981",
                    color: "#fff", border: "none", borderRadius: 8,
                    padding: "8px 24px", cursor: "pointer", fontWeight: 700, fontSize: 14,
                  }}>
                    {joining ? "Connexion..." : "Rejoindre →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
