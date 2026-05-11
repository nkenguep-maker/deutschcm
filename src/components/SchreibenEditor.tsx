"use client"
import { useState } from "react"

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
  exerciseType = "expression_libre",
  minWords = 20,
  maxWords = 100,
  example,
  onComplete,
}: SchreibenEditorProps) {
  const [text, setText] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [correction, setCorrection] = useState<any>(null)
  const [showModel, setShowModel] = useState(false)
  const [showErrors, setShowErrors] = useState(true)
  const [activeTab, setActiveTab] = useState<"correction"|"conseils"|"modele">("correction")

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const charCount = text.length
  const isReady = wordCount >= minWords

  const handleAnalyze = async () => {
    if (!text.trim()) return
    setAnalyzing(true)
    setCorrection(null)
    try {
      const res = await fetch("/api/schreiben/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, task, level, exerciseType }),
      })
      const data = await res.json()
      if (data.success) {
        setCorrection(data.correction)
        onComplete?.(data.correction.score_global, text)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setAnalyzing(false)
    }
  }

  const scoreColor = (s: number) =>
    s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#ef4444"

  const scoreLabel = (s: number) =>
    s >= 80 ? "Excellent" : s >= 60 ? "Bien" : s >= 40 ? "À améliorer" : "Insuffisant"

  const typeColors: Record<string, string> = {
    grammaire: "rgba(239,68,68,0.15)",
    orthographe: "rgba(245,158,11,0.15)",
    vocabulaire: "rgba(59,130,246,0.15)",
    style: "rgba(139,92,246,0.15)",
    ponctuation: "rgba(107,114,128,0.15)",
  }

  const typeTextColors: Record<string, string> = {
    grammaire: "#ef4444",
    orthographe: "#f59e0b",
    vocabulaire: "#60a5fa",
    style: "#a78bfa",
    ponctuation: "#9ca3af",
  }

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
            lineHeight: 1.7, transition: "border-color 0.2s",
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
        <button
          onClick={handleAnalyze}
          disabled={analyzing || !text.trim()}
          style={{
            padding: "10px 20px", borderRadius: 12,
            background: analyzing || !text.trim()
              ? "rgba(255,255,255,0.05)"
              : "linear-gradient(135deg,#10b981,#059669)",
            border: "none", color: analyzing || !text.trim()
              ? "rgba(255,255,255,0.3)" : "white",
            fontSize: 13, fontWeight: 700,
            cursor: analyzing || !text.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 6
          }}
        >
          {analyzing ? "⏳ Analyse en cours..." : "✨ Corriger avec IA"}
        </button>

        {text && (
          <button
            onClick={() => { setText(""); setCorrection(null) }}
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

      {/* Exemple */}
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

      {/* Résultats */}
      {correction && (
        <div style={{
          borderRadius: 16,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden"
        }}>
          {/* Score global */}
          <div style={{
            padding: "20px 24px",
            background: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", gap: 20
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 36, fontWeight: 800,
                fontFamily: "'Syne',sans-serif",
                color: scoreColor(correction.score_global)
              }}>
                {correction.score_global}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>/ 100</div>
            </div>
            <div>
              <div style={{
                fontSize: 16, fontWeight: 700,
                fontFamily: "'Syne',sans-serif",
                color: scoreColor(correction.score_global),
                marginBottom: 4
              }}>
                {scoreLabel(correction.score_global)}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                Niveau détecté : {correction.niveau_detecte}
              </div>
            </div>
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {Object.entries(correction.scores || {}).map(([key, val]) => (
                <div key={key} style={{
                  padding: "6px 10px", borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)"
                }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", textTransform: "capitalize" }}>
                    {key}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: scoreColor((val as number) * 4) }}>
                    {val as number}/25
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback positif */}
          {correction.feedback_positif_fr && (
            <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.15)",
                color: "#34d399", fontSize: 12
              }}>
                ✅ {correction.feedback_positif_fr}
              </div>
            </div>
          )}

          {/* Onglets */}
          <div style={{
            display: "flex", gap: 0,
            borderBottom: "1px solid rgba(255,255,255,0.06)"
          }}>
            {[
              { key: "correction", label: `📝 Corrections (${correction.errors?.length || 0})` },
              { key: "conseils", label: "💡 Conseils" },
              { key: "modele", label: "🏆 Modèle" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as "correction"|"conseils"|"modele")}
                style={{
                  flex: 1, padding: "10px 8px", fontSize: 11, fontWeight: 600,
                  background: activeTab === tab.key
                    ? "rgba(16,185,129,0.1)" : "transparent",
                  borderBottom: activeTab === tab.key
                    ? "2px solid #10b981" : "2px solid transparent",
                  color: activeTab === tab.key
                    ? "#10b981" : "rgba(255,255,255,0.4)",
                  border: "none", cursor: "pointer"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 20 }}>

            {/* Onglet corrections */}
            {activeTab === "correction" && (
              <div>
                {/* Texte corrigé */}
                {correction.texte_corrige && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                      Version corrigée
                    </p>
                    <div style={{
                      padding: "12px 16px", borderRadius: 10,
                      background: "rgba(16,185,129,0.06)",
                      border: "1px solid rgba(16,185,129,0.15)",
                      color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.7
                    }}>
                      {correction.texte_corrige}
                    </div>
                  </div>
                )}

                {/* Erreurs */}
                {correction.errors?.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>
                      Erreurs détectées ({correction.errors.length})
                    </p>
                    {correction.errors.map((err: any, i: number) => (
                      <div key={i} style={{
                        padding: "10px 14px", borderRadius: 10,
                        background: typeColors[err.type] || "rgba(255,255,255,0.04)",
                        border: `1px solid ${typeTextColors[err.type] || "rgba(255,255,255,0.08)"}40`
                      }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: 9, padding: "1px 6px", borderRadius: 4,
                            background: `${typeTextColors[err.type] || "#888"}20`,
                            color: typeTextColors[err.type] || "#888",
                            fontWeight: 700, textTransform: "uppercase"
                          }}>
                            {err.type}
                          </span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textDecoration: "line-through" }}>
                            {err.original}
                          </span>
                          <span style={{ fontSize: 11, color: "#10b981" }}>→ {err.correction}</span>
                          {err.severite === "majeur" && (
                            <span style={{ fontSize: 9, color: "#ef4444" }}>⚠ majeur</span>
                          )}
                        </div>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0 }}>
                          {err.explication_fr}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: "16px", borderRadius: 10, textAlign: "center",
                    background: "rgba(16,185,129,0.06)",
                    border: "1px solid rgba(16,185,129,0.15)",
                    color: "#10b981", fontSize: 13
                  }}>
                    🎉 Aucune erreur détectée — Excellent travail !
                  </div>
                )}
              </div>
            )}

            {/* Onglet conseils */}
            {activeTab === "conseils" && (
              <div>
                {correction.conseil_principal_fr && (
                  <div style={{
                    padding: "12px 16px", borderRadius: 10, marginBottom: 14,
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    color: "#f59e0b", fontSize: 13
                  }}>
                    💡 {correction.conseil_principal_fr}
                  </div>
                )}
                {correction.conseils_fr?.map((c: string, i: number) => (
                  <div key={i} style={{
                    padding: "8px 12px", borderRadius: 8, marginBottom: 6,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.6)", fontSize: 12,
                    display: "flex", gap: 8
                  }}>
                    <span style={{ color: "#10b981" }}>{i + 1}.</span> {c}
                  </div>
                ))}
                {correction.structures_a_retenir?.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                      Structures à retenir
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {correction.structures_a_retenir.map((s: string, i: number) => (
                        <span key={i} style={{
                          padding: "4px 10px", borderRadius: 99, fontSize: 11,
                          background: "rgba(16,185,129,0.1)",
                          border: "1px solid rgba(16,185,129,0.2)",
                          color: "#34d399"
                        }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Onglet modèle */}
            {activeTab === "modele" && (
              <div>
                {correction.exemple_modele && (
                  <div>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                      Exemple de réponse modèle
                    </p>
                    <div style={{
                      padding: "14px 16px", borderRadius: 10,
                      background: "rgba(16,185,129,0.06)",
                      border: "1px solid rgba(16,185,129,0.15)",
                      color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.8
                    }}>
                      {correction.exemple_modele}
                    </div>
                  </div>
                )}
                {correction.mots_bien_utilises?.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                      Mots bien utilisés ✅
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {correction.mots_bien_utilises.map((m: string, i: number) => (
                        <span key={i} style={{
                          padding: "3px 10px", borderRadius: 99, fontSize: 11,
                          background: "rgba(16,185,129,0.12)",
                          border: "1px solid rgba(16,185,129,0.25)",
                          color: "#10b981"
                        }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
