"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  fullName: string;
  email: string;
  xpTotal: number;
  streakDays: number;
  lastActiveAt: string | null;
  avgScore: number;
  progress: number;
  level: string;
  avatar: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  maxScore: number;
  submittedCount: number;
  totalStudents: number;
  module: string | null;
}

interface Classroom {
  id: string;
  name: string;
  description: string;
  level: string;
  code: string;
  maxStudents: number;
  isActive: boolean;
  createdAt: string;
}

type Tab = "eleves" | "devoirs" | "statistiques" | "parametres";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CLASSROOM: Classroom = {
  id: "cls1",
  name: "Groupe A1 Matin",
  description: "Cours d'allemand pour débutants — niveau A1, séance du matin. Objectif : atteindre A2 en 3 mois.",
  level: "A1",
  code: "LINGUA-A1-MT2026",
  maxStudents: 25,
  isActive: true,
  createdAt: "2026-01-15T00:00:00Z",
};

const MOCK_STUDENTS: Student[] = [
  { id: "s1", fullName: "Fatima Oumarou",     email: "fatima.oumarou@gmail.com",   xpTotal: 2140, streakDays: 14, lastActiveAt: "2026-05-10T14:31:00Z", avgScore: 9.0, progress: 78, level: "A1", avatar: "FO" },
  { id: "s2", fullName: "Alice Fotso",         email: "alice.fotso@gmail.com",      xpTotal: 1680, streakDays: 9,  lastActiveAt: "2026-05-10T12:10:00Z", avgScore: 7.6, progress: 62, level: "A1", avatar: "AF" },
  { id: "s3", fullName: "Rodrigue Essama",     email: "r.essama@yahoo.fr",          xpTotal: 1320, streakDays: 5,  lastActiveAt: "2026-05-09T19:00:00Z", avgScore: 7.1, progress: 55, level: "A1", avatar: "RE" },
  { id: "s4", fullName: "Nathalie Bello",      email: "nathalie.bello@gmail.com",   xpTotal:  980, streakDays: 3,  lastActiveAt: "2026-05-08T10:00:00Z", avgScore: 6.3, progress: 47, level: "A1", avatar: "NB" },
  { id: "s5", fullName: "Christian Ondoa",     email: "c.ondoa@gmail.com",          xpTotal:  760, streakDays: 2,  lastActiveAt: "2026-05-07T16:00:00Z", avgScore: 5.9, progress: 39, level: "A1", avatar: "CO" },
  { id: "s6", fullName: "Jean-Paul Mvondo",    email: "jpmvondo@gmail.com",         xpTotal:  340, streakDays: 0,  lastActiveAt: "2026-05-05T08:00:00Z", avgScore: 3.2, progress: 32, level: "A1", avatar: "JM" },
  { id: "s7", fullName: "Boris Kamga",         email: "boris.kamga@gmail.com",      xpTotal:  210, streakDays: 0,  lastActiveAt: "2026-05-02T14:00:00Z", avgScore: 2.8, progress: 28, level: "A1", avatar: "BK" },
];

const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: "a1", title: "Quiz Lektion 4 — Wortschatz", description: "Quiz de vocabulaire sur la leçon 4 : famille, maison, quotidien.", dueDate: "2026-05-12T23:59:00Z", maxScore: 20, submittedCount: 12, totalStudents: 18, module: "Lektion 4" },
  { id: "a2", title: "Lesen Arbeit — Textverstehen",  description: "Exercice de compréhension écrite : lire et répondre aux questions sur un texte A1.", dueDate: "2026-05-15T23:59:00Z", maxScore: 20, submittedCount: 7, totalStudents: 18, module: "Modul 3" },
  { id: "a3", title: "Simulation Ambassade",           description: "Jeu de rôle simulant une demande de visa — à réaliser dans le simulateur oral.", dueDate: null, maxScore: 30, submittedCount: 18, totalStudents: 18, module: null },
];

