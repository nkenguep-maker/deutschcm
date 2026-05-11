import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion"

interface Word {
  de: string
  fr: string
  article: string | null
  example: string
}

interface VocabularySlideProps {
  words: Word[]
  level: string
  title: string
}

export const VocabularySlide = ({ words, level, title }: VocabularySlideProps) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const framesPerWord = 90

  const currentWordIndex = Math.min(
    Math.floor(frame / framesPerWord),
    words.length - 1
  )

  const wordProgress = (frame % framesPerWord) / framesPerWord

  return (
    <AbsoluteFill style={{
      backgroundColor: "#080c10",
      fontFamily: "sans-serif",
      padding: "60px 80px"
    }}>
      {/* Background */}
      <AbsoluteFill style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: "60px 60px"
      }} />

      {/* Header */}
      <div style={{ marginBottom: 40, zIndex: 10 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "5px 16px", borderRadius: 99,
          background: "rgba(16,185,129,0.15)",
          border: "1px solid rgba(16,185,129,0.3)",
          marginBottom: 12
        }}>
          <span style={{ color: "#10b981", fontSize: 16, fontWeight: 700 }}>
            📖 Vocabulaire · Niveau {level}
          </span>
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "white" }}>{title}</div>
      </div>

      {/* Word display */}
      {words.map((word, i) => {
        const wordFrame = frame - i * framesPerWord
        const opacity = spring({ frame: wordFrame, fps, config: { damping: 20 } })
        const y = interpolate(spring({ frame: wordFrame, fps }), [0, 1], [30, 0])

        if (wordFrame < 0 || wordFrame > framesPerWord + 30) return null

        return (
          <div key={i} style={{
            opacity,
            position: "absolute", top: "50%", left: "80px", right: "80px",
            transform: `translateY(calc(-50% + ${y}px))`,
            zIndex: 10
          }}>
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: 24, padding: "40px 48px"
            }}>
              <div style={{ fontSize: 80, fontWeight: 900, color: "#10b981", marginBottom: 16 }}>
                {word.article ? `${word.article} ` : ""}{word.de}
              </div>
              <div style={{ fontSize: 36, color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
                {word.fr}
              </div>
              <div style={{
                fontSize: 22, color: "rgba(255,255,255,0.4)",
                fontStyle: "italic",
                borderLeft: "3px solid rgba(16,185,129,0.3)",
                paddingLeft: 20
              }}>
                {word.example}
              </div>
            </div>

            {/* Progress dots */}
            <div style={{
              display: "flex", justifyContent: "center", gap: 8, marginTop: 24
            }}>
              {words.map((_, j) => (
                <div key={j} style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: j === i ? "#10b981" : "rgba(255,255,255,0.15)"
                }} />
              ))}
            </div>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}
