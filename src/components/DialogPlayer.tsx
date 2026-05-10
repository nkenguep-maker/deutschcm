"use client"
import { useState } from "react"
import AudioPlayer from "./AudioPlayer"

export interface DialogLine {
  sprecher: string
  text: string
  translation?: string
  gender?: "male" | "female"
  accent?: "de" | "at" | "ch"
  pause_after_ms?: number
}

interface DialogPlayerProps {
  title: string
  context_fr: string
  lines: DialogLine[]
  onComplete?: () => void
}

export default function DialogPlayer({
  title,
  context_fr,
  lines,
  onComplete,
}: DialogPlayerProps) {
  const [currentLine, setCurrentLine] = useState<number | null>(null)
  const [showTranslations, setShowTranslations] = useState(false)
  const [completed, setCompleted] = useState(false)

  const handleLineEnd = (index: number) => {
    if (index < lines.length - 1) {
      setTimeout(() => setCurrentLine(index + 1),
        lines[index].pause_after_ms || 600)
    } else {
      setCurrentLine(null)
      setCompleted(true)
      onComplete?.()
    }
  }

  const handlePlayAll = () => {
    setCurrentLine(0)
    setCompleted(false)
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, padding: 20,
      fontFamily: "'DM Mono', monospace"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12
      }}>
        <div>
          <h3 style={{
            color: "white",
            fontFamily: "'Syne',sans-serif",
            fontSize: 15, fontWeight: 700, margin: "0 0 4px"
          }}>
            🎧 {title}
          </h3>
          <p style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 11, margin: 0
          }}>
            {context_fr}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => setShowTranslations(!showTranslations)}
            style={{
              padding: "5px 10px", borderRadius: 8, fontSize: 10,
              background: showTranslations
                ? "rgba(16,185,129,0.15)"
                : "rgba(255,255,255,0.05)",
              border: showTranslations
                ? "1px solid rgba(16,185,129,0.3)"
                : "1px solid rgba(255,255,255,0.08)",
              color: showTranslations ? "#10b981" : "rgba(255,255,255,0.4)",
              cursor: "pointer"
            }}
          >
            🇫🇷 Traduction
          </button>
          <button
            onClick={handlePlayAll}
            style={{
              padding: "5px 12px", borderRadius: 8, fontSize: 10,
              fontWeight: 700,
              background: "linear-gradient(135deg,#10b981,#059669)",
              border: "none", color: "white", cursor: "pointer"
            }}
          >
            ▶ Tout écouter
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            display: "flex", gap: 10, alignItems: "flex-start",
            padding: "10px 12px", borderRadius: 10,
            background: currentLine === i
              ? "rgba(16,185,129,0.08)"
              : "rgba(255,255,255,0.02)",
            border: currentLine === i
              ? "1px solid rgba(16,185,129,0.2)"
              : "1px solid transparent",
            transition: "all 0.2s"
          }}>
            <AudioPlayer
              text={line.text}
              gender={line.gender || (i % 2 === 0 ? "female" : "male")}
              accent={line.accent || "de"}
              rate="0.85"
              autoPlay={currentLine === i}
              onEnd={() => handleLineEnd(i)}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  color: i % 2 === 0 ? "#10b981" : "#60a5fa",
                  textTransform: "uppercase", letterSpacing: "0.08em"
                }}>
                  {line.sprecher}
                </span>
                {currentLine === i && (
                  <span style={{ fontSize: 9, color: "#10b981" }}>
                    ● diffusion...
                  </span>
                )}
              </div>
              <p style={{
                color: "white", fontSize: 13, margin: 0,
                lineHeight: 1.5
              }}>
                {line.text}
              </p>
              {showTranslations && line.translation && (
                <p style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 11, margin: "4px 0 0",
                  fontStyle: "italic"
                }}>
                  {line.translation}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {completed && (
        <div style={{
          marginTop: 12, padding: "8px 12px",
          borderRadius: 8,
          background: "rgba(16,185,129,0.08)",
          border: "1px solid rgba(16,185,129,0.2)",
          color: "#10b981", fontSize: 12, textAlign: "center"
        }}>
          ✅ Dialogue terminé — Vous pouvez réécouter ou passer aux exercices
        </div>
      )}
    </div>
  )
}