const STATS_30_DAYS = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  activite: Math.floor(Math.random() * 5) + (i % 7 < 5 ? 3 : 0),
  score: Math.floor(Math.random() * 30) + 55,
}));

const MODULE_STATS = [
  { module: "M1", complétion: 92 },
  { module: "M2", complétion: 74 },
  { module: "M3", complétion: 58 },
  { module: "M4", complétion: 40 },
  { module: "M5", complétion: 22 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 7 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <span style={{
      background: `${color}22`, color, border: `1px solid ${color}44`,
      borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700,
    }}>
      {score.toFixed(1)}/10
    </span>
  );
}

function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #10b981, #059669)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.35, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ background: "#1e2530", borderRadius: 4, height: 6, width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.4s" }} />
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function timeAgo(iso: string | null) {
  if (!iso) return "Jamais";
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Il y a < 1h";
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${Math.floor(hours / 24)}j`;
}

// ─── Tab: Élèves ──────────────────────────────────────────────────────────────

interface PendingRequest {
  id: string;
  fromUser: { id: string; fullName: string; email: string; germanLevel: string | null; avatarUrl: string | null };
  createdAt: string;
  toClassroomId: string | null;
}

function ElevesTab({ classroomId }: { classroomId: string }) {
  const [filter, setFilter] = useState<"all" | "danger" | "good">("all");
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [validating, setValidating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/social?action=pending-requests")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.requests) {
          setPending(d.requests.filter((r: PendingRequest) => r.toClassroomId === classroomId));
        }
      })
      .catch(() => {});
  }, [classroomId]);

  const handleValidate = async (req: PendingRequest, accept: boolean) => {
    setValidating(req.id);
    try {
      await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "respond", requestId: req.id, accept, classroomId: req.toClassroomId }),
      });
      setPending(p => p.filter(r => r.id !== req.id));
    } finally {
      setValidating(null);
    }
  };

  const filtered = MOCK_STUDENTS.filter(s =>
    filter === "danger" ? s.avgScore < 5 : filter === "good" ? s.avgScore >= 7 : true
  );

  return (
    <div>
      {/* Pending validation */}
      {pending.length > 0 && (
        <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 14 }}>⏳ En attente de validation</span>
            <span style={{ background: "#f59e0b22", color: "#f59e0b", border: "1px solid #f59e0b44", borderRadius: 99, padding: "1px 9px", fontSize: 12, fontWeight: 700 }}>
              {pending.length}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pending.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#161b22", border: "1px solid #2a3441", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                  {p.fromUser.fullName.split(" ").map(w => w[0]).join("").toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>{p.fromUser.fullName}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{p.fromUser.email} · Niveau {p.fromUser.germanLevel ?? "?"} · {timeAgo(p.createdAt)}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleValidate(p, true)}
                    disabled={validating === p.id}
                    style={{ background: "#10b98122", color: "#10b981", border: "1px solid #10b98144", borderRadius: 7, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
                    {validating === p.id ? "..." : "✅ Valider"}
                  </button>
                  <button
                    onClick={() => handleValidate(p, false)}
                    disabled={validating === p.id}
                    style={{ background: "#ef444422", color: "#ef4444", border: "1px solid #ef444444", borderRadius: 7, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
                    ❌ Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { key: "all", label: "Tous" },
          { key: "danger", label: "En difficulté" },
          { key: "good", label: "En avance" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            style={{
              padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: filter === f.key ? "#10b981" : "#1e2530",
              color: filter === f.key ? "#fff" : "#94a3b8",
              fontSize: 13, fontWeight: 600, transition: "all 0.2s",
            }}
          >
            {f.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", color: "#64748b", fontSize: 13, alignSelf: "center" }}>
          {filtered.length} élève{filtered.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#0d1117", borderRadius: 12, overflow: "hidden", border: "1px solid #1e2d3d" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e2d3d" }}>
              {["Élève", "Niveau", "XP", "Score moy.", "Progression", "Dernière activité", ""].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #1e2d3d" : "none" }}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar initials={s.avatar} />
                    <div>
                      <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>{s.fullName}</div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>{s.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ background: "#10b98122", color: "#10b981", border: "1px solid #10b98144", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>
                    {s.level}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "#e2e8f0", fontSize: 14 }}>
                  {s.xpTotal.toLocaleString()} XP
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <ScoreBadge score={s.avgScore} />
                </td>
                <td style={{ padding: "14px 16px", minWidth: 120 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <ProgressBar value={s.progress} />
                    <span style={{ color: "#64748b", fontSize: 11 }}>{s.progress}%</span>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", color: "#64748b", fontSize: 13 }}>
                  {timeAgo(s.lastActiveAt)}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <Link href={`/teacher/students/${s.id}`} style={{
                    background: "#1e2530", color: "#94a3b8", border: "1px solid #2a3441",
                    borderRadius: 6, padding: "4px 12px", fontSize: 12, textDecoration: "none",
                    fontWeight: 600, whiteSpace: "nowrap",
                  }}>
                    Voir profil
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Devoirs ─────────────────────────────────────────────────────────────

function DevoirsTab() {
  const [showModal, setShowModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", maxScore: "20" });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ color: "#94a3b8", fontSize: 14 }}>{MOCK_ASSIGNMENTS.length} devoirs créés</div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: "#10b981", color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          + Créer un devoir
        </button>
      </div>

      {/* Assignment cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {MOCK_ASSIGNMENTS.map(a => {
          const pct = Math.round((a.submittedCount / a.totalStudents) * 100);
          const isOverdue = a.dueDate && new Date(a.dueDate) < new Date();
          return (
            <div key={a.id} style={{
              background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 12, padding: 20,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 15 }}>{a.title}</span>
                    {a.module && (
                      <span style={{ background: "#1e2530", color: "#64748b", borderRadius: 6, padding: "2px 8px", fontSize: 11 }}>
                        {a.module}
                      </span>
                    )}
                    {isOverdue && (
                      <span style={{ background: "#ef444422", color: "#ef4444", border: "1px solid #ef444444", borderRadius: 6, padding: "2px 8px", fontSize: 11 }}>
                        Expiré
                      </span>
                    )}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 13, marginBottom: 12 }}>{a.description}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, maxWidth: 200 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#94a3b8", fontSize: 12 }}>Remis</span>
                        <span style={{ color: "#10b981", fontSize: 12, fontWeight: 600 }}>
                          {a.submittedCount}/{a.totalStudents}
                        </span>
                      </div>
                      <ProgressBar value={a.submittedCount} max={a.totalStudents} />
                    </div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>
                      <span style={{ color: "#94a3b8" }}>Note max: </span>{a.maxScore} pts
                    </div>
                    {a.dueDate && (
                      <div style={{ color: "#64748b", fontSize: 12 }}>
                        <span style={{ color: "#94a3b8" }}>Échéance: </span>{formatDate(a.dueDate)}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAssignment(a)}
                  style={{
                    background: "#1e2530", color: "#94a3b8", border: "1px solid #2a3441",
                    borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", marginLeft: 16,
                  }}
                >
                  Corriger
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div style={{
            background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 16,
            padding: 32, width: 480, maxWidth: "90vw",
          }}>
            <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 18, marginBottom: 24 }}>
              Nouveau devoir
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Titre", key: "title", type: "text", placeholder: "Ex: Vocabulaire semaine 3" },
                { label: "Description", key: "description", type: "textarea", placeholder: "Consignes du devoir..." },
                { label: "Date limite", key: "dueDate", type: "date", placeholder: "" },
                { label: "Note maximale", key: "maxScore", type: "number", placeholder: "20" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    {label}
                  </label>
                  {type === "textarea" ? (
                    <textarea
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      rows={3}
                      style={{
                        width: "100%", background: "#161b22", border: "1px solid #2a3441",
                        borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14,
                        resize: "vertical", outline: "none", boxSizing: "border-box",
                      }}
                    />
                  ) : (
                    <input
                      type={type}
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{
                        width: "100%", background: "#161b22", border: "1px solid #2a3441",
                        borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14,
                        outline: "none", boxSizing: "border-box",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "#1e2530", color: "#94a3b8", border: "1px solid #2a3441", borderRadius: 8, padding: "8px 20px", cursor: "pointer" }}
              >
                Annuler
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontWeight: 600 }}
              >
                Créer le devoir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grading modal */}
      {selectedAssignment && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}
          onClick={(e) => e.target === e.currentTarget && setSelectedAssignment(null)}
        >
          <div style={{
            background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 16,
            padding: 32, width: 560, maxWidth: "90vw", maxHeight: "80vh", overflowY: "auto",
          }}>
            <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
              Correction — {selectedAssignment.title}
            </div>
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>
              Note sur {selectedAssignment.maxScore} pts
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {MOCK_STUDENTS.map(s => (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "#161b22", border: "1px solid #1e2d3d", borderRadius: 10, padding: "12px 16px",
                }}>
                  <Avatar initials={s.avatar} size={32} />
                  <div style={{ flex: 1, color: "#e2e8f0", fontSize: 14 }}>{s.fullName}</div>
                  <input
                    type="number"
                    defaultValue=""
                    placeholder="—"
                    min={0}
                    max={selectedAssignment.maxScore}
                    style={{
                      width: 60, background: "#0d1117", border: "1px solid #2a3441",
                      borderRadius: 6, padding: "4px 8px", color: "#10b981", fontSize: 14,
                      textAlign: "center", outline: "none",
                    }}
                  />
                  <span style={{ color: "#64748b", fontSize: 12 }}>/{selectedAssignment.maxScore}</span>
                  <input
                    type="text"
                    placeholder="Commentaire..."
                    style={{
                      flex: 2, background: "#0d1117", border: "1px solid #2a3441",
                      borderRadius: 6, padding: "4px 8px", color: "#94a3b8", fontSize: 13, outline: "none",
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button
                onClick={() => setSelectedAssignment(null)}
                style={{ background: "#1e2530", color: "#94a3b8", border: "1px solid #2a3441", borderRadius: 8, padding: "8px 20px", cursor: "pointer" }}
              >
                Fermer
              </button>
              <button
                onClick={() => setSelectedAssignment(null)}
                style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontWeight: 600 }}
              >
                Enregistrer les notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Statistiques ────────────────────────────────────────────────────────

function StatistiquesTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Activity chart */}
      <div style={{ background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 12, padding: 24 }}>
        <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
          Activité — 30 derniers jours
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={STATS_30_DAYS}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
            <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#161b22", border: "1px solid #1e2d3d", borderRadius: 8, color: "#e2e8f0" }}
            />
            <Line type="monotone" dataKey="activite" stroke="#10b981" strokeWidth={2} dot={false} name="Élèves actifs" />
            <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={false} name="Score moyen %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Module completion */}
      <div style={{ background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 12, padding: 24 }}>
        <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
          Taux de complétion par module
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={MODULE_STATS}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
            <XAxis dataKey="module" stroke="#64748b" tick={{ fontSize: 12 }} tickLine={false} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: "#161b22", border: "1px solid #1e2d3d", borderRadius: 8, color: "#e2e8f0" }}
              formatter={(v) => [`${v ?? ""}%`, "Complétion"] as [string, string]}
            />
            <Bar dataKey="complétion" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Score moyen", value: "6.4/10", color: "#f59e0b" },
          { label: "Complétion globale", value: "51%", color: "#10b981" },
          { label: "Sessions simulateur", value: "38", color: "#6366f1" },
          { label: "Quiz complétés", value: "112", color: "#e879f9" },
        ].map(stat => (
          <div key={stat.label} style={{
            background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 12,
            padding: "20px 16px", textAlign: "center",
          }}>
            <div style={{ color: stat.color, fontSize: 26, fontWeight: 800, marginBottom: 6 }}>{stat.value}</div>
            <div style={{ color: "#64748b", fontSize: 12 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Paramètres ──────────────────────────────────────────────────────────

function ParametresTab({ classroom }: { classroom: Classroom }) {
  const [name, setName] = useState(classroom.name);
  const [description, setDescription] = useState(classroom.description);
  const [maxStudents, setMaxStudents] = useState(String(classroom.maxStudents));
  const [isActive, setIsActive] = useState(classroom.isActive);

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 12, padding: 28 }}>
        <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 16, marginBottom: 24 }}>
          Paramètres de la classe
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Name */}
          <div>
            <label style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
              Nom de la classe
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: "100%", background: "#161b22", border: "1px solid #2a3441",
                borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              style={{
                width: "100%", background: "#161b22", border: "1px solid #2a3441",
                borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14,
                resize: "vertical", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Max students */}
          <div>
            <label style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
              Nombre max d&apos;élèves
            </label>
            <input
              type="number"
              value={maxStudents}
              onChange={e => setMaxStudents(e.target.value)}
              min={1}
              max={200}
              style={{
                width: 120, background: "#161b22", border: "1px solid #2a3441",
                borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none",
              }}
            />
          </div>

          {/* Active toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600 }}>Classe active</div>
              <div style={{ color: "#64748b", fontSize: 12 }}>Les élèves peuvent rejoindre et accéder au contenu</div>
            </div>
            <button
              onClick={() => setIsActive(!isActive)}
              style={{
                width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                background: isActive ? "#10b981" : "#2a3441",
                position: "relative", transition: "background 0.2s",
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3, left: isActive ? 23 : 3,
                transition: "left 0.2s",
              }} />
            </button>
          </div>

          {/* Code */}
          <div>
            <label style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
              Code d&apos;accès
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <code style={{
                background: "#161b22", border: "1px solid #2a3441", borderRadius: 8,
                padding: "10px 14px", color: "#10b981", fontSize: 14, fontFamily: "monospace", flex: 1,
              }}>
                {classroom.code}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(classroom.code)}
                style={{
                  background: "#1e2530", color: "#94a3b8", border: "1px solid #2a3441",
                  borderRadius: 8, padding: "10px 14px", cursor: "pointer", fontSize: 13,
                }}
              >
                Copier
              </button>
            </div>
          </div>

          <button style={{
            background: "#10b981", color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start",
          }}>
            Enregistrer les modifications
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div style={{
        background: "#0d1117", border: "1px solid #ef444444", borderRadius: 12,
        padding: 28, marginTop: 20,
      }}>
        <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
          Zone dangereuse
        </div>
        <div style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
          La suppression d&apos;une classe est irréversible. Tous les devoirs et résultats seront perdus.
        </div>
        <button style={{
          background: "transparent", color: "#ef4444", border: "1px solid #ef444466",
          borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          Supprimer cette classe
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params.classroomId as string;
  const [activeTab, setActiveTab] = useState<Tab>("eleves");
  const [classroom] = useState<Classroom>(MOCK_CLASSROOM);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(classroom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pendingCount = 0;
  const TABS: { key: Tab; label: string; icon: string; badge?: number }[] = [
    { key: "eleves", label: "Élèves", icon: "👥", badge: pendingCount },
    { key: "devoirs", label: "Devoirs", icon: "📝" },
    { key: "statistiques", label: "Statistiques", icon: "📊" },
    { key: "parametres", label: "Paramètres", icon: "⚙️" },
  ];

  const levelColors: Record<string, string> = {
    A1: "#10b981", A2: "#34d399", B1: "#6366f1", B2: "#8b5cf6", C1: "#f59e0b", C2: "#ef4444",
  };

  return (
    <div style={{ background: "#080c10", minHeight: "100vh", color: "#e2e8f0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top bar */}
      <div style={{
        borderBottom: "1px solid #1e2d3d", background: "#0d1117",
        padding: "0 32px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, height: 64 }}>
          <button
            onClick={() => router.push("/teacher")}
            style={{
              background: "none", border: "none", color: "#64748b", cursor: "pointer",
              fontSize: 13, display: "flex", alignItems: "center", gap: 6,
            }}
          >
            ← Tableau de bord
          </button>
          <span style={{ color: "#2a3441" }}>›</span>
          <span style={{ color: "#94a3b8", fontSize: 13 }}>Mes classes</span>
          <span style={{ color: "#2a3441" }}>›</span>
          <span style={{ color: "#10b981", fontSize: 13, fontWeight: 600 }}>{classroom.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px" }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          marginBottom: 32,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#f1f5f9" }}>
                {classroom.name}
              </h1>
              <span style={{
                background: `${levelColors[classroom.level] ?? "#10b981"}22`,
                color: levelColors[classroom.level] ?? "#10b981",
                border: `1px solid ${levelColors[classroom.level] ?? "#10b981"}44`,
                borderRadius: 8, padding: "3px 12px", fontSize: 14, fontWeight: 700,
              }}>
                {classroom.level}
              </span>
              <span style={{
                background: classroom.isActive ? "#10b98122" : "#64748b22",
                color: classroom.isActive ? "#10b981" : "#64748b",
                border: `1px solid ${classroom.isActive ? "#10b98144" : "#64748b44"}`,
                borderRadius: 6, padding: "2px 10px", fontSize: 12,
              }}>
                {classroom.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div style={{ color: "#64748b", fontSize: 14 }}>{classroom.description}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>Code d&apos;accès :</span>
              <code style={{
                background: "#161b22", border: "1px solid #2a3441", borderRadius: 6,
                padding: "2px 10px", color: "#10b981", fontSize: 13, fontFamily: "monospace",
              }}>
                {classroom.code}
              </code>
              <button
                onClick={copyCode}
                style={{
                  background: copied ? "#10b98122" : "none",
                  color: copied ? "#10b981" : "#64748b",
                  border: "none", cursor: "pointer", fontSize: 12, padding: "2px 6px",
                }}
              >
                {copied ? "✓ Copié" : "Copier"}
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { label: "Élèves", value: MOCK_STUDENTS.length },
              { label: "Devoirs", value: MOCK_ASSIGNMENTS.length },
              { label: "Actifs aujourd'hui", value: 3 },
            ].map(stat => (
              <div key={stat.label} style={{
                background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 10,
                padding: "14px 20px", textAlign: "center", minWidth: 90,
              }}>
                <div style={{ color: "#10b981", fontSize: 22, fontWeight: 800 }}>{stat.value}</div>
                <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: "1px solid #1e2d3d" }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "12px 20px", fontSize: 14, fontWeight: 600,
                color: activeTab === tab.key ? "#10b981" : "#64748b",
                borderBottom: activeTab === tab.key ? "2px solid #10b981" : "2px solid transparent",
                marginBottom: -1, transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {tab.icon} {tab.label}
              {tab.badge && tab.badge > 0 ? (
                <span style={{ background: "#f59e0b22", color: "#f59e0b", border: "1px solid #f59e0b44", borderRadius: 99, padding: "0 7px", fontSize: 11, fontWeight: 700 }}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "eleves" && <ElevesTab classroomId={classroomId} />}
        {activeTab === "devoirs" && <DevoirsTab />}
        {activeTab === "statistiques" && <StatistiquesTab />}
        {activeTab === "parametres" && <ParametresTab classroom={classroom} />}
      </div>
    </div>
  );
}
