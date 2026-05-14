"use client"
import { useState, useEffect, useCallback } from "react"

interface Question {
  id: string
  type: string
  level: string
  difficulty: number
  question_fr: string
  question_de?: string
  options?: string[]
  correct: string
  correct_index?: number
  explanation_fr: string
  hint_fr: string
  points: number
  topic: string
}

interface QuizResult {
  totalScore: number
  maxScore: number
  percentage: number
  passed: boolean
  correctCount: number
  wrongCount: number
  timeSpent: number
  answers: { questionId: string; correct: boolean; timeSpent: number }[]
}

interface AdaptiveQuizProps {
  level: string
  topic: string
  moduleId?: string
  questionCount?: number
  adaptive?: boolean
  previousScores?: number[]
  onComplete?: (result: QuizResult) => void
  onClose?: () => void
}

export default function AdaptiveQuiz({
  level, topic, moduleId,
  questionCount = 10,
  adaptive = true,
  previousScores = [],
  onComplete,
  onClose
}: AdaptiveQuizProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [userInput, setUserInput] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [answers, setAnswers] = useState<{ questionId: string; correct: boolean; timeSpent: number }[]>([])
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [quizStartTime] = useState(Date.now())
  const [quizComplete, setQuizComplete] = useState(false)
  const [finalResult, setFinalResult] = useState<QuizResult | null>(null)
  const [timer, setTimer] = useState(30)
  const [timerActive, setTimerActive] = useState(false)

  useEffect(() => {
    generateQuestions()
  }, [])

  useEffect(() => {
    if (!timerActive || showResult) return
    if (timer <= 0) {
      handleAnswer(null)
      return
    }
    const t = setTimeout(() => setTimer(prev => prev - 1), 1000)
    return () => clearTimeout(t)
  }, [timer, timerActive, showResult])

  const generateQuestions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, topic, moduleId, count: questionCount, adaptive, previousScores })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setQuestions(data.quiz.questions)
      setTimerActive(true)
      setTimer(30)
    } catch (err) {
      setError("Impossible de générer le quiz. Vérifiez votre connexion.")
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = useCallback((answer: string | null) => {
    if (showResult) return
    const q = questions[currentIndex]
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    const userAnswer = answer || userInput.trim()
    const isCorrect = userAnswer.toLowerCase().trim() === q.correct.toLowerCase().trim()

    setSelectedAnswer(userAnswer || "")
    setShowResult(true)
    setTimerActive(false)

    const newAnswer = { questionId: q.id, correct: isCorrect, timeSpent }
    setAnswers(prev => [...prev, newAnswer])
  }, [questions, currentIndex, showResult, questionStartTime, userInput])

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setUserInput("")
      setShowResult(false)
      setShowHint(false)
      setTimer(30)
      setTimerActive(true)
      setQuestionStartTime(Date.now())
    } else {
      const totalScore = answers.filter(a => a.correct).length * 10
      const maxScore = questions.length * 10
      const percentage = Math.round(totalScore / maxScore * 100)
      const result: QuizResult = {
        totalScore, maxScore, percentage,
        passed: percentage >= 60,
        correctCount: answers.filter(a => a.correct).length,
        wrongCount: answers.filter(a => !a.correct).length,
        timeSpent: Math.round((Date.now() - quizStartTime) / 1000),
        answers
      }
      setFinalResult(result)
      setQuizComplete(true)
      onComplete?.(result)
    }
  }, [currentIndex, questions, answers, quizStartTime, onComplete])

  const scoreColor = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#ef4444"

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60, fontFamily: "'DM Mono',monospace" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⚙️</div>
      <p style={{ color: "#10b981", fontSize: 13 }}>
        {adaptive ? "Adaptation du niveau en cours..." : "Génération du quiz..."}
      </p>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4 }}>
        Propulsé par Gemini IA
      </p>
    </div>
  )

  if (error) return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>⚠️ {error}</p>
      <button onClick={generateQuestions} style={{
        padding: "10px 20px", borderRadius: 12,
        background: "linear-gradient(135deg,#10b981,#059669)",
        border: "none", color: "white", cursor: "pointer", fontSize: 13
      }}>
        🔄 Réessayer
      </button>
    </div>
  )

  if (quizComplete && finalResult) return (
    <div style={{ fontFamily: "'DM Mono',monospace", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>
          {finalResult.passed ? "🎉" : "📚"}
        </div>
        <div style={{
          fontSize: 56, fontWeight: 800,
          fontFamily: "'Syne',sans-serif",
          color: scoreColor(finalResult.percentage)
        }}>
          {finalResult.percentage}%
        </div>
        <p style={{ color: "white", fontSize: 16, fontWeight: 700, margin: "4px 0" }}>
          {finalResult.passed ? "Quiz réussi !" : "Continuez vos efforts !"}
        </p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>
          {finalResult.correctCount}/{questions.length} correctes · {Math.floor(finalResult.timeSpent / 60)}m {finalResult.timeSpent % 60}s
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Correctes", value: finalResult.correctCount, color: "#10b981", icon: "✅" },
          { label: "Erreurs", value: finalResult.wrongCount, color: "#ef4444", icon: "❌" },
          { label: "XP gagnés", value: `+${finalResult.correctCount * 10}`, color: "#f59e0b", icon: "⚡" },
        ].map((s, i) => (
          <div key={i} style={{
            textAlign: "center", padding: "14px 8px", borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)"
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'Syne',sans-serif" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => {
          setQuizComplete(false)
          setCurrentIndex(0)
          setAnswers([])
          setSelectedAnswer(null)
          setUserInput("")
          setShowResult(false)
          generateQuestions()
        }} style={{
          flex: 1, padding: "12px", borderRadius: 12,
          background: "linear-gradient(135deg,#10b981,#059669)",
          border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer"
        }}>
          🔄 Recommencer
        </button>
        {onClose && (
          <button onClick={onClose} style={{
            flex: 1, padding: "12px", borderRadius: 12,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer"
          }}>
            ← Retour
          </button>
        )}
      </div>
    </div>
  )

  const q = questions[currentIndex]
  if (!q) return null

  const isCorrect = selectedAnswer?.toLowerCase().trim() === q.correct.toLowerCase().trim()
  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <div style={{ fontFamily: "'DM Mono',monospace" }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              Question {currentIndex + 1}/{questions.length}
            </span>
            <span style={{
              fontSize: 9, padding: "2px 7px", borderRadius: 99,
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.2)",
              color: "#10b981", fontWeight: 700
            }}>
              {q.level}
            </span>
            <span style={{
              fontSize: 9, padding: "2px 7px", borderRadius: 99,
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.4)"
            }}>
              {q.topic}
            </span>
            {adaptive && (
              <span style={{
                fontSize: 9, padding: "2px 7px", borderRadius: 99,
                background: "rgba(59,130,246,0.12)",
                color: "#60a5fa"
              }}>
                🧠 Adaptatif
              </span>
            )}
          </div>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: timer <= 10 ? "#ef4444" : timer <= 20 ? "#f59e0b" : "#10b981"
          }}>
            ⏱ {timer}s
          </div>
        </div>

        {/* Barre progression */}
        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: "linear-gradient(90deg,#059669,#10b981)",
            borderRadius: 99, transition: "width 0.3s ease"
          }} />
        </div>
      </div>

      {/* Difficulté */}
      <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{
            width: 16, height: 4, borderRadius: 99,
            background: i < q.difficulty ? "#10b981" : "rgba(255,255,255,0.08)"
          }} />
        ))}
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginLeft: 6 }}>
          Difficulté {q.difficulty}/5
        </span>
      </div>

      {/* Question */}
      <div style={{
        padding: "16px 20px", borderRadius: 14, marginBottom: 16,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)"
      }}>
        <p style={{ color: "white", fontSize: 15, margin: 0, lineHeight: 1.6, fontWeight: 600 }}>
          {q.question_fr}
        </p>
        {q.question_de && (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "6px 0 0", fontStyle: "italic" }}>
            {q.question_de}
          </p>
        )}
      </div>

      {/* Réponses QCM / Vrai-Faux */}
      {(q.type === "qcm" || q.type === "vrai_faux") && q.options && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {q.options.map((opt, i) => {
            const isSelected = selectedAnswer === opt
            const isCorrectOpt = opt.toLowerCase() === q.correct.toLowerCase()
            let bg = "rgba(255,255,255,0.04)"
            let border = "1px solid rgba(255,255,255,0.08)"
            let color = "rgba(255,255,255,0.7)"

            if (showResult) {
              if (isCorrectOpt) { bg = "rgba(16,185,129,0.12)"; border = "1px solid rgba(16,185,129,0.3)"; color = "#10b981" }
              else if (isSelected && !isCorrectOpt) { bg = "rgba(239,68,68,0.1)"; border = "1px solid rgba(239,68,68,0.3)"; color = "#ef4444" }
            } else if (isSelected) {
              bg = "rgba(16,185,129,0.08)"; border = "1px solid rgba(16,185,129,0.2)"
            }

            return (
              <button key={i} onClick={() => !showResult && handleAnswer(opt)}
                disabled={showResult}
                style={{
                  padding: "12px 16px", borderRadius: 12, textAlign: "left",
                  background: bg, border, color,
                  cursor: showResult ? "not-allowed" : "pointer",
                  fontSize: 13, display: "flex", alignItems: "center", gap: 10,
                  transition: "all 0.15s"
                }}>
                <span style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: showResult && isCorrectOpt ? "#10b981" : "rgba(255,255,255,0.08)",
                  color: showResult && isCorrectOpt ? "white" : "inherit",
                  fontSize: 12, fontWeight: 700
                }}>
                  {showResult && isCorrectOpt ? "✓" : showResult && isSelected && !isCorrectOpt ? "✗" : String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      )}

      {/* Réponse texte libre */}
      {(q.type === "lacune" || q.type === "traduction") && (
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !showResult && handleAnswer(userInput)}
            disabled={showResult}
            placeholder={q.type === "lacune" ? "Complétez la phrase..." : "Traduisez en allemand..."}
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 12,
              background: showResult
                ? isCorrect ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)"
                : "rgba(255,255,255,0.05)",
              border: showResult
                ? isCorrect ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(239,68,68,0.3)"
                : "1px solid rgba(255,255,255,0.1)",
              color: "white", fontSize: 14, outline: "none",
              fontFamily: "inherit", boxSizing: "border-box"
            }}
          />
          {!showResult && (
            <button onClick={() => handleAnswer(userInput)}
              style={{
                marginTop: 8, width: "100%", padding: "10px",
                borderRadius: 12, background: "linear-gradient(135deg,#10b981,#059669)",
                border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer"
              }}>
              Valider →
            </button>
          )}
        </div>
      )}

      {/* Feedback */}
      {showResult && (
        <div style={{
          padding: "12px 16px", borderRadius: 12, marginBottom: 14,
          background: isCorrect ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
          border: isCorrect ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(239,68,68,0.2)"
        }}>
          <p style={{ color: isCorrect ? "#10b981" : "#ef4444", fontSize: 13, fontWeight: 700, margin: "0 0 4px" }}>
            {isCorrect ? "✅ Correct !" : `❌ Incorrect — Réponse : ${q.correct}`}
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>
            {q.explanation_fr}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        {!showResult && (
          <button onClick={() => setShowHint(!showHint)} style={{
            padding: "10px 14px", borderRadius: 12,
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
            color: "#f59e0b", fontSize: 12, cursor: "pointer"
          }}>
            💡 Indice
          </button>
        )}
        {showResult && (
          <button onClick={handleNext} style={{
            flex: 1, padding: "12px", borderRadius: 12,
            background: "linear-gradient(135deg,#10b981,#059669)",
            border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Syne',sans-serif"
          }}>
            {currentIndex < questions.length - 1 ? "Question suivante →" : "Voir les résultats 🏆"}
          </button>
        )}
        {!showResult && q.type !== "qcm" && q.type !== "vrai_faux" && (
          <button onClick={() => handleAnswer(userInput)} style={{
            flex: 1, padding: "10px 14px", borderRadius: 12,
            background: "linear-gradient(135deg,#10b981,#059669)",
            border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer"
          }}>
            Valider →
          </button>
        )}
      </div>

      {/* Indice */}
      {showHint && (
        <div style={{
          marginTop: 10, padding: "10px 14px", borderRadius: 10,
          background: "rgba(245,158,11,0.06)",
          border: "1px solid rgba(245,158,11,0.15)",
          color: "#f59e0b", fontSize: 12
        }}>
          💡 {q.hint_fr}
        </div>
      )}
    </div>
  )
}
