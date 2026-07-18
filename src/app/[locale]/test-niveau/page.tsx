"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "@/navigation";
import { usePathname } from "next/navigation";

interface Question {
  id: string;
  level: string;
  type?: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: "#10b981", A2: "#34d399", B1: "#6366f1", B2: "#8b5cf6", C1: "#f59e0b",
};

const TOTAL_TIME = 1200; // 20 minutes

function pad(n: number) { return String(n).padStart(2, "0"); }

function levelFromTotal(correct: number): string {
  if (correct <= 5)  return "A1";
  if (correct <= 11) return "A2";
  if (correct <= 17) return "B1";
  if (correct <= 23) return "B2";
  return "C1";
}

function typeToSkill(type?: string): "grammar" | "vocabulary" | "expression" | "comprehension" {
  if (type === "article" || type === "error") return "grammar";
  if (type === "fill") return "vocabulary";
  if (type === "translate") return "expression";
  return "comprehension";
}

const T = {
  fr: {
    typeLabels: { qcm: "QCM", fill: "Compléter", translate: "Traduction", error: "Erreur", article: "Article" } as Record<string, string>,
    loading1: "Génération des questions CEFR...",
    loading2: "Notre IA prépare votre test de 30 questions A1→C1",
    loadError: "Le chargement n'a pas abouti — rafraîchissez la page.",
    header: "Test de niveau CEFR",
    headerSub: "30 questions A1→C1",
    timerLabel: "souple",
    questionLabel: "Question",
    progressSuffix: "% complété",
    feedbackSkipped: "⏭ Question passée",
    feedbackCorrect: "✓ Correct !",
    feedbackWrong: "✗ Incorrect",
    skip: "Passer ⏭",
    confirm: "Valider ma réponse",
    next: "Question suivante →",
    finish: "Voir mes résultats CEFR →",
  },
  en: {
    typeLabels: { qcm: "MCQ", fill: "Fill in", translate: "Translation", error: "Error", article: "Article" } as Record<string, string>,
    loading1: "Generating CEFR questions...",
    loading2: "Our AI is preparing your 30-question A1→C1 test",
    loadError: "Loading error — Please refresh the page",
    header: "CEFR Level Test",
    headerSub: "30 questions A1→C1",
    timerLabel: "soft",
    questionLabel: "Question",
    progressSuffix: "% complete",
    feedbackSkipped: "⏭ Question skipped",
    feedbackCorrect: "✓ Correct!",
    feedbackWrong: "✗ Incorrect",
    skip: "Skip ⏭",
    confirm: "Submit answer",
    next: "Next question →",
    finish: "See my CEFR results →",
  },
};

