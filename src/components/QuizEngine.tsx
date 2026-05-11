"use client";

import { useState, useEffect, useCallback } from "react";
import type { QuizQuestion } from "@/types/courses";

interface QuizEngineProps {
  questions: QuizQuestion[];
  xp: number;
  onComplete: (score: number) => void;
}

const TIMER_SECONDS = 30;

function scoreColor(ratio: number): string {
  if (ratio >= 0.8) return "#10b981";
  if (ratio >= 0.5) return "#f59e0b";
  return "#ef4444";
}

function scoreBg(ratio: number): string {
  if (ratio >= 0.8) return "rgba(16,185,129,0.1)";
  if (ratio >= 0.5) return "rgba(245,158,11,0.1)";
  return "rgba(239,68,68,0.1)";
}

function scoreBorder(ratio: number): string {
  if (ratio >= 0.8) return "rgba(16,185,129,0.3)";
  if (ratio >= 0.5) return "rgba(245,158,11,0.3)";
  return "rgba(239,68,68,0.3)";
}

export default function QuizEngine({ questions, xp, onComplete }: QuizEngineProps) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [shake, setShake] = useState(false);

  const q = questions[current];
  const total = questions.length;
  const progress = ((current + (showFeedback ? 1 : 0)) / total) * 100;

  const handleTimeout = useCallback(() => {
    if (!showFeedback) {
      setSelected(-1);
      setShowFeedback(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  }, [showFeedback]);

  useEffect(() => {
    if (showFeedback || finished) return;
    if (timeLeft <= 0) { handleTimeout(); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, showFeedback, finished, handleTimeout]);

  const handleSelect = (idx: number) => {
    if (showFeedback) return;
    setSelected(idx);
    setShowFeedback(true);
    if (idx === q.correct) {
      setScore((s) => s + 1);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  const handleNext = () => {
    if (current + 1 >= total) {
      const finalScore = selected === q.correct ? score : score;
      setFinished(true);
      onComplete(selected === q.correct ? score + (selected === q.correct ? 0 : 0) : score);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowFeedback(false);
      setTimeLeft(TIMER_SECONDS);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setShowFeedback(false);
    setScore(0);
    setFinished(false);
    setTimeLeft(TIMER_SECONDS);
  };

  const timerRatio = timeLeft / TIMER_SECONDS;
  const timerColor = timerRatio > 0.5 ? "#10b981" : timerRatio > 0.25 ? "#f59e0b" : "#ef4444";

  // ── Finished screen ───────────────────────────────────────────────────────
  if (finished) {
    const ratio = score / total;
    const xpEarned = Math.round(xp * ratio);
    const badge = ratio === 1 ? "🏆 Parfait !" : ratio >= 0.8 ? "⭐ Excellent" : ratio >= 0.5 ? "👍 Bien" : "📚 Continue";

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: "48px 32px",
          textAlign: "center",
          height: "100%",
        }}
      >
        <style>{`
          @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          .pop-in { animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        `}</style>

        {/* Score ring */}
        <div className="pop-in" style={{ position: "relative", width: 140, height: 140 }}>
          <svg width={140} height={140} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={70} cy={70} r={56} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10} />
            <circle
              cx={70} cy={70} r={56}
              fill="none"
              stroke={scoreColor(ratio)}
              strokeWidth={10}
              strokeDasharray={`${ratio * 2 * Math.PI * 56} ${2 * Math.PI * 56}`}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "2rem", color: scoreColor(ratio) }}>
              {score}/{total}
            </span>
            <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono', monospace" }}>
              score
            </span>
          </div>
        </div>

        <div>
          <p style={{ margin: "0 0 6px", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "white" }}>
            {badge}
          </p>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", fontFamily: "'DM Mono', monospace" }}>
            {Math.round(ratio * 100)}% de bonnes réponses
          </p>
        </div>

        {/* XP earned */}
        <div style={{
          padding: "14px 28px", borderRadius: 16,
          background: scoreBg(ratio), border: `1px solid ${scoreBorder(ratio)}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: "1.5rem" }}>⚡</span>
          <div>
            <p style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: scoreColor(ratio) }}>
              +{xpEarned} XP
            </p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: "0.65rem" }}>
              gagné dans cette session
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleRestart}
            style={{
              padding: "10px 22px", borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.65)",
              fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            🔄 Recommencer
          </button>
          <button
            onClick={() => onComplete(score)}
            style={{
              padding: "10px 22px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "white",
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.8rem",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
            }}
          >
            Module suivant →
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz screen ────────────────────────────────────────────────────────────
  const isCorrect = selected === q.correct;
  const isTimeout = selected === -1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, height: "100%", padding: "8px 0" }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        .shake { animation: shake 0.5s ease; }
        @keyframes correctPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .correct-pop { animation: correctPop 0.3s ease; }
      `}</style>

      {/* Progress + timer bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", fontFamily: "'DM Mono', monospace" }}>
            Question {current + 1} / {total}
          </span>
          <span style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.78rem",
            color: timerColor,
            transition: "color 0.3s",
          }}>
            ⏱ {timeLeft}s
          </span>
        </div>

        {/* Question progress */}
        <div style={{ height: 5, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.07)" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            width: `${progress}%`,
            background: "linear-gradient(90deg, #10b981, #059669)",
            transition: "width 0.4s ease",
          }} />
        </div>

        {/* Timer bar */}
        <div style={{ height: 3, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.05)" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            width: `${(timeLeft / TIMER_SECONDS) * 100}%`,
            background: timerColor,
            transition: "width 1s linear, background 0.3s",
          }} />
        </div>
      </div>

      {/* Question */}
      <div className={shake ? "shake" : ""}>
        <p style={{
          margin: 0,
          color: "white",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: "1.05rem",
          lineHeight: 1.5,
        }}>
          {q.question}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {q.options.map((option, idx) => {
          let bg = "rgba(255,255,255,0.04)";
          let border = "rgba(255,255,255,0.09)";
          let color = "rgba(255,255,255,0.8)";
          let className = "";

          if (showFeedback) {
            if (idx === q.correct) {
              bg = "rgba(16,185,129,0.12)";
              border = "rgba(16,185,129,0.4)";
              color = "#10b981";
              className = "correct-pop";
            } else if (idx === selected) {
              bg = "rgba(239,68,68,0.1)";
              border = "rgba(239,68,68,0.35)";
              color = "#f87171";
            }
          } else if (selected === idx) {
            bg = "rgba(16,185,129,0.08)";
            border = "rgba(16,185,129,0.3)";
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={className}
              disabled={showFeedback}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "14px 18px",
                borderRadius: 14,
                border: `1px solid ${border}`,
                background: bg,
                color,
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.85rem",
                cursor: showFeedback ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                transition: "all 0.15s ease",
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.7rem",
                background: showFeedback && idx === q.correct ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.07)",
                color: showFeedback && idx === q.correct ? "#10b981" : "rgba(255,255,255,0.4)",
              }}>
                {String.fromCharCode(65 + idx)}
              </span>
              {option}
              {showFeedback && idx === q.correct && (
                <span style={{ marginLeft: "auto", fontSize: "1rem" }}>✓</span>
              )}
              {showFeedback && idx === selected && idx !== q.correct && (
                <span style={{ marginLeft: "auto", fontSize: "1rem" }}>✗</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback explanation */}
      {showFeedback && (
        <div style={{
          padding: "14px 18px", borderRadius: 14,
          background: isCorrect ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)",
          border: `1px solid ${isCorrect ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}>
          <p style={{
            margin: 0,
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.8rem",
            color: isCorrect ? "#10b981" : isTimeout ? "#f59e0b" : "#f87171",
          }}>
            {isCorrect ? "✓ Richtig! Sehr gut!" : isTimeout ? "⏱ Zeit abgelaufen!" : "✗ Falsch!"}
          </p>
          <p style={{
            margin: 0,
            color: "rgba(255,255,255,0.6)",
            fontSize: "0.78rem",
            fontFamily: "'DM Mono', monospace",
            lineHeight: 1.5,
          }}>
            {q.explanation}
          </p>
        </div>
      )}

      {/* Next button */}
      {showFeedback && (
        <button
          onClick={handleNext}
          style={{
            alignSelf: "flex-end",
            padding: "10px 24px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "white",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.82rem",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
          }}
        >
          {current + 1 >= total ? "Voir les résultats →" : "Question suivante →"}
        </button>
      )}
    </div>
  );
}
