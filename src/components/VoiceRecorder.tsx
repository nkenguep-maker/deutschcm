"use client";
import { useState } from "react";

interface VoiceRecorderProps {
  level?: string;
  expectedText?: string;
  exerciseType?: string;
  onResult?: (analysis: AnalysisResult, transcript: string) => void;
  placeholder?: string;
}

interface ErrorItem {
  type: string;
  original: string;
  correction: string;
  explication_fr: string;
  severite: "mineur" | "majeur";
}

interface AnalysisResult {
  score_global: number;
  score_grammaire: number;
  score_vocabulaire: number;
  score_prononciation: number;
  errors: ErrorItem[];
  texte_corrige: string;
  feedback_positif_fr: string;
  conseil_fr: string;
  peut_continuer: boolean;
}

export default function VoiceRecorder({
  level = "A1",
  expectedText,
  exerciseType = "expression_libre",
  onResult,
  placeholder = "Écrivez votre réponse en allemand…",
}: VoiceRecorderProps) {
  const [typedText, setTypedText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    const text = typedText.trim();
    if (!text) return;
    setAnalyzing(true);
    setApiError(null);
    try {
      const res = await fetch("/api/speech/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, expectedText, level, exerciseType }),
      });
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.analysis);
        onResult?.(data.analysis, text);
      } else {
        setApiError(data.error || "Le coach IA n'est pas disponible pour le moment. Réessayez dans quelques instants.");
      }
    } catch {
      setApiError("Le coach IA n'est pas disponible pour le moment. Réessayez dans quelques instants.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setTypedText("");
    setAnalysis(null);
    setApiError(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Coming-soon banner for voice recording */}
      <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <p style={{ color: "#f59e0b", fontSize: 13, margin: "0 0 4px", fontWeight: 600 }}>
          🎙️ Analyse vocale — bientôt disponible
        </p>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: 0, lineHeight: 1.55 }}>
          L&apos;analyse de la voix sera disponible dans une prochaine mise à jour.
          En attendant, écrivez votre réponse ci-dessous.
        </p>
      </div>

      {/* Typed input as fallback */}
      <div>
        <textarea
          value={typedText}
          onChange={e => setTypedText(e.target.value)}
          placeholder={placeholder}
          rows={4}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: "12px 14px",
            color: "white",
            fontSize: 14,
            resize: "vertical",
            outline: "none",
            lineHeight: 1.7,
            fontFamily: "'DM Mono', monospace",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleAnalyze}
          disabled={analyzing || !typedText.trim()}
          style={{
            padding: "10px 20px", borderRadius: 12,
            background: analyzing || !typedText.trim()
              ? "rgba(255,255,255,0.05)"
              : "linear-gradient(135deg,#10b981,#059669)",
            border: "none",
            color: analyzing || !typedText.trim() ? "rgba(255,255,255,0.3)" : "white",
            fontSize: 13, fontWeight: 700,
            cursor: analyzing || !typedText.trim() ? "not-allowed" : "pointer",
          }}
        >
          {analyzing ? "⏳ Analyse en cours…" : "✨ Analyser avec IA"}
        </button>

        {(typedText || analysis) && (
          <button
            onClick={handleReset}
            style={{
              padding: "10px 16px", borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer",
            }}
          >
            🔄 Recommencer
          </button>
        )}
      </div>

      {/* Error state */}
      {apiError && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <p style={{ color: "#f59e0b", fontSize: 13, margin: 0 }}>⚠️ {apiError}</p>
        </div>
      )}

      {/* Analysis result */}
      {analysis && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Scores */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Global", value: analysis.score_global },
              { label: "Grammaire", value: analysis.score_grammaire },
              { label: "Vocabulaire", value: analysis.score_vocabulaire },
              { label: "Prononciation", value: analysis.score_prononciation },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: value >= 7 ? "#10b981" : value >= 5 ? "#f59e0b" : "#ef4444" }}>
                  {value}/10
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Feedback positif */}
          {analysis.feedback_positif_fr && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", fontSize: 13 }}>
              ✅ {analysis.feedback_positif_fr}
            </div>
          )}

          {/* Errors */}
          {analysis.errors.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                Corrections ({analysis.errors.length})
              </p>
              {analysis.errors.map((err, i) => (
                <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: err.severite === "majeur" ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${err.severite === "majeur" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}` }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: err.severite === "majeur" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)", color: err.severite === "majeur" ? "#ef4444" : "#f59e0b", fontWeight: 700, textTransform: "uppercase" as const }}>
                      {err.type}
                    </span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "line-through" }}>{err.original}</span>
                    <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>→ {err.correction}</span>
                  </div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0 }}>{err.explication_fr}</p>
                </div>
              ))}
            </div>
          )}

          {/* Corrected text */}
          {analysis.texte_corrige && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <span style={{ fontSize: 10, color: "#818cf8", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Texte corrigé </span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{analysis.texte_corrige}</span>
            </div>
          )}

          {/* Conseil */}
          {analysis.conseil_fr && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
              💡 {analysis.conseil_fr}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
