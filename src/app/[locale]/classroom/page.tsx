"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/navigation";
import Layout from "@/components/Layout";

type Locale = "fr" | "en";

// ─── Locale text ──────────────────────────────────────────────────────────────

const T = {
  fr: {
    layoutTitle: "Mes Classes",
    pageTitle: "Mes classes",
    pageSubtitle: "Vos espaces d'apprentissage avec enseignants, centres et groupes accompagnés.",
    joinCta: "+ Rejoindre une classe",
    positionTitle: "Apprendre seul, ou avancer accompagné",
    positionDesc:
      "Les classes vous connectent à un enseignant et à d'autres apprenants. Progressez ensemble, restez motivé.",
    demoLabel: "Classe démo",
    cardViewBtn: "Voir la classe",
    cardLearnersLabel: "apprenants",
    cardProgressLabel: "Progression du cours",
    cardAssignmentsLabel: "Prochains devoirs",
    cardNoAssignments: "Aucun devoir en attente ✓",
    cardDueLabel: (n: number) => `${n} devoir${n > 1 ? "s" : ""} à rendre`,
    cardSubmittedLabel: "Rendu",
    dateLocale: "fr-FR",
    emptyTitle: "Pas encore de classe",
    emptyDesc: "Rejoignez une classe avec le code fourni par votre enseignant.",
    emptyBtn: "Entrer un code de classe",
    modalTitle: "Rejoindre une classe",
    modalSubtitle: "Entrez le code fourni par votre enseignant (ex: DEUTSCH-A1-2024)",
    modalCancel: "Annuler",
    modalJoinBtn: "Rejoindre →",
    modalJoiningBtn: "Connexion...",
    modalSuccessTitle: "Classe rejointe !",
    modalError: "Erreur inconnue",
    modalNetworkError: "Erreur réseau",
    communityTitle: "Bientôt : groupes d'étude et partenaires d'apprentissage",
    communityDesc:
      "Trouvez des apprenants au même niveau, partagez vos progrès et progressez ensemble.",
    communitySoon: "Bientôt disponible",
  },
  en: {
    layoutTitle: "My Classes",
    pageTitle: "My classes",
    pageSubtitle: "Your learning spaces with teachers, centers and guided groups.",
    joinCta: "+ Join a class",
    positionTitle: "Learn on your own, or move forward with support",
    positionDesc:
      "Classes connect you to a teacher and fellow learners. Progress together and stay motivated.",
    demoLabel: "Demo class",
    cardViewBtn: "View class",
    cardLearnersLabel: "learners",
    cardProgressLabel: "Course progress",
    cardAssignmentsLabel: "Upcoming assignments",
    cardNoAssignments: "No pending assignments ✓",
    cardDueLabel: (n: number) => `${n} assignment${n > 1 ? "s" : ""} due`,
    cardSubmittedLabel: "Submitted",
    dateLocale: "en-US",
    emptyTitle: "No classes yet",
    emptyDesc: "Join a class with the code your teacher gave you.",
    emptyBtn: "Enter a class code",
    modalTitle: "Join a class",
    modalSubtitle: "Enter the code your teacher gave you (e.g. DEUTSCH-A1-2024)",
    modalCancel: "Cancel",
    modalJoinBtn: "Join →",
    modalJoiningBtn: "Joining...",
    modalSuccessTitle: "Class joined!",
    modalError: "Unknown error",
    modalNetworkError: "Network error",
    communityTitle: "Coming soon: study groups and learning partners",
    communityDesc:
      "Find learners at your level, share your progress and grow together.",
    communitySoon: "Coming soon",
  },
};

type TT = typeof T.fr;

// ─── Mock data (demo) ─────────────────────────────────────────────────────────

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
  isDemo?: boolean;
}