export default function TestNiveauPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "fr";
  const t = T[locale];

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [submitted, setSubmitted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`/api/test-niveau?locale=${locale}`)
      .then(r => r.json())
      .then(d => {
        const qs = d.questions ?? [];
        setQuestions(qs);
        setAnswers(Array(qs.length).fill(null));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [locale]);

  const submitResults = useCallback((finalAnswers: (number | null)[], qs: Question[]) => {
    if (submitted) return;
    setSubmitted(true);
    clearInterval(intervalRef.current!);

    const breakdown: Record<string, { correct: number; total: number }> = {};
    qs.forEach((q, i) => {
      if (!breakdown[q.level]) breakdown[q.level] = { correct: 0, total: 0 };
      breakdown[q.level].total++;
      if (finalAnswers[i] === q.correct) breakdown[q.level].correct++;
    });

    const totalCorrect = finalAnswers.filter((a, i) => a !== null && a === qs[i].correct).length;
    const detectedLevel = levelFromTotal(totalCorrect);
    const score = Math.round((totalCorrect / qs.length) * 100);

    const skillBreakdown: Record<string, { correct: number; total: number }> = {};
    qs.forEach((q, i) => {
      const skill = typeToSkill(q.type);
      if (!skillBreakdown[skill]) skillBreakdown[skill] = { correct: 0, total: 0 };
      skillBreakdown[skill].total++;
      if (finalAnswers[i] === q.correct) skillBreakdown[skill].correct++;
    });

    sessionStorage.setItem("testResult", JSON.stringify({ level: detectedLevel, score, breakdown, skillBreakdown, totalCorrect, total: qs.length }));

    fetch("/api/test-niveau", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: detectedLevel, score }),
    }).catch(() => {});

    router.push("/test-niveau/results");
  }, [submitted, router]);

  useEffect(() => {
    if (loading || questions.length === 0) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          submitResults([...answers], questions);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [loading, questions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirm = () => {
    if (selected === null) return;
    const newAnswers = [...answers];
    newAnswers[current] = selected;
    setAnswers(newAnswers);
    setConfirmed(true);
  };

  const skip = () => {
    const newAnswers = [...answers];
    newAnswers[current] = null;
    setAnswers(newAnswers);
    setSkipped(true);
    setConfirmed(true);
  };

  const next = () => {
    if (current === questions.length - 1) {
      submitResults([...answers], questions);
      return;
    }
    setCurrent(c => c + 1);
    setSelected(null);
    setConfirmed(false);
    setSkipped(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080c10", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>⏳</div>
        <div style={{ color: "#10b981", fontWeight: 700, fontSize: 16 }}>{t.loading1}</div>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, marginTop: 6 }}>{t.loading2}</div>
      </div>
    </div>
  );

  if (questions.length === 0) return (
    <div style={{ minHeight: "100vh", background: "#080c10", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ef4444", fontSize: 16 }}>{t.loadError}</div>
    </div>
  );

  const q = questions[current];
  const levelColor = LEVEL_COLORS[q.level] ?? "#10b981";
  const progress = (current / questions.length) * 100;
  const timerUrgent = timeLeft < 120;
  const isLast = current === questions.length - 1;

  const levelOrder = ["A1", "A2", "B1", "B2", "C1"];
  const levelCounts = { A1: 6, A2: 6, B1: 6, B2: 6, C1: 6 };

  return (
    <div style={{ minHeight: "100vh", background: "#080c10" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0);} }
        .fadeUp { animation: fadeUp var(--dur-move) var(--ease-enter) forwards; }
        @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.5;} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px);}to{opacity:1;transform:translateX(0);} }
        .slideIn { animation: slideIn var(--dur-move) var(--ease-enter) forwards; }
      `}</style>

      {/* ── Sticky header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(8,12,16,0.97)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "12px 24px",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>🎯</span>
              <div>
                <span style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>{t.header}</span>
                <span style={{ color: "rgba(255,255,255,0.60)", fontSize: 13, marginLeft: 8 }}>{t.headerSub}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                background: timerUrgent ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${timerUrgent ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 8, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6,
                animation: timerUrgent ? "pulse 1s infinite" : "none",
              }}>
                <span style={{ fontSize: 13 }}>⏱️</span>
                <span style={{ color: timerUrgent ? "#ef4444" : "#f1f5f9", fontFamily: "monospace", fontWeight: 700, fontSize: 16 }}>
                  {pad(Math.floor(timeLeft / 60))}:{pad(timeLeft % 60)}
                </span>
                {timerUrgent && <span style={{ color: "#ef4444", fontSize: 12 }}>{t.timerLabel}</span>}
              </div>
              <span style={{ color: "rgba(255,255,255,0.68)", fontSize: 13 }}>{current + 1} / {questions.length}</span>
            </div>
          </div>

          {/* Level progress mini-bars */}
          <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
            {levelOrder.map(lvl => {
              const lc = LEVEL_COLORS[lvl] ?? "#10b981";
              const count = levelCounts[lvl as keyof typeof levelCounts] ?? 6;
              const startIdx = levelOrder.slice(0, levelOrder.indexOf(lvl)).reduce((acc, l) => acc + (levelCounts[l as keyof typeof levelCounts] ?? 6), 0);
              return Array.from({ length: count }, (_, i) => {
                const qIdx = startIdx + i;
                const done = qIdx < current;
                const active = qIdx === current;
                return (
                  <div key={`${lvl}-${i}`} style={{
                    flex: 1, height: 5, borderRadius: 2,
                    background: done ? lc : active ? `${lc}80` : "rgba(255,255,255,0.06)",
                    transition: "background var(--dur-move)",
                  }} />
                );
              });
            })}
          </div>

          {/* Overall progress indicator */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8 }}>
              {levelOrder.map(lvl => (
                <span key={lvl} style={{
                  fontSize: 10, fontWeight: 700,
                  color: q.level === lvl ? LEVEL_COLORS[lvl] : "rgba(255,255,255,0.40)",
                  transition: "color var(--dur-move)",
                }}>{lvl}</span>
              ))}
            </div>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{Math.round(progress)}{t.progressSuffix}</span>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
        <div className="slideIn" key={current}>
          {/* Level + type badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <span style={{
              background: `${levelColor}20`, color: levelColor,
              border: `1px solid ${levelColor}40`, borderRadius: 6,
              padding: "3px 10px", fontSize: 12, fontWeight: 800,
            }}>{q.level}</span>
            {q.type && (
              <span style={{
                background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.68)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6,
                padding: "3px 9px", fontSize: 13,
              }}>{t.typeLabels[q.type] ?? q.type}</span>
            )}
            <span style={{ color: "rgba(255,255,255,0.58)", fontSize: 13 }}>{t.questionLabel} {current + 1}</span>
          </div>

          {/* Question card */}
          <div style={{
            background: "rgba(13,17,23,0.9)", border: `1px solid ${levelColor}22`,
            borderTop: `3px solid ${levelColor}`, borderRadius: 16,
            padding: "24px 26px", marginBottom: 20,
          }}>
            <p style={{ margin: 0, color: "#f1f5f9", fontSize: 17, fontWeight: 600, lineHeight: 1.65 }}>
              {q.question}
            </p>
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {q.options.map((opt, i) => {
              let bg = "rgba(255,255,255,0.03)";
              let border = "rgba(255,255,255,0.08)";
              let color: string = "rgba(255,255,255,0.65)";
              let icon = "";

              if (confirmed && !skipped) {
                if (i === q.correct)       { bg = "rgba(16,185,129,0.1)"; border = "rgba(16,185,129,0.4)"; color = "#10b981"; icon = "✓"; }
                else if (i === selected)   { bg = "rgba(239,68,68,0.08)"; border = "rgba(239,68,68,0.3)";  color = "#ef4444"; icon = "✗"; }
              } else if (skipped && i === q.correct) {
                bg = "rgba(16,185,129,0.08)"; border = "rgba(16,185,129,0.3)"; color = "#10b981"; icon = "✓";
              } else if (!confirmed && selected === i) {
                bg = `${levelColor}18`; border = `${levelColor}50`; color = levelColor;
              }

              return (
                <button key={i} disabled={confirmed} onClick={() => setSelected(i)} style={{
                  display: "flex", alignItems: "center", gap: 14, textAlign: "left",
                  background: bg, border: `1px solid ${border}`, borderRadius: 12,
                  padding: "13px 18px", cursor: confirmed ? "default" : "pointer",
                  transition: "all var(--dur-touch)",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: (confirmed || skipped) && (i === q.correct || i === selected) ? bg : "rgba(255,255,255,0.04)",
                    border: `2px solid ${border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color, fontSize: (confirmed || skipped) ? 13 : 11, fontWeight: 700,
                  }}>
                    {(confirmed || skipped) ? (icon || String.fromCharCode(65 + i)) : String.fromCharCode(65 + i)}
                  </div>
                  <span style={{ color, fontSize: 14, lineHeight: 1.4 }}>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {confirmed && (
            <div style={{
              background: skipped ? "rgba(245,158,11,0.06)" : selected === q.correct ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
              border: `1px solid ${skipped ? "rgba(245,158,11,0.2)" : selected === q.correct ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
              borderRadius: 12, padding: "14px 18px", marginBottom: 20,
            }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: skipped ? "#f59e0b" : selected === q.correct ? "#10b981" : "#ef4444" }}>
                {skipped ? t.feedbackSkipped : selected === q.correct ? t.feedbackCorrect : t.feedbackWrong}
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.5 }}>{q.explanation}</div>
            </div>
          )}

          {/* Action buttons */}
          {!confirmed ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={skip} style={{
                flex: "0 0 auto", background: "rgba(255,255,255,0.03)",
                color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: "14px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>
                {t.skip}
              </button>
              <button onClick={confirm} disabled={selected === null} style={{
                flex: 1, background: selected !== null ? levelColor : "rgba(255,255,255,0.05)",
                color: selected !== null ? "#fff" : "rgba(255,255,255,0.2)",
                border: "none", borderRadius: 12, padding: "14px",
                fontWeight: 700, fontSize: 15, cursor: selected !== null ? "pointer" : "default",
                transition: "all var(--dur-move)",
              }}>
                {t.confirm}
              </button>
            </div>
          ) : (
            <button onClick={next} style={{
              width: "100%", background: "#10b981", color: "#fff",
              border: "none", borderRadius: 12, padding: "15px",
              fontWeight: 700, fontSize: 15, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(16,185,129,0.25)",
            }}>
              {isLast ? t.finish : t.next}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
