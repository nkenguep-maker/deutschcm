"use client";
import { useState } from "react";

// Analyse IA supprimée (AUDIT.md §11).
// Le composant conserve la saisie locale libre (fallback texte). Aucun envoi
// automatique vers un service — pas d'analyse, pas de score, pas de coach IA.

interface VoiceRecorderProps {
  level?: string;
  expectedText?: string;
  exerciseType?: string;
  placeholder?: string;
}

export default function VoiceRecorder({
  placeholder = "Écrivez votre réponse en allemand…",
}: VoiceRecorderProps) {
  const [typedText, setTypedText] = useState("");

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

      {typedText && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setTypedText("")}
            style={{
              padding: "10px 16px", borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer",
            }}
          >
            🔄 Effacer
          </button>
        </div>
      )}
    </div>
  );
}
