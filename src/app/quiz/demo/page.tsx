"use client"
import { useState } from "react"
import AdaptiveQuiz from "@/components/AdaptiveQuiz"

const QUIZ_CONFIGS = [
  { level: "A1", topic: "Salutations et présentations — Lektion 1", label: "A1 — Guten Tag!", color: "#10b981" },
  { level: "A2", topic: "Vie quotidienne et famille", label: "A2 — Alltag", color: "#60a5fa" },
  { level: "B1", topic: "Travail et société", label: "B1 — Arbeit", color: "#a78bfa" },
]

export default function QuizDemo() {
  const [activeConfig, setActiveConfig] = useState(QUIZ_CONFIGS[0])
  const [quizKey, setQuizKey] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [adaptive, setAdaptive] = useState(true)

  return (
    <div style={{
      minHeight: "100vh", background: "#080c10",
      padding: "40px 24px", fontFamily: "'DM Mono',monospace"
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono&display=swap')`}</style>

      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", color: "white", fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          🎯 Quiz Adaptatif — DeutschCM
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24 }}>
          Difficulté ajustée selon vos performances · Généré par Gemini IA
        </p>

        {/* Config */}
        <div style={{
          padding: "16px 20px", borderRadius: 16, marginBottom: 20,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)"
        }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {QUIZ_CONFIGS.map(cfg => (
              <button key={cfg.level} onClick={() => { setActiveConfig(cfg); setQuizKey(k => k + 1) }}
                style={{
                  padding: "7px 16px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                  background: activeConfig.level === cfg.level
                    ? `${cfg.color}20` : "rgba(255,255,255,0.05)",
                  border: activeConfig.level === cfg.level
                    ? `1px solid ${cfg.color}40` : "1px solid rgba(255,255,255,0.1)",
                  color: activeConfig.level === cfg.level ? cfg.color : "rgba(255,255,255,0.5)",
                  cursor: "pointer"
                }}>
                {cfg.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => { setAdaptive(!adaptive); setQuizKey(k => k + 1) }}
              style={{
                padding: "6px 14px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                background: adaptive ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)",
                border: adaptive ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.1)",
                color: adaptive ? "#60a5fa" : "rgba(255,255,255,0.4)",
                cursor: "pointer"
              }}>
              🧠 Mode adaptatif : {adaptive ? "ON" : "OFF"}
            </button>
            {scores.length > 0 && (
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                Score précédent : {scores[scores.length - 1]}%
              </span>
            )}
          </div>
        </div>

        {/* Quiz */}
        <div style={{
          padding: "24px", borderRadius: 20,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
          <AdaptiveQuiz
            key={quizKey}
            level={activeConfig.level}
            topic={activeConfig.topic}
            questionCount={10}
            adaptive={adaptive}
            previousScores={scores}
            onComplete={(result) => {
              setScores(prev => [...prev, result.percentage])
            }}
            onClose={() => setQuizKey(k => k + 1)}
          />
        </div>
      </div>
    </div>
  )
}
