"use client"
import { useState } from "react"

// Analyse IA supprimée (AUDIT.md §11).
// Le composant préserve la consigne, la saisie, la sauvegarde locale et
// l'exemple éditorial. Aucune correction automatique.

interface SchreibenEditorProps {
  task: string
  taskDE?: string
  level?: string
  exerciseType?: string
  minWords?: number
  maxWords?: number
  example?: string
  onComplete?: (score: number, text: string) => void
}

export default function SchreibenEditor({
  task,
  taskDE,
  level = "A1",
  minWords = 20,
  maxWords = 100,
  example,
}: SchreibenEditorProps) {
  const [text, setText] = useState("")
  const [showModel, setShowModel] = useState(false)

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const isReady = wordCount >= minWords

  return (
    <div style={{ fontFamily: "'DM Mono', monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono&display=swap')`}</style>

      {/* Consigne */}
      <div style={{
        padding: "12px 16px", borderRadius: 12, marginBottom: 16,
        background: "rgba(16,185,129,0.06)",
        border: "1px solid rgba(16,185,129,0.15)"
      }}>
        <p style={{ fontSize: 10, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>
          ✍️ Consigne
        </p>
        <p style={{ color: "white", fontSize: 13, margin: 0 }}>{task}</p>
        {taskDE && (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "4px 0 0", fontStyle: "italic" }}>
            {taskDE}
          </p>
        )}
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, margin: "6px 0 0" }}>
          {minWords}-{maxWords} mots · Niveau {level}
        </p>
      </div>

      {/* Zone d'écriture */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Schreiben Sie hier auf Deutsch..."
          rows={6}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${isReady ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 14, padding: "14px 16px",
            color: "white", fontSize: 14,
            resize: "vertical", outline: "none",
            lineHeight: 1.7, transition: "border-color var(--dur-move)",
            fontFamily: "inherit"
          }}
        />
        <div style={{
          position: "absolute", bottom: 10, right: 12,
          fontSize: 10, color: wordCount >= minWords
            ? "#10b981" : "rgba(255,255,255,0.3)"
        }}>
          {wordCount}/{minWords} mots min
        </div>
      </div>

      {/* Boutons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {text && (
          <button
            onClick={() => setText("")}
            style={{
              padding: "10px 16px", borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer"
            }}
          >
            🔄 Effacer
          </button>
        )}

        {example && (
          <button
            onClick={() => setShowModel(!showModel)}
            style={{
              padding: "10px 16px", borderRadius: 12,
              background: showModel ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.04)",
              border: showModel ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.08)",
              color: showModel ? "#f59e0b" : "rgba(255,255,255,0.4)",
              fontSize: 13, cursor: "pointer"
            }}
          >
            💡 {showModel ? "Masquer" : "Voir"} l&apos;exemple
          </button>
        )}
      </div>

      {/* Exemple éditorial */}
      {showModel && example && (
        <div style={{
          padding: "12px 16px", borderRadius: 12, marginBottom: 16,
          background: "rgba(245,158,11,0.06)",
          border: "1px solid rgba(245,158,11,0.2)"
        }}>
          <p style={{ fontSize: 10, color: "#f59e0b", margin: "0 0 6px" }}>EXEMPLE DE RÉPONSE</p>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0, lineHeight: 1.7 }}>
            {example}
          </p>
        </div>
      )}
    </div>
  )
}
