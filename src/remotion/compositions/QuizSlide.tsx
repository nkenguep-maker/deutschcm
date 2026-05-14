import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion"

interface QuizSlideProps {
  question: string
  options: string[]
  correct: number
  explanation: string
  level: string
}

export const QuizSlide = ({
  question, options, correct, explanation, level
}: QuizSlideProps) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const showAnswer = frame > 90

  const questionAnim = spring({ frame, fps, config: { damping: 20 }, delay: 5 })
  const answerAnim = spring({ frame: frame - 90, fps, config: { damping: 20 } })

  return (
    <AbsoluteFill style={{
      backgroundColor: "#080c10",
      fontFamily: "sans-serif",
      padding: "60px 80px",
      justifyContent: "center"
    }}>
      <AbsoluteFill style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: "60px 60px"
      }} />

      <div style={{ zIndex: 10 }}>
        <div style={{
          opacity: questionAnim,
          display: "inline-flex", gap: 8, alignItems: "center",
          padding: "5px 16px", borderRadius: 99,
          background: "rgba(16,185,129,0.12)",
          border: "1px solid rgba(16,185,129,0.25)",
          marginBottom: 24
        }}>
          <span style={{ color: "#10b981", fontSize: 16 }}>❓ Quiz · {level}</span>
        </div>

        <div style={{
          opacity: questionAnim,
          fontSize: 36, fontWeight: 700, color: "white",
          marginBottom: 40, lineHeight: 1.4
        }}>
          {question}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {options.map((opt, i) => {
            const isCorrect = i === correct
            const optAnim = spring({ frame, fps, delay: 10 + i * 5 })
            return (
              <div key={i} style={{
                opacity: optAnim,
                transform: `translateY(${interpolate(optAnim,[0,1],[20,0])}px)`,
                padding: "20px 28px", borderRadius: 14,
                background: showAnswer && isCorrect
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(255,255,255,0.04)",
                border: showAnswer && isCorrect
                  ? "2px solid rgba(16,185,129,0.4)"
                  : "1px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", gap: 12
              }}>
                <span style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: showAnswer && isCorrect
                    ? "#10b981" : "rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontSize: 14, fontWeight: 700, flexShrink: 0
                }}>
                  {showAnswer && isCorrect ? "✓" : String.fromCharCode(65 + i)}
                </span>
                <span style={{
                  color: showAnswer && isCorrect ? "#10b981" : "rgba(255,255,255,0.7)",
                  fontSize: 18, fontWeight: showAnswer && isCorrect ? 700 : 400
                }}>
                  {opt}
                </span>
              </div>
            )
          })}
        </div>

        {showAnswer && (
          <div style={{
            opacity: answerAnim,
            marginTop: 32, padding: "16px 24px", borderRadius: 12,
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.2)",
            color: "rgba(255,255,255,0.7)", fontSize: 18,
            fontStyle: "italic"
          }}>
            💡 {explanation}
          </div>
        )}
      </div>
    </AbsoluteFill>
  )
}
