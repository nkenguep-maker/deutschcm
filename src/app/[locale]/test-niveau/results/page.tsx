"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { usePathname } from "next/navigation";

interface SkillScore { correct: number; total: number }
interface Breakdown { [level: string]: SkillScore }
interface Result {
  level: string;
  score: number;
  breakdown: Breakdown;
  skillBreakdown?: Record<string, SkillScore>;
  totalCorrect?: number;
  total?: number;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: "#10b981", A2: "#34d399", B1: "#6366f1", B2: "#8b5cf6", C1: "#f59e0b",
};

const SKILL_COLORS: Record<string, string> = {
  grammar: "#8b5cf6", vocabulary: "#10b981", expression: "#f59e0b", comprehension: "#60a5fa",
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const SKILL_ORDER = ["grammar", "vocabulary", "expression", "comprehension"];

const LEVEL_LABELS: Record<"fr" | "en", Record<string, string>> = {
  fr: { A1: "Débutant", A2: "Élémentaire", B1: "Intermédiaire", B2: "Intermédiaire supérieur", C1: "Avancé" },
  en: { A1: "Beginner", A2: "Elementary", B1: "Intermediate", B2: "Upper Intermediate", C1: "Advanced" },
};

const SKILL_LABELS: Record<"fr" | "en", Record<string, string>> = {
  fr: { grammar: "Grammaire", vocabulary: "Vocabulaire", expression: "Expression", comprehension: "Compréhension" },
  en: { grammar: "Grammar", vocabulary: "Vocabulary", expression: "Expression", comprehension: "Comprehension" },
};

const NEXT_STEPS: Record<"fr" | "en", Record<string, { label: string; desc: string }>> = {
  fr: {
    A1: { label: "Commencer le parcours A1", desc: "Fondamentaux : alphabet, salutations, chiffres et présentations" },
    A2: { label: "Reprendre les bases essentielles", desc: "Articles, conjugaisons et vocabulaire du quotidien" },
    B1: { label: "Continuer vers B1", desc: "Perfekt, Konjunktiv et expression orale courante" },
    B2: { label: "Viser le B2", desc: "Grammaire avancée, nuances culturelles et fluidité" },
    C1: { label: "Pratiquer l'oral avec Yema", desc: "Simulateur ambassade et situations du quotidien complexes" },
  },
  en: {
    A1: { label: "Start the A1 path", desc: "Fundamentals: alphabet, greetings, numbers and introductions" },
    A2: { label: "Review the essentials", desc: "Articles, conjugations and everyday vocabulary" },
    B1: { label: "Continue toward B1", desc: "Perfekt, Konjunktiv and everyday speaking" },
    B2: { label: "Aim for B2", desc: "Advanced grammar, cultural nuances and fluency" },
    C1: { label: "Practice speaking with Yema", desc: "Embassy simulator and complex real-world situations" },
  },
};

function getScoreMessage(score: number, locale: "fr" | "en"): string {
  const msgs: Record<"fr" | "en", string[]> = {
    fr: [
      "Ce n'est pas un échec. C'est simplement votre point de départ. Chaque personne qui parle aujourd'hui une langue a commencé quelque part. Yema va vous accompagner étape par étape.",
      "Vous avez déjà des bases. Il reste du chemin, mais vous n'êtes pas loin de construire une vraie confiance. Continuez, votre progression peut aller vite avec une pratique régulière.",
      "Très bon début. Vous comprenez déjà beaucoup de choses et vous avez une base solide pour avancer. Avec un peu plus de pratique, vous pouvez gagner en fluidité.",
      "Excellent travail. Vous avez déjà une très bonne base. Maintenant, l'objectif est de transformer vos connaissances en confiance réelle à l'oral et dans les situations du quotidien.",
    ],
    en: [
      "This is not a failure. It is simply your starting point. Everyone who speaks a language today started somewhere. Yema will guide you step by step.",
      "You already have a foundation. There is still work ahead, but you are closer than you think to building real confidence. Keep going — progress can come quickly with regular practice.",
      "Great start. You already understand many things and have a solid base to move forward. With more practice, you can become more fluent and confident.",
      "Excellent work. You already have a strong foundation. Now the goal is to turn your knowledge into real confidence when speaking and handling everyday situations.",
    ],
  };
  const idx = score <= 39 ? 0 : score <= 59 ? 1 : score <= 79 ? 2 : 3;
  return msgs[locale][idx];
}

const T = {
  fr: {
    loading: "Chargement…",
    headerSub: "Test CEFR · Résultats",
    heading: "Votre niveau d'allemand",
    recommendedLevel: "Niveau recommandé",
    totalScore: "Score total",
    outOf: "/100",
    correctAnswers: (n: number, tot: number) => `${n} bonnes réponses sur ${tot}`,
    breakdownTitle: "Résultats par niveau CEFR",
    skillsTitle: "Compétences",
    nextStepTitle: "Votre prochaine étape",
    yourLevel: "✓ Votre niveau",
    legendMastered: "≥ 4/6 Maîtrisé",
    legendPartial: "2-3/6 Partiel",
    legendReview: "0-1/6 À revoir",
    lockedMsg: "Votre niveau est confirmé. Commencez votre parcours.",
    attemptMsg: (n: number) => `Tentative ${n} sur 2 — vous pouvez reprendre le test une fois.`,
    startBtn: "Commencer mon parcours",
    simulatorBtn: "Pratiquer avec le simulateur",
    retakeBtn: "Refaire le test",
    redirecting: "Chargement…",
    savedNote: "Votre niveau est sauvegardé automatiquement.",
  },
  en: {
    loading: "Loading…",
    headerSub: "CEFR Test · Results",
    heading: "Your German Level",
    recommendedLevel: "Recommended level",
    totalScore: "Total score",
    outOf: "/100",
    correctAnswers: (n: number, tot: number) => `${n} correct answers out of ${tot}`,
    breakdownTitle: "Results by CEFR level",
    skillsTitle: "Skills",
    nextStepTitle: "Your next step",
    yourLevel: "✓ Your level",
    legendMastered: "≥ 4/6 Mastered",
    legendPartial: "2-3/6 Partial",
    legendReview: "0-1/6 To review",
    lockedMsg: "Your level is confirmed. Start your journey.",
    attemptMsg: (n: number) => `Attempt ${n} of 2 — you can retake the test once.`,
    startBtn: "Start my path",
    simulatorBtn: "Practice with the simulator",
    retakeBtn: "Retake the test",
    redirecting: "Loading…",
    savedNote: "Your level is automatically saved.",
  },
};

function levelIcon(correct: number, total: number) {
  const pct = total === 0 ? 0 : correct / total;
  if (pct >= 0.67) return { icon: "✅", color: "#10b981" };
  if (pct >= 0.33) return { icon: "⚠️", color: "#f59e0b" };
  return { icon: "❌", color: "#ef4444" };
}

export default function TestResultsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.startsWith("/en") ? "en" : "fr") as "fr" | "en";
  const t = T[locale];
  const labels = LEVEL_LABELS[locale];
  const skillLabels = SKILL_LABELS[locale];
  const nextSteps = NEXT_STEPS[locale];

  const [result, setResult] = useState<Result | null>(null);
  const [attempts, setAttempts] = useState<number | null>(null);
  const [animated, setAnimated] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("testResult");
    if (!raw) { router.push("/test-niveau"); return; }
    setResult(JSON.parse(raw) as Result);
    setTimeout(() => setAnimated(true), 200);

    fetch("/api/test-niveau/attempts")
      .then(r => r.json())
      .then(d => setAttempts(d.attempts ?? 0))
      .catch(() => setAttempts(0));
  }, [router]);

  const accept = async () => {
    setAccepting(true);
    sessionStorage.removeItem("testResult");
    router.push("/dashboard");
  };

  const goToSimulator = () => {
    setAccepting(true);
    sessionStorage.removeItem("testResult");
    router.push("/simulateur");
  };

  const retake = () => {
    sessionStorage.removeItem("testResult");
    router.push("/test-niveau");
  };

  if (!result) return (
    <div style={{ minHeight: "100vh", background: "#080c10", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>{t.loading}</div>
    </div>
  );

  const levelColor = LEVEL_COLORS[result.level] ?? "#10b981";
  const canRetake = attempts !== null && attempts < 2;
  const scoreMessage = getScoreMessage(result.score, locale);
  const nextStep = nextSteps[result.level] ?? nextSteps.A1;
  const hasSkills = result.skillBreakdown && Object.keys(result.skillBreakdown).length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#080c10", padding: "48px 20px 80px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.78);}to{opacity:1;transform:scale(1);} }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .scale-in { animation: scaleIn 0.55s cubic-bezier(.34,1.56,.64,1) forwards; }
      `}</style>

      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 36 }} className="fade-up">
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
            {t.headerSub}
          </div>
          <h1 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24 }}>
            {t.heading}
          </h1>
        </div>

        {/* ── Hero: level badge + score ── */}
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginBottom: 28, opacity: animated ? 1 : 0 }}
          className={animated ? "scale-in" : ""}
        >
          <div style={{
            width: 120, height: 120, borderRadius: "50%",
            background: `${levelColor}12`,
            border: `3px solid ${levelColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 60px ${levelColor}30`,
          }}>
            <span style={{ color: levelColor, fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 42, lineHeight: 1 }}>
              {result.level}
            </span>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 5 }}>
              {t.recommendedLevel}
            </div>
            <div style={{ color: levelColor, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17 }}>
              {labels[result.level]}
            </div>
          </div>

          {/* Score chip */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 18, padding: "16px 36px", textAlign: "center",
            minWidth: 220,
          }}>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
              {t.totalScore}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2, justifyContent: "center" }}>
              <span style={{ color: levelColor, fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 48, lineHeight: 1 }}>
                {result.score}
              </span>
              <span style={{ color: "rgba(255,255,255,0.22)", fontWeight: 600, fontSize: 22, marginLeft: 2 }}>
                {t.outOf}
              </span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 8 }}>
              {t.correctAnswers(result.totalCorrect ?? 0, result.total ?? 30)}
            </div>
            {/* Score bar */}
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 4, marginTop: 12, overflow: "hidden" }}>
              <div style={{
                width: animated ? `${result.score}%` : "0%",
                height: "100%", background: `linear-gradient(90deg, ${levelColor}99, ${levelColor})`,
                borderRadius: 4, transition: "width 1.3s cubic-bezier(.4,0,.2,1)",
              }} />
            </div>
          </div>
        </div>

        {/* ── Encouragement message ── */}
        <div
          style={{
            background: "rgba(13,17,23,0.9)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "22px 24px", marginBottom: 20,
          }}
          className="fade-up"
        >
          <div style={{ color: levelColor, fontSize: 18, marginBottom: 12, lineHeight: 1, opacity: 0.8 }}>✦</div>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", fontSize: 14, lineHeight: 1.85 }}>
            {scoreMessage}
          </p>
        </div>

        {/* ── Next step ── */}
        <div
          style={{
            background: `${levelColor}07`,
            border: `1px solid ${levelColor}22`,
            borderRadius: 16, padding: "18px 20px", marginBottom: 20,
            display: "flex", alignItems: "flex-start", gap: 16,
          }}
          className="fade-up"
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${levelColor}18`, border: `1px solid ${levelColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
          }}>
            🗺️
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
              {t.nextStepTitle}
            </div>
            <div style={{ color: levelColor, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 6, lineHeight: 1.3 }}>
              {nextStep.label}
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.55 }}>
              {nextStep.desc}
            </div>
          </div>
        </div>

        {/* ── Score breakdown ── */}
        <div
          style={{ background: "rgba(13,17,23,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px", marginBottom: 20 }}
          className="fade-up"
        >
          <h3 style={{ margin: "0 0 16px", color: "#f1f5f9", fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em" }}>
            {t.breakdownTitle}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {LEVELS.filter(l => result.breakdown[l]).map(l => {
              const b = result.breakdown[l];
              const pct = Math.round((b.correct / b.total) * 100);
              const lc = LEVEL_COLORS[l] ?? "#10b981";
              const { icon, color: iconColor } = levelIcon(b.correct, b.total);
              const isDetected = l === result.level;
              return (
                <div key={l}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{
                      background: `${lc}20`, color: lc, border: `1px solid ${lc}40`,
                      borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 800, flexShrink: 0,
                    }}>{l}</span>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, flex: 1 }}>
                      {labels[l]}
                      {isDetected && (
                        <span style={{ marginLeft: 8, background: `${lc}15`, color: lc, border: `1px solid ${lc}30`, borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>
                          {t.yourLevel}
                        </span>
                      )}
                    </span>
                    <span style={{ color: iconColor, fontSize: 12, fontWeight: 700, fontFamily: "monospace", flexShrink: 0 }}>
                      {b.correct}/{b.total}
                    </span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 5, overflow: "hidden" }}>
                    <div style={{ width: animated ? `${pct}%` : "0%", height: "100%", background: lc, borderRadius: 4, transition: "width 1s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Skill breakdown */}
          {hasSkills && (
            <>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "20px 0 16px" }} />
              <h3 style={{ margin: "0 0 14px", color: "#f1f5f9", fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em" }}>
                {t.skillsTitle}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {SKILL_ORDER.filter(s => result.skillBreakdown?.[s]).map(s => {
                  const sk = result.skillBreakdown![s];
                  const pct = Math.round((sk.correct / sk.total) * 100);
                  const sc = SKILL_COLORS[s] ?? "#10b981";
                  return (
                    <div key={s}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, flex: 1 }}>
                          {skillLabels[s]}
                        </span>
                        <span style={{ color: sc, fontSize: 12, fontWeight: 700, fontFamily: "monospace", flexShrink: 0 }}>
                          {sk.correct}/{sk.total}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, flexShrink: 0, minWidth: 34, textAlign: "right" }}>
                          {pct}%
                        </span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 5, overflow: "hidden" }}>
                        <div style={{ width: animated ? `${pct}%` : "0%", height: "100%", background: sc, borderRadius: 4, transition: "width 1.1s ease 0.2s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap" }}>
            {[
              { icon: "✅", label: t.legendMastered },
              { icon: "⚠️", label: t.legendPartial },
              { icon: "❌", label: t.legendReview },
            ].map(e => (
              <div key={e.icon} style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.28)", fontSize: 11 }}>
                <span>{e.icon}</span><span>{e.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Attempt indicator ── */}
        {attempts !== null && (
          <div
            style={{
              background: attempts >= 2 ? "rgba(16,185,129,0.04)" : "rgba(245,158,11,0.05)",
              border: `1px solid ${attempts >= 2 ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.18)"}`,
              borderRadius: 12, padding: "12px 16px", marginBottom: 20, textAlign: "center",
            }}
            className="fade-up"
          >
            {attempts >= 2 ? (
              <span style={{ color: "rgba(255,255,255,0.38)", fontSize: 12 }}>
                ℹ️ {t.lockedMsg}
              </span>
            ) : (
              <span style={{ color: "#f59e0b", fontSize: 12 }}>
                ℹ️ {t.attemptMsg(attempts)}
              </span>
            )}
          </div>
        )}

        {/* ── CTA buttons ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }} className="fade-up">
          <button
            onClick={accept}
            disabled={accepting}
            style={{
              background: accepting
                ? `${levelColor}60`
                : `linear-gradient(135deg, ${levelColor}, ${levelColor}cc)`,
              color: "#fff", border: "none", borderRadius: 12,
              padding: "15px 24px", fontWeight: 700, fontSize: 15,
              fontFamily: "'Syne',sans-serif",
              cursor: accepting ? "default" : "pointer",
              boxShadow: accepting ? "none" : `0 8px 28px ${levelColor}28`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}>
            {accepting ? t.redirecting : `${t.startBtn} →`}
          </button>

          <button
            onClick={goToSimulator}
            disabled={accepting}
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.75)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: "13px 24px",
              fontWeight: 600, fontSize: 14,
              cursor: accepting ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}>
            🏛️ {t.simulatorBtn}
          </button>

          {canRetake && (
            <button
              onClick={retake}
              style={{
                background: "transparent",
                color: "rgba(255,255,255,0.38)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "12px 24px",
                fontWeight: 500, fontSize: 13, cursor: "pointer",
              }}>
              {t.retakeBtn}
            </button>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 22, color: "rgba(255,255,255,0.16)", fontSize: 11 }}>
          {t.savedNote}
        </div>
      </div>
    </div>
  );
}
