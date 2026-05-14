"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/navigation";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  level: string;
  xpTotal: number;
  streakDays: number;
  lastActiveAt: string;
  createdAt: string;
  country: string;
  city?: string;
  avatar: string;
}

interface CourseProgress {
  level: string;
  title: string;
  modulesTotal: number;
  modulesCompleted: number;
  avgScore: number;
}

interface SimSession {
  id: string;
  date: string;
  scenario: string;
  niveau: string;
  scoreGlobal: number;
  scoreGrammaire: number;
  scoreVocab: number;
  scoreFluence: number;
  decision: "ACCORDÉ" | "REFUSÉ" | "EN COURS";
  duration: number;
}

interface QuizAttempt {
  id: string;
  module: string;
  date: string;
  score: number;
  total: number;
  passed: boolean;
  attemptNo: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_STUDENT: StudentProfile = {
  id: "s1",
  fullName: "Marie Nguemo",
  email: "marie.nguemo@gmail.com",
  phone: "+237 6 70 12 34 56",
  level: "A1",
  xpTotal: 1850,
  streakDays: 12,
  lastActiveAt: "2025-05-08T18:30:00Z",
  createdAt: "2025-01-15T00:00:00Z",
  country: "CM",
  city: "Yaoundé",
  avatar: "MN",
};

const MOCK_COURSE_PROGRESS: CourseProgress[] = [
  { level: "A1", title: "Débutant", modulesTotal: 12, modulesCompleted: 8, avgScore: 8.2 },
  { level: "A2", title: "Élémentaire", modulesTotal: 15, modulesCompleted: 2, avgScore: 6.5 },
  { level: "B1", title: "Intermédiaire", modulesTotal: 18, modulesCompleted: 0, avgScore: 0 },
  { level: "B2", title: "Supérieur", modulesTotal: 18, modulesCompleted: 0, avgScore: 0 },
  { level: "C1", title: "Autonome", modulesTotal: 20, modulesCompleted: 0, avgScore: 0 },
  { level: "C2", title: "Maîtrise", modulesTotal: 20, modulesCompleted: 0, avgScore: 0 },
];

const MOCK_SESSIONS: SimSession[] = [
  { id: "ss1", date: "2025-05-08T15:00:00Z", scenario: "Visa Étudiant (§16b)", niveau: "A1", scoreGlobal: 7.2, scoreGrammaire: 6.8, scoreVocab: 7.5, scoreFluence: 7.3, decision: "ACCORDÉ", duration: 18 },
  { id: "ss2", date: "2025-05-05T10:30:00Z", scenario: "Visa Touriste (§6)", niveau: "A1", scoreGlobal: 5.4, scoreGrammaire: 5.0, scoreVocab: 5.8, scoreFluence: 5.4, decision: "REFUSÉ", duration: 12 },
  { id: "ss3", date: "2025-04-28T14:00:00Z", scenario: "Visa Touriste (§6)", niveau: "A1", scoreGlobal: 4.1, scoreGrammaire: 3.8, scoreVocab: 4.5, scoreFluence: 4.0, decision: "REFUSÉ", duration: 9 },
  { id: "ss4", date: "2025-04-20T09:00:00Z", scenario: "Visa Étudiant (§16b)", niveau: "A1", scoreGlobal: 6.0, scoreGrammaire: 5.5, scoreVocab: 6.5, scoreFluence: 6.0, decision: "ACCORDÉ", duration: 15 },
];

const MOCK_QUIZ_ATTEMPTS: QuizAttempt[] = [
  { id: "qa1", module: "M1 — Grüß Gott!", date: "2025-05-07T11:00:00Z", score: 4, total: 5, passed: true, attemptNo: 1 },
  { id: "qa2", module: "M2 — Der/Die/Das", date: "2025-05-06T14:00:00Z", score: 3, total: 5, passed: false, attemptNo: 1 },
  { id: "qa3", module: "M2 — Der/Die/Das", date: "2025-05-06T15:00:00Z", score: 4, total: 5, passed: true, attemptNo: 2 },
  { id: "qa4", module: "M3 — Ich heiße…", date: "2025-05-04T09:00:00Z", score: 5, total: 5, passed: true, attemptNo: 1 },
  { id: "qa5", module: "M4 — Zahlen 1-100", date: "2025-05-02T16:00:00Z", score: 2, total: 5, passed: false, attemptNo: 1 },
];

const SCORE_EVOLUTION = [
  { date: "20 avr", score: 4.1 },
  { date: "28 avr", score: 5.4 },
  { date: "02 mai", score: 5.2 },
  { date: "04 mai", score: 5.8 },
  { date: "06 mai", score: 6.5 },
  { date: "07 mai", score: 7.0 },
  { date: "08 mai", score: 7.2 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function Avatar({ initials, size = 48 }: { initials: string; size?: number }) {
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

function ScoreBadge({ score, outOf = 10 }: { score: number; outOf?: number }) {
  const normalized = outOf === 10 ? score : (score / outOf) * 10;
  const color = normalized >= 7 ? "#10b981" : normalized >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <span style={{
      background: `${color}22`, color, border: `1px solid ${color}44`,
      borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700,
    }}>
      {score}/{outOf}
    </span>
  );
}

function ProgressBar({ value, max = 100, color }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const c = color ?? (pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444");
  return (
    <div style={{ background: "#1e2530", borderRadius: 4, height: 8, width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: c, borderRadius: 4, transition: "width 0.5s" }} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface LevelHistoryEntry {
  id: string;
  oldLevel: string;
  newLevel: string;
  reason: string;
  changedAt: string;
}

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<StudentProfile>(MOCK_STUDENT);
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Level modification state
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [modalLevel, setModalLevel] = useState("");
  const [modalReason, setModalReason] = useState("");
  const [levelSaving, setLevelSaving] = useState(false);
  const [levelHistory, setLevelHistory] = useState<LevelHistoryEntry[]>([]);
  const [levelHistoryLoaded, setLevelHistoryLoaded] = useState(false);

  useEffect(() => {
    const sid = typeof params.studentId === "string" ? params.studentId : "";
    if (!sid) return;
    fetch(`/api/level-history?userId=${sid}`)
      .then(r => r.json())
      .then(d => { setLevelHistory(d.history ?? []); setLevelHistoryLoaded(true); })
      .catch(() => setLevelHistoryLoaded(true));
  }, [params.studentId]);

  const sendFeedback = () => {
    if (!feedback.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 3000);
    setFeedback("");
  };

  const submitLevelChange = async () => {
    if (!modalLevel || !modalReason.trim()) return;
    setLevelSaving(true);
    try {
      const sid = typeof params.studentId === "string" ? params.studentId : "";
      const r = await fetch("/api/level-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: sid, newLevel: modalLevel, reason: modalReason.trim() }),
      });
      if (r.ok) {
        const d = await r.json();
        setStudent(s => ({ ...s, level: d.newLevel }));
        setLevelHistory(h => [{
          id: Date.now().toString(),
          oldLevel: d.oldLevel,
          newLevel: d.newLevel,
          reason: modalReason.trim(),
          changedAt: new Date().toISOString(),
        }, ...h]);
        setShowLevelModal(false);
        setModalLevel("");
        setModalReason("");
      }
    } finally { setLevelSaving(false); }
  };

  const levelColors: Record<string, string> = {
    A1: "#10b981", A2: "#34d399", B1: "#6366f1", B2: "#8b5cf6", C1: "#f59e0b", C2: "#ef4444",
  };

  const decisionColors: Record<string, string> = {
    "ACCORDÉ": "#10b981",
    "REFUSÉ": "#ef4444",
    "EN COURS": "#f59e0b",
  };

  return (
    <div style={{ background: "#080c10", minHeight: "100vh", color: "#e2e8f0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top bar */}
      <div style={{
        borderBottom: "1px solid #1e2d3d", background: "#0d1117", padding: "0 32px",
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
          <span style={{ color: "#94a3b8", fontSize: 13 }}>Élèves</span>
          <span style={{ color: "#2a3441" }}>›</span>
          <span style={{ color: "#10b981", fontSize: 13, fontWeight: 600 }}>{student.fullName}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px", display: "grid", gridTemplateColumns: "300px 1fr", gap: 28 }}>

        {/* Left column — Profile card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Profile card */}
          <div style={{
            background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 16, padding: 24,
            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
          }}>
            <Avatar initials={student.avatar} size={72} />
            <div style={{ marginTop: 16 }}>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
                {student.fullName}
              </div>
              <div style={{ color: "#64748b", fontSize: 13, marginBottom: 12 }}>{student.email}</div>
              <span style={{
                background: `${levelColors[student.level] ?? "#10b981"}22`,
                color: levelColors[student.level] ?? "#10b981",
                border: `1px solid ${levelColors[student.level] ?? "#10b981"}44`,
                borderRadius: 8, padding: "3px 14px", fontSize: 13, fontWeight: 700,
              }}>
                Niveau {student.level}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 16, padding: 20 }}>
            <div style={{ color: "#94a3b8", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
              Statistiques
            </div>
            {[
              { label: "XP Total", value: `${student.xpTotal.toLocaleString()} XP`, icon: "⚡" },
              { label: "Série actuelle", value: `${student.streakDays} jours`, icon: "🔥" },
              { label: "Inscrit le", value: formatDate(student.createdAt), icon: "📅" },
              { label: "Dernière activité", value: formatDate(student.lastActiveAt), icon: "🕐" },
              { label: "Ville", value: student.city ?? "—", icon: "📍" },
              { label: "Téléphone", value: student.phone ?? "—", icon: "📱" },
            ].map(stat => (
              <div key={stat.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: "1px solid #1e2d3d",
              }}>
                <span style={{ color: "#64748b", fontSize: 13 }}>{stat.icon} {stat.label}</span>
                <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Feedback */}
          <div style={{ background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 16, padding: 20 }}>
            <div style={{ color: "#94a3b8", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Commentaire enseignant
            </div>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Laissez un commentaire personnalisé pour cet élève..."
              rows={4}
              style={{
                width: "100%", background: "#161b22", border: "1px solid #2a3441",
                borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 13,
                resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 10,
              }}
            />
            <button
              onClick={sendFeedback}
              style={{
                width: "100%", background: feedbackSent ? "#059669" : "#10b981",
                color: "#fff", border: "none", borderRadius: 8,
                padding: "8px 0", fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              {feedbackSent ? "✓ Envoyé !" : "Envoyer le commentaire"}
            </button>
          </div>

          {/* Level modification section */}
          <div style={{ background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 16, padding: 20 }}>
            <div style={{ color: "#94a3b8", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
              📊 Évaluation en présentiel
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>Niveau actuel</div>
                <span style={{
                  background: `${levelColors[student.level] ?? "#10b981"}22`,
                  color: levelColors[student.level] ?? "#10b981",
                  border: `1px solid ${levelColors[student.level] ?? "#10b981"}44`,
                  borderRadius: 8, padding: "4px 14px", fontSize: 15, fontWeight: 800,
                }}>
                  {student.level}
                </span>
              </div>
              <button
                onClick={() => { setModalLevel(student.level); setShowLevelModal(true); }}
                style={{
                  background: "rgba(245,158,11,0.1)", color: "#f59e0b",
                  border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8,
                  padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                ✏️ Modifier le niveau
              </button>
            </div>

            {/* History */}
            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Historique
            </div>
            {!levelHistoryLoaded && (
              <div style={{ color: "#64748b", fontSize: 12 }}>Chargement…</div>
            )}
            {levelHistoryLoaded && levelHistory.length === 0 && (
              <div style={{ color: "#2a3441", fontSize: 12 }}>Aucune modification enregistrée.</div>
            )}
            {levelHistory.map(h => (
              <div key={h.id} style={{
                background: "#161b22", border: "1px solid #1e2d3d", borderRadius: 8,
                padding: "10px 12px", marginBottom: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ color: "#94a3b8", fontSize: 13, fontFamily: "monospace" }}>
                    {h.oldLevel} → {h.newLevel}
                  </span>
                  <span style={{ color: "#2a3441", fontSize: 11 }}>
                    {new Date(h.changedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div style={{ color: "#64748b", fontSize: 12, fontStyle: "italic" }}>{h.reason}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Score evolution */}
          <div style={{ background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 16, padding: 24 }}>
            <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
              Évolution du score au simulateur
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={SCORE_EVOLUTION}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{ background: "#161b22", border: "1px solid #1e2d3d", borderRadius: 8, color: "#e2e8f0" }}
                  formatter={(v) => [typeof v === "number" ? v.toFixed(1) : String(v ?? ""), "Score"] as [string, string]}
                />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Course progression */}
          <div style={{ background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 16, padding: 24 }}>
            <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
              Progression par niveau
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {MOCK_COURSE_PROGRESS.map(cp => {
                const pct = cp.modulesTotal === 0 ? 0 : Math.round((cp.modulesCompleted / cp.modulesTotal) * 100);
                const color = levelColors[cp.level] ?? "#10b981";
                return (
                  <div key={cp.level} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 48, flexShrink: 0,
                      background: `${color}22`, color, border: `1px solid ${color}44`,
                      borderRadius: 8, padding: "4px 0", textAlign: "center",
                      fontSize: 13, fontWeight: 700,
                    }}>
                      {cp.level}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ color: "#94a3b8", fontSize: 13 }}>{cp.title}</span>
                        <span style={{ color: "#64748b", fontSize: 12 }}>
                          {cp.modulesCompleted}/{cp.modulesTotal} modules
                          {cp.avgScore > 0 && (
                            <span style={{ marginLeft: 12, color, fontWeight: 600 }}>
                              moy. {cp.avgScore}/10
                            </span>
                          )}
                        </span>
                      </div>
                      <ProgressBar value={cp.modulesCompleted} max={cp.modulesTotal} color={color} />
                    </div>
                    <div style={{
                      width: 44, textAlign: "right", color: pct > 0 ? color : "#2a3441",
                      fontSize: 13, fontWeight: 700, flexShrink: 0,
                    }}>
                      {pct}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simulator sessions */}
          <div style={{ background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 16, padding: 24 }}>
            <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
              Sessions simulateur d&apos;ambassade ({MOCK_SESSIONS.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {MOCK_SESSIONS.map(session => {
                const decColor = decisionColors[session.decision];
                return (
                  <div key={session.id} style={{
                    background: "#161b22", border: "1px solid #1e2d3d", borderRadius: 10, padding: 16,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                          {session.scenario}
                        </div>
                        <div style={{ color: "#64748b", fontSize: 12 }}>
                          {formatDateShort(session.date)} · {session.duration} min · Niveau {session.niveau}
                        </div>
                      </div>
                      <span style={{
                        background: `${decColor}22`, color: decColor, border: `1px solid ${decColor}44`,
                        borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700,
                      }}>
                        {session.decision}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      {[
                        { label: "Global", value: session.scoreGlobal },
                        { label: "Grammaire", value: session.scoreGrammaire },
                        { label: "Vocabulaire", value: session.scoreVocab },
                        { label: "Fluidité", value: session.scoreFluence },
                      ].map(s => {
                        const c = s.value >= 7 ? "#10b981" : s.value >= 5 ? "#f59e0b" : "#ef4444";
                        return (
                          <div key={s.label} style={{ textAlign: "center" }}>
                            <div style={{ color: c, fontSize: 18, fontWeight: 800 }}>{s.value}</div>
                            <div style={{ color: "#64748b", fontSize: 11 }}>{s.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quiz history */}
          <div style={{ background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 16, padding: 24 }}>
            <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
              Historique des quiz ({MOCK_QUIZ_ATTEMPTS.length} tentatives)
            </div>
            <div style={{ background: "#0d1117", borderRadius: 10, overflow: "hidden", border: "1px solid #1e2d3d" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e2d3d" }}>
                    {["Module", "Date", "Score", "Résultat", "Tentative"].map(h => (
                      <th key={h} style={{
                        padding: "10px 14px", textAlign: "left", color: "#64748b",
                        fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_QUIZ_ATTEMPTS.map((qa, i) => (
                    <tr key={qa.id} style={{ borderBottom: i < MOCK_QUIZ_ATTEMPTS.length - 1 ? "1px solid #1e2d3d" : "none" }}>
                      <td style={{ padding: "12px 14px", color: "#94a3b8", fontSize: 13 }}>{qa.module}</td>
                      <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 12 }}>{formatDateShort(qa.date)}</td>
                      <td style={{ padding: "12px 14px" }}><ScoreBadge score={qa.score} outOf={qa.total} /></td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{
                          background: qa.passed ? "#10b98122" : "#ef444422",
                          color: qa.passed ? "#10b981" : "#ef4444",
                          border: `1px solid ${qa.passed ? "#10b98144" : "#ef444444"}`,
                          borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                        }}>
                          {qa.passed ? "Réussi" : "Échoué"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 12 }}>
                        #{qa.attemptNo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Level modification modal */}
      {showLevelModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }} onClick={e => { if (e.target === e.currentTarget) setShowLevelModal(false); }}>
          <div style={{
            background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 18,
            padding: 28, width: "100%", maxWidth: 420,
          }}>
            <h3 style={{ margin: "0 0 20px", color: "#f1f5f9", fontSize: 16, fontWeight: 700 }}>
              Modifier le niveau de {student.fullName}
            </h3>

            {/* Level selector */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 10 }}>
                Nouveau niveau
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["A1", "A2", "B1", "B2", "C1"].map(l => (
                  <button key={l} onClick={() => setModalLevel(l)} style={{
                    padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 14,
                    background: modalLevel === l ? `${levelColors[l] ?? "#10b981"}22` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${modalLevel === l ? `${levelColors[l] ?? "#10b981"}55` : "#2a3441"}`,
                    color: modalLevel === l ? (levelColors[l] ?? "#10b981") : "#64748b",
                    transition: "all 0.15s",
                  }}>{l}</button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Raison (obligatoire)
              </label>
              <textarea
                value={modalReason}
                onChange={e => setModalReason(e.target.value)}
                placeholder="Ex: Évaluation orale en classe, score 18/20. Maîtrise confirmée du niveau A2."
                rows={3}
                style={{
                  width: "100%", background: "#161b22", border: "1px solid #2a3441",
                  borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 13,
                  resize: "none", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowLevelModal(false)}
                style={{
                  flex: 1, background: "rgba(255,255,255,0.04)", color: "#64748b",
                  border: "1px solid #2a3441", borderRadius: 8, padding: "11px",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >Annuler</button>
              <button
                onClick={submitLevelChange}
                disabled={!modalLevel || !modalReason.trim() || levelSaving}
                style={{
                  flex: 2,
                  background: modalLevel && modalReason.trim() ? "#f59e0b" : "rgba(245,158,11,0.3)",
                  color: "#fff", border: "none", borderRadius: 8, padding: "11px",
                  fontSize: 13, fontWeight: 700,
                  cursor: modalLevel && modalReason.trim() && !levelSaving ? "pointer" : "default",
                }}
              >
                {levelSaving ? "Enregistrement…" : `Assigner niveau ${modalLevel || "—"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