function getMockClassrooms(locale: Locale): Classroom[] {
  if (locale === "en") {
    return [
      {
        id: "cls-1",
        name: "German A1 — Beginners",
        teacher: "Prof. Sophie Tanda",
        level: "A1",
        code: "DEUTSCH-A1-2024",
        students: 24,
        progress: 68,
        color: "#10b981",
        isDemo: true,
        nextAssignments: [
          { id: "a1", title: "Vocabulary: Introducing yourself", dueDate: "2025-05-15", submitted: false },
          { id: "a2", title: "Grammar: Der/Die/Das",            dueDate: "2025-05-22", submitted: true  },
        ],
      },
      {
        id: "cls-2",
        name: "TELC A2 preparation",
        teacher: "Prof. Jean-Pierre Nkolo",
        level: "A2",
        code: "DEUTSCH-A2-TELC",
        students: 18,
        progress: 45,
        color: "#6366f1",
        isDemo: true,
        nextAssignments: [
          { id: "a3", title: "Reading exercises", dueDate: "2025-05-18", submitted: false },
        ],
      },
    ];
  }
  return [
    {
      id: "cls-1",
      name: "Allemand A1 — Débutants",
      teacher: "Prof. Sophie Tanda",
      level: "A1",
      code: "DEUTSCH-A1-2024",
      students: 24,
      progress: 68,
      color: "#10b981",
      isDemo: true,
      nextAssignments: [
        { id: "a1", title: "Vocabulaire : se présenter", dueDate: "2025-05-15", submitted: false },
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
      isDemo: true,
      nextAssignments: [
        { id: "a3", title: "Exercices de lecture", dueDate: "2025-05-18", submitted: false },
      ],
    },
  ];
}

const LEVEL_COLORS: Record<string, string> = {
  A1: "#10b981", A2: "#34d399", B1: "#6366f1", B2: "#8b5cf6", C1: "#f59e0b",
};

// ─── ClassCard ────────────────────────────────────────────────────────────────

function ClassCard({ cls, t }: { cls: Classroom; t: TT }) {
  const pendingCount = cls.nextAssignments.filter(a => !a.submitted).length;
  const levelColor = LEVEL_COLORS[cls.level] ?? "#10b981";

  return (
    <div style={{
      background: "rgba(13,17,23,0.8)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderTop: `3px solid ${levelColor}`,
      borderRadius: 16, padding: 22,
      display: "flex", flexDirection: "column", gap: 14,
      transition: "border-color 0.2s, transform 0.2s",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{
              background: `${levelColor}22`, color: levelColor,
              border: `1px solid ${levelColor}44`, borderRadius: 6,
              padding: "2px 8px", fontSize: 11, fontWeight: 700,
            }}>{cls.level}</span>
            {cls.isDemo && (
              <span style={{
                background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20,
                padding: "2px 8px", fontSize: 10, fontWeight: 600,
              }}>{t.demoLabel}</span>
            )}
            {pendingCount > 0 && (
              <span style={{
                background: "rgba(239,68,68,0.15)", color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20,
                padding: "2px 8px", fontSize: 10, fontWeight: 700,
              }}>{t.cardDueLabel(pendingCount)}</span>
            )}
          </div>
          <h3 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>
            {cls.name}
          </h3>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 3 }}>
            👨‍🏫 {cls.teacher} · 👥 {cls.students} {t.cardLearnersLabel}
          </div>
        </div>
        <Link href={`/classroom/${cls.id}`} style={{
          background: `${levelColor}22`, color: levelColor,
          border: `1px solid ${levelColor}44`, borderRadius: 8,
          padding: "6px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
        }}>
          {t.cardViewBtn}
        </Link>
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{t.cardProgressLabel}</span>
          <span style={{ color: levelColor, fontSize: 11, fontWeight: 700 }}>{cls.progress}%</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 5, overflow: "hidden" }}>
          <div style={{ width: `${cls.progress}%`, height: "100%", background: levelColor, borderRadius: 4, transition: "width 0.6s ease" }} />
        </div>
      </div>

      {/* Assignments */}
      <div>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          {t.cardAssignmentsLabel}
        </div>
        {cls.nextAssignments.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>{t.cardNoAssignments}</div>
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
                    {a.submitted
                      ? t.cardSubmittedLabel
                      : new Date(a.dueDate).toLocaleDateString(t.dateLocale, { day: "2-digit", month: "short" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <code style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, fontFamily: "monospace" }}>{cls.code}</code>
        <Link href={`/classroom/${cls.id}`} style={{
          background: `${levelColor}22`, color: levelColor,
          border: `1px solid ${levelColor}44`, borderRadius: 8,
          padding: "6px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none",
        }}>
          {t.cardViewBtn}
        </Link>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClassroomListPage() {
  const pathname = usePathname();
  const locale: Locale = pathname.startsWith("/en") ? "en" : "fr";
  const t = T[locale] as TT;

  const classrooms = getMockClassrooms(locale);

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
        setJoinError(d.error ?? t.modalError);
      } else {
        setJoinSuccess(true);
        setTimeout(() => { setShowJoinModal(false); setCode(""); setJoinSuccess(false); }, 1800);
      }
    } catch {
      setJoinError(t.modalNetworkError);
    } finally {
      setJoining(false);
    }
  };

  return (
    <Layout title={t.layoutTitle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        .syne { font-family: 'Syne', sans-serif; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 className="syne" style={{ margin: 0, color: "#f1f5f9", fontWeight: 800, fontSize: 24 }}>
            {t.pageTitle}
          </h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
            {t.pageSubtitle}
          </p>
        </div>
        <button onClick={() => setShowJoinModal(true)} style={{
          background: "rgba(16,185,129,0.12)", color: "#10b981",
          border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10,
          padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          {t.joinCta}
        </button>
      </div>

      {/* Positioning block */}
      <div style={{
        background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)",
        borderRadius: 12, padding: "14px 18px", marginBottom: 24,
        display: "flex", gap: 12, alignItems: "center",
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🎓</span>
        <div>
          <div className="syne" style={{ color: "#10b981", fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
            {t.positionTitle}
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{t.positionDesc}</div>
        </div>
      </div>

      {/* Class grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 20 }}>
        {classrooms.map(cls => <ClassCard key={cls.id} cls={cls} t={t} />)}

        {/* Empty state */}
        {classrooms.length === 0 && (
          <div style={{
            gridColumn: "1/-1", textAlign: "center", padding: "60px 20px",
            background: "rgba(13,17,23,0.6)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏫</div>
            <div className="syne" style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              {t.emptyTitle}
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 20 }}>
              {t.emptyDesc}
            </div>
            <button onClick={() => setShowJoinModal(true)} style={{
              background: "#10b981", color: "#fff", border: "none", borderRadius: 10,
              padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>
              {t.emptyBtn}
            </button>
          </div>
        )}
      </div>

      {/* Community bridge */}
      <div style={{
        marginTop: 32, background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.12)",
        borderRadius: 12, padding: "16px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
      }}>
        <div>
          <div className="syne" style={{ color: "#a5b4fc", fontWeight: 700, fontSize: 13 }}>
            {t.communityTitle}
          </div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 3 }}>
            {t.communityDesc}
          </div>
        </div>
        <span style={{
          background: "rgba(99,102,241,0.12)", color: "#a5b4fc",
          border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20,
          padding: "4px 12px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0,
        }}>{t.communitySoon}</span>
      </div>

      {/* Join modal */}
      {showJoinModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
          onClick={e => e.target === e.currentTarget && setShowJoinModal(false)}
        >
          <div style={{
            background: "#0d1117", border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: 16, padding: 32, width: 420, maxWidth: "90vw",
          }}>
            {joinSuccess ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div className="syne" style={{ color: "#10b981", fontWeight: 800, fontSize: 20 }}>
                  {t.modalSuccessTitle}
                </div>
              </div>
            ) : (
              <>
                <div className="syne" style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
                  {t.modalTitle}
                </div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 24 }}>
                  {t.modalSubtitle}
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setJoinError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleJoin()}
                  placeholder="DEUTSCH-A1-2024"
                  autoFocus
                  style={{
                    width: "100%", background: "#161b22",
                    border: `1px solid ${joinError ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 10, padding: "12px 16px", color: "#10b981",
                    fontSize: 16, fontFamily: "monospace", letterSpacing: "0.05em",
                    outline: "none", boxSizing: "border-box", marginBottom: 8,
                  }}
                />
                {joinError && (
                  <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>{joinError}</div>
                )}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                  <button onClick={() => setShowJoinModal(false)} style={{
                    background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                    padding: "8px 20px", cursor: "pointer",
                  }}>{t.modalCancel}</button>
                  <button onClick={handleJoin} disabled={joining || !code.trim()} style={{
                    background: joining ? "rgba(16,185,129,0.5)" : "#10b981",
                    color: "#fff", border: "none", borderRadius: 8,
                    padding: "8px 24px", cursor: "pointer", fontWeight: 700, fontSize: 14,
                  }}>
                    {joining ? t.modalJoiningBtn : t.modalJoinBtn}
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
