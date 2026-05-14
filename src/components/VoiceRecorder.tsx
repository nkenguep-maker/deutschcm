"use client";
import { useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

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
  placeholder = "Appuyez sur le micro et parlez en allemand…",
}: VoiceRecorderProps) {
  const { isListening, transcript, interimTranscript, error, isSupported, startListening, stopListening, resetTranscript } =
    useSpeechRecognition("de-DE");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleStop = async () => {
    stopListening();
    const text = transcript.trim();
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
        setApiError(data.error || "Erreur d'analyse");
      }
    } catch {
      setApiError("Impossible de contacter l'API");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    resetTranscript();
    setAnalysis(null);
    setApiError(null);
  };

  if (!isSupported) {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        La reconnaissance vocale n'est pas supportée par votre navigateur. Utilisez Chrome ou Edge.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Coming soon banner */}
      <div style={{padding:16, borderRadius:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", textAlign:"center"}}>
        <p style={{color:"#f59e0b", fontSize:13, margin:0}}>
          🎙️ Correction vocale IA — Bientôt disponible
        </p>
        <p style={{color:"rgba(255,255,255,0.4)", fontSize:11, margin:"6px 0 0"}}>
          L&apos;enregistrement vocal sera actif dans la prochaine mise à jour.
        </p>
      </div>
      {/* Mic button + waveform */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={isListening ? handleStop : startListening}
          disabled={analyzing}
          className={`relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-all ${
            isListening
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-600 hover:bg-blue-700"
          } disabled:opacity-50`}
        >
          {analyzing ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : isListening ? (
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-7 10a7 7 0 0 0 14 0h2a9 9 0 0 1-8 8.94V22h-2v-2.06A9 9 0 0 1 3 11H5z" />
            </svg>
          )}
          {isListening && (
            <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-30" />
          )}
        </button>

        {isListening && (
          <div className="flex items-end gap-0.5 h-6">
            {[...Array(12)].map((_, i) => (
              <span
                key={i}
                className="inline-block w-1 rounded-full bg-blue-500"
                style={{
                  animation: `waveBar 0.8s ease-in-out ${(i * 0.07).toFixed(2)}s infinite alternate`,
                  height: "4px",
                }}
              />
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500">
          {isListening ? "Enregistrement… cliquez pour arrêter et analyser" : analyzing ? "Analyse en cours…" : placeholder}
        </p>
      </div>

      {/* Transcript */}
      {(transcript || interimTranscript) && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
          <span className="text-gray-800">{transcript}</span>
          {interimTranscript && <span className="text-gray-400 italic"> {interimTranscript}</span>}
        </div>
      )}

      {/* Errors */}
      {(error || apiError) && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error || apiError}</p>
      )}

      {/* Analysis result */}
      {analysis && (
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          {/* Score grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                { label: "Global", value: analysis.score_global },
                { label: "Grammaire", value: analysis.score_grammaire },
                { label: "Vocabulaire", value: analysis.score_vocabulaire },
                { label: "Prononciation", value: analysis.score_prononciation },
              ] as const
            ).map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center rounded-lg bg-gray-50 p-3">
                <span className={`text-2xl font-bold ${value >= 7 ? "text-green-600" : value >= 5 ? "text-yellow-600" : "text-red-600"}`}>
                  {value}/10
                </span>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Positive feedback */}
          {analysis.feedback_positif_fr && (
            <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
              <span>✓</span>
              <span>{analysis.feedback_positif_fr}</span>
            </div>
          )}

          {/* Errors */}
          {analysis.errors.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-gray-700">Corrections</h4>
              {analysis.errors.map((err, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 text-sm ${err.severite === "majeur" ? "border-red-200 bg-red-50" : "border-yellow-100 bg-yellow-50"}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${err.severite === "majeur" ? "bg-red-200 text-red-800" : "bg-yellow-200 text-yellow-800"}`}>
                      {err.type}
                    </span>
                    <span className="line-through text-gray-400">{err.original}</span>
                    <span className="font-medium text-gray-800">→ {err.correction}</span>
                  </div>
                  <p className="mt-1 text-gray-600">{err.explication_fr}</p>
                </div>
              ))}
            </div>
          )}

          {/* Corrected text */}
          {analysis.texte_corrige && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm">
              <span className="font-medium text-blue-800">Texte corrigé : </span>
              <span className="text-blue-700">{analysis.texte_corrige}</span>
            </div>
          )}

          {/* Conseil */}
          {analysis.conseil_fr && (
            <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              <span>💡</span>
              <span>{analysis.conseil_fr}</span>
            </div>
          )}
        </div>
      )}

      {/* Reset */}
      {(transcript || analysis) && !isListening && (
        <button onClick={handleReset} className="self-center text-xs text-gray-400 hover:text-gray-600 underline">
          Recommencer
        </button>
      )}

      <style>{`
        @keyframes waveBar {
          from { height: 4px; }
          to { height: 20px; }
        }
      `}</style>
    </div>
  );
}
