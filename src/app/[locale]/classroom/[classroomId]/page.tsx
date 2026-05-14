"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { Link } from "@/navigation";
import Leaderboard, { type LBEntry } from "@/components/Leaderboard";
import ClassroomChat from "@/components/ClassroomChat";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CLASS = {
  id: "cls-1",
  name: "Allemand A1 — Débutants",
  teacher: "Prof. Sophie Tanda",
  teacherAvatar: "ST",
  level: "A1",
  code: "DEUTSCH-A1-2024",
  students: 24,
  description: "Introduction à la langue allemande pour les débutants complets. Niveau CECR A1.",
};

const MOCK_MEMBERS = [
  { id: "s1", name: "Marie Nguemo",    online: true,  avatar: "MN" },
  { id: "s2", name: "Paul Atangana",   online: false, avatar: "PA" },
  { id: "s3", name: "Diane Biya",      online: true,  avatar: "DB" },
  { id: "s4", name: "Sandrine Kamga",  online: true,  avatar: "SK" },
  { id: "s5", name: "Jean Mbarga",     online: false, avatar: "JM" },
  { id: "s6", name: "Eric Fotso",      online: false, avatar: "EF" },
];

const MOCK_LEADERBOARD: LBEntry[] = [
  { userId: "s3", fullName: "Diane Biya",      xpTotal: 2100, streakDays: 21, level: "A1", avatar: "DB" },
  { userId: "s1", fullName: "Marie Nguemo",    xpTotal: 1850, streakDays: 12, level: "A1", avatar: "MN" },
  { userId: "s4", fullName: "Sandrine Kamga",  xpTotal: 1560, streakDays: 7,  level: "A1", avatar: "SK" },
  { userId: "s6", fullName: "Jean Mbarga",     xpTotal: 680,  streakDays: 2,  level: "A1", avatar: "JM" },
  { userId: "s2", fullName: "Paul Atangana",   xpTotal: 920,  streakDays: 3,  level: "A1", avatar: "PA" },
  { userId: "s5", fullName: "Eric Fotso",      xpTotal: 430,  streakDays: 0,  level: "A1", avatar: "EF" },
];

type FeedItem =
  | { type: "announcement"; id: string; title: string; content: string; date: string; pinned?: boolean }
  | { type: "assignment";   id: string; title: string; desc: string; dueDate: string | null; submitted: boolean; maxScore: number; score: number | null }
  | { type: "quiz_result";  id: string; module: string; avgScore: number; passed: boolean; date: string };

const MOCK_FEED: FeedItem[] = [
  { type: "announcement", id: "ann1", title: "📌 Bienvenue dans la classe !", content: "Bienvenue à tous ! Retrouvez ici vos devoirs, annonces et le fil de discussion de la classe. Bon courage pour ce semestre !", date: "2025-01-15", pinned: true },
  { type: "assignment",   id: "a1",   title: "Vocabulaire : Se présenter", desc: "Exercices sur les salutations et présentations. Complétez le module M1 et renvoyez vos notes.", dueDate: "2025-05-15", submitted: false, maxScore: 20, score: null },
  { type: "quiz_result",  id: "qr1",  module: "M3 — Ich heiße…", avgScore: 8.2, passed: true, date: "2025-05-07" },
  { type: "announcement", id: "ann2", title: "Révisions Der/Die/Das", content: "Pour la semaine prochaine : concentrez-vous sur les genres des noms. Rappel : en allemand, chaque nom a un genre fixe (der/die/das) qu'il faut mémoriser.", date: "2025-05-06" },
  { type: "assignment",   id: "a2",   title: "Grammaire : Der/Die/Das", desc: "Quiz sur les articles définis. À rendre via le module M2 du cours.", dueDate: "2025-05-22", submitted: true, maxScore: 20, score: 16 },
];

const RECENT_ACTIVITY = [
  { user: "Diane B.",    action: "a complété le module 4",          time: "il y a 12min" },
  { user: "Prof. Tanda", action: "a publié un nouveau devoir",      time: "il y a 1h"   },
  { user: "Sandrine K.", action: "a rendu le devoir vocabulaire",   time: "il y a 2h"   },
  { user: "Jean M.",     action: "s'est connecté",                  time: "il y a 3h"   },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeedCard({ item }: { item: FeedItem }) {
  if (item.type === "announcement") {
    return (
      <div style={{
        background: item.pinned ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${item.pinned ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 14, padding: 18,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          {item.pinned && <span style={{ color: "#10b981", fontSize: 11 }}>📌</span>}
          <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, fontFamily: "'Syne', sans-serif" }}>{item.title}</span>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginLeft: "auto" }}>
            {new Date(item.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
          </span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.6 }}>{item.content}</div>
      </div>
    );
  }

  if (item.type === "assignment") {
    const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && !item.submitted;
    const daysLeft = item.dueDate ? Math.ceil((new Date(item.dueDate).getTime() - Date.now()) / 86400000) : null;
    return (
      <div style={{
        background: item.submitted ? "rgba(16,185,129,0.04)" : "rgba(239,68,68,0.04)",
        border: `1px solid ${item.submitted ? "rgba(16,185,129,0.15)" : isOverdue ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.12)"}`,
        borderRadius: 14, padding: 18,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 14 }}>📝</span>
              <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, fontFamily: "'Syne', sans-serif" }}>{item.title}</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{item.desc}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
            {item.submitted ? (
              <div>
                <span style={{ color: "#10b981", fontWeight: 700, fontSize: 13 }}>
                  {item.score !== null ? `${item.score}/${item.maxScore}` : "Rendu ✓"}
                </span>
                {item.score !== null && (
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>sur {item.maxScore} pts</div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ color: isOverdue ? "#ef4444" : (daysLeft !== null && daysLeft <= 3 ? "#f59e0b" : "#94a3b8"), fontWeight: 700, fontSize: 12 }}>
                  {item.dueDate ? (isOverdue ? "En retard !" : `J-${daysLeft}`) : "Sans date limite"}
                </div>
                {item.dueDate && <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{new Date(item.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</div>}
              </div>
            )}
          </div>
        </div>
        {!item.submitted && (
          <Link href={`/classroom/cls-1/assignment/${item.id}`} style={{
            display: "inline-block", marginTop: 8,
            background: isOverdue ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
            color: isOverdue ? "#ef4444" : "#10b981",
            border: `1px solid ${isOverdue ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`,
            borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none",
          }}>
            {isOverdue ? "Rendre en retard →" : "Faire le devoir →"}
          </Link>
        )}
      </div>
    );
  }

  if (item.type === "quiz_result") {
    return (
      <div style={{
        background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)",
        borderRadius: 14, padding: 18,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>📊</span>
          <div>
            <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13 }}>Résultat quiz : {item.module}</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
              {new Date(item.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: item.passed ? "#10b981" : "#ef4444", fontWeight: 800, fontSize: 18, fontFamily: "'Syne', sans-serif" }}>
            {item.avgScore}/10
          </div>
          <div style={{ color: item.passed ? "#10b981" : "#ef4444", fontSize: 10 }}>
            {item.passed ? "Réussi ✓" : "À repasser"}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Countdown timer ──────────────────────────────────────────────────────────

function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return;
      setTimeLeft({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const units = [
    { v: timeLeft.days,    l: "j"   },
    { v: timeLeft.hours,   l: "h"   },
    { v: timeLeft.minutes, l: "min" },
  ];

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {units.map(u => (
        <div key={u.l} style={{ textAlign: "center" }}>
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 8, padding: "4px 10px", color: "#ef4444",
            fontWeight: 800, fontSize: 18, fontFamily: "'Syne', sans-serif", minWidth: 44,
          }}>
            {String(u.v).padStart(2, "0")}
          </div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, marginTop: 2 }}>{u.l}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const CURRENT_USER_ID = "s1";
const CURRENT_USER_NAME = "Marie Nguemo";

export default function VirtualClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<"feed" | "chat">("feed");

  const copyCode = () => {
    navigator.clipboard.writeText(MOCK_CLASS.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nextAssignment = MOCK_FEED.find(i => i.type === "assignment" && !i.submitted && i.dueDate) as Extract<FeedItem, { type: "assignment" }> | undefined;

  return (
    <div style={{
      background: "#080c10", minHeight: "100vh", color: "#e2e8f0",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&display=swap');
        .syne { font-family: 'Syne', sans-serif; }
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>

      {/* Top bar */}
      <div style={{
        height: 58, display: "flex", alignItems: "center", gap: 14,
        padding: "0 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(8,12,16,0.95)", backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <button onClick={() => router.push("/classroom")} style={{
          background: "none", border: "none", color: "rgba(255,255,255,0.4)",
          cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 5,
        }}>← Mes classes</button>
        <span style={{ color: "rgba(255,255,255,0.12)" }}>›</span>
        <span style={{ color: "#10b981", fontSize: 13, fontWeight: 600 }}>{MOCK_CLASS.name}</span>
        <span style={{
          background: "rgba(16,185,129,0.12)", color: "#10b981",
          border: "1px solid rgba(16,185,129,0.25)", borderRadius: 6,
          padding: "2px 8px", fontSize: 11, fontWeight: 700,
        }}>{MOCK_CLASS.level}</span>
      </div>

      {/* 3-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 260px", height: "calc(100vh - 58px)", overflow: "hidden" }}>

        {/* ═══ LEFT SIDEBAR ═══ */}
        <aside style={{
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Class info */}
          <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="syne" style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
              {MOCK_CLASS.name}
            </div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 10 }}>
              👨‍🏫 {MOCK_CLASS.teacher}<br />👥 {MOCK_CLASS.students} élèves
            </div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 8 }}>
              {MOCK_CLASS.description}
            </div>
            {/* Code */}
            <button onClick={copyCode} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "7px 10px", cursor: "pointer",
            }}>
              <code style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "monospace" }}>
                {MOCK_CLASS.code}
              </code>
              <span style={{ color: copied ? "#10b981" : "rgba(255,255,255,0.3)", fontSize: 10 }}>
                {copied ? "✓ Copié" : "Copier"}
              </span>
            </button>
          </div>

          {/* Members */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Membres ({MOCK_MEMBERS.length})
            </div>
            {/* Teacher first */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.1))",
                  border: "2px solid rgba(16,185,129,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#10b981", fontWeight: 700, fontSize: 10,
                }}>ST</div>
                <div style={{ position: "absolute", bottom: -1, right: -1, width: 9, height: 9, background: "#10b981", borderRadius: "50%", border: "2px solid #080c10" }} />
              </div>
              <div>
                <div style={{ color: "#10b981", fontSize: 12, fontWeight: 600 }}>Prof. Sophie Tanda</div>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>Professeur · En ligne</div>
              </div>
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.04)", marginBottom: 8 }} />
            {MOCK_MEMBERS.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: m.id === CURRENT_USER_ID
                      ? "linear-gradient(135deg, #10b981, #059669)"
                      : "rgba(255,255,255,0.06)",
                    border: `1px solid ${m.id === CURRENT_USER_ID ? "#10b981" : "rgba(255,255,255,0.08)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: m.id === CURRENT_USER_ID ? "#fff" : "rgba(255,255,255,0.35)",
                    fontWeight: 700, fontSize: 9,
                  }}>{m.avatar}</div>
                  {m.online && <div style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, background: "#10b981", borderRadius: "50%", border: "2px solid #080c10" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: m.id === CURRENT_USER_ID ? "#10b981" : "rgba(255,255,255,0.6)",
                    fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {m.name} {m.id === CURRENT_USER_ID && "(vous)"}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>{m.online ? "En ligne" : "Hors ligne"}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ═══ CENTER ═══ */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Tab switcher */}
          <div style={{
            display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "0 20px", flexShrink: 0,
          }}>
            {[
              { key: "feed", label: "📋 Fil d'actualité" },
              { key: "chat", label: "💬 Discussion" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveView(tab.key as "feed" | "chat")} style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "14px 16px", fontSize: 13, fontWeight: 600,
                color: activeView === tab.key ? "#10b981" : "rgba(255,255,255,0.35)",
                borderBottom: activeView === tab.key ? "2px solid #10b981" : "2px solid transparent",
                marginBottom: -1, transition: "all 0.15s",
              }}>{tab.label}</button>
            ))}
          </div>

          {/* Content */}
          {activeView === "feed" ? (
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 680 }}>
                {MOCK_FEED.map(item => <FeedCard key={item.id} item={item} />)}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, overflow: "hidden" }}>
              <ClassroomChat
                classroomId={params.classroomId as string}
                currentUserId={CURRENT_USER_ID}
                currentUserName={CURRENT_USER_NAME}
              />
            </div>
          )}
        </div>

        {/* ═══ RIGHT PANEL ═══ */}
        <aside style={{
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          overflowY: "auto", display: "flex", flexDirection: "column", gap: 0,
        }}>
          {/* Next assignment countdown */}
          {nextAssignment && nextAssignment.dueDate && (
            <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Prochain devoir
              </div>
              <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                {nextAssignment.title}
              </div>
              <Countdown targetDate={`${nextAssignment.dueDate}T23:59:00`} />
              <Link href={`/classroom/cls-1/assignment/${nextAssignment.id}`} style={{
                display: "block", marginTop: 12, textAlign: "center",
                background: "rgba(239,68,68,0.1)", color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8,
                padding: "8px 0", fontSize: 12, fontWeight: 600, textDecoration: "none",
              }}>
                Rendre le devoir →
              </Link>
            </div>
          )}

          {/* Leaderboard */}
          <div style={{ padding: "16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              🏆 Classement de la classe
            </div>
            <Leaderboard
              classroomId={params.classroomId as string}
              initialEntries={MOCK_LEADERBOARD}
              currentUserId={CURRENT_USER_ID}
            />
          </div>

          {/* Recent activity */}
          <div style={{ padding: "14px 14px" }}>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Activité récente
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", background: "#10b981",
                    flexShrink: 0, marginTop: 5,
                  }} />
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600 }}>{a.user} </span>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>{a.action}</span>
                    <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 1 }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
