"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Breakdown { [level: string]: { correct: number; total: number } }
interface Result { level: string; score: number; breakdown: Breakdown; totalCorrect?: number; total?: number }

const LEVEL_COLORS: Record<string, string> = {
  A1: "#10b981", A2: "#34d399", B1: "#6366f1", B2: "#8b5cf6", C1: "#f59e0b",
};
const LEVEL_LABELS: Record<string, string> = {
  A1: "Débutant", A2: "Élémentaire", B1: "Intermédiaire", B2: "Intermédiaire supérieur", C1: "Avancé",
};
const LEVEL_MESSAGES: Record<string, string> = {
  A1: "Vous débutez en allemand. Commencez par les fondamentaux : alphabet, salutations, chiffres et présentations. Avec 15-30 min par jour, vous atteindrez A2 en 3 mois !",
  A2: "Vous maîtrisez les bases. Vous pouvez vous présenter et comprendre des phrases simples. Place maintenant aux conjugaisons, aux articles et au vocabulaire quotidien.",
  B1: "Bon niveau intermédiaire ! Vous pouvez gérer la plupart des situations courantes. Concentrez-vous sur le Perfekt, le Konjunktiv et l'enrichissement du vocabulaire.",
  B2: "Excellent niveau ! Vous communiquez avec aisance. Travaillez la grammaire avancée et les nuances culturelles pour viser le C1.",
  C1: "Niveau avancé. Vous maîtrisez l'allemand dans des contextes complexes. Préparez-vous au Goethe C1 ou visez la maîtrise complète.",
};
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

function levelIcon(correct: number, total: number) {
  const pct = total === 0 ? 0 : correct / total;
  if (pct >= 0.67) return { icon: "✅", color: "#10b981" };
  if (pct >= 0.33) return { icon: "⚠️", color: "#f59e0b" };
  return { icon: "❌", color: "#ef4444" };
}

export default function TestResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);
  const [attempts, setAttempts] = useState<number | null>(null);
  const [animated, setAnimated] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("testResult");
    if (!raw) { router.push("/test-niveau"); return; }
    setResult(JSON.parse(raw) as Result);
    setTimeout(() => setAnimated(true), 200);

    fetch("/api/test-niveau/attempts")
      .then(r => r.json())
      .then(d => setAttempts(d.attempts ?? 0))
      .catch(() => setAttempts(0));
  }, [router]);

  const accept = async () => {
    setAccepting(true);
    sessionStorage.removeItem("testResult");
    router.push("/dashboard");
  };

  const retake = () => {
    sessionStorage.removeItem("testResult");
    router.push("/test-niveau");
  };

  if (!result) return (
    <div style={{ minHeight: "100vh", background: "#080c10", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Chargement…</div>
    </div>
  );

  const levelColor = LEVEL_COLORS[result.level] ?? "#10b981";
  const canRetake = attempts !== null && attempts < 2;

  return (
    <div style={{ minHeight: "100vh", background: "#080c10", padding: "40px 24px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.7);}to{opacity:1;transform:scale(1);} }
        .fadeUp { animation: fadeUp 0.5s ease forwards; }
        .scaleIn { animation: scaleIn 0.6s cubic-bezier(.34,1.56,.64,1) forwards; }
      `}</style>

      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }} className="fadeUp">
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Test CEFR — Résultats officiels</div>
          <h1 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26 }}>
            Votre niveau d'allemand
          </h1>
        </div>

        {/* Big level badge */}
        <div className={animated ? "scaleIn" : ""} style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32, opacity: animated ? 1 : 0 }}>
          <div style={{
            width: 148, height: 148, borderRadius: "50%",
            background: `${levelColor}15`,
            border: `4px solid ${levelColor}`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 60px ${levelColor}40`,
          }}>
            <div style={{ color: levelColor, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 46, lineHeight: 1 }}>{result.level}</div>
            <div style={{ color: `${levelColor}bb`, fontSize: 12, fontWeight: 600, marginTop: 4 }}>
              {result.totalCorrect ?? "—"}/{result.total ?? 30} correct
            </div>
          </div>
          <div style={{ marginTop: 14, color: levelColor, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20 }}>
            {LEVEL_LABELS[result.level]}
          </div>
        </div>

        {/* Personal message */}
        <div style={{ background: `${levelColor}08`, border: `1px solid ${levelColor}20`, borderRadius: 16, padding: "18px 22px", marginBottom: 24, textAlign: "center" }} className="fadeUp">
          <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.7 }}>
            {LEVEL_MESSAGES[result.level]}
          </p>
        </div>

        {/* Score breakdown per level */}
        <div style={{ background: "rgba(13,17,23,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px", marginBottom: 24 }} className="fadeUp">
          <h3 style={{ margin: "0 0 16px", color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Résultats par niveau
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {LEVELS.filter(l => result.breakdown[l]).map(l => {
              const b = result.breakdown[l];
              const pct = Math.round((b.correct / b.total) * 100);
              const lc = LEVEL_COLORS[l] ?? "#10b981";
              const { icon, color: iconColor } = levelIcon(b.correct, b.total);
              const isDetected = l === result.level;
              return (
                <div key={l}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    {/* Level pill */}
                    <span style={{
                      background: `${lc}20`, color: lc, border: `1px solid ${lc}40`,
                      borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 800, flexShrink: 0,
                    }}>{l}</span>
                    {/* Status icon */}
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                    {/* Label */}
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, flex: 1 }}>
                      {LEVEL_LABELS[l]}
                      {isDetected && (
                        <span style={{ marginLeft: 8, background: `${lc}15`, color: lc, border: `1px solid ${lc}30`, borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>
                          ✓ Votre niveau
                        </span>
                      )}
                    </span>
                    {/* Score */}
                    <span style={{ color: iconColor, fontSize: 13, fontWeight: 700, fontFamily: "monospace", flexShrink: 0 }}>{b.correct}/{b.total}</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div style={{ width: animated ? `${pct}%` : "0%", height: "100%", background: lc, borderRadius: 4, transition: "width 1s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 18, marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {[{ icon: "✅", label: "≥ 4/6 Maîtrisé" }, { icon: "⚠️", label: "2-3/6 Partiel" }, { icon: "❌", label: "0-1/6 À revoir" }].map(e => (
              <div key={e.icon} style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                <span>{e.icon}</span><span>{e.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Retry limit indicator */}
        {attempts !== null && (
          <div style={{
            background: attempts >= 2 ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)",
            border: `1px solid ${attempts >= 2 ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
            borderRadius: 12, padding: "12px 16px", marginBottom: 20, textAlign: "center",
          }} className="fadeUp">
            {attempts >= 2 ? (
              <span style={{ color: "#ef4444", fontSize: 13 }}>
                🔒 Niveau assigné définitivement — vous avez utilisé vos 2 tentatives.
              </span>
            ) : (
              <span style={{ color: "#f59e0b", fontSize: 13 }}>
                ℹ️ Tentative {attempts}/2 — vous pouvez reprendre le test <strong>une fois</strong>.
              </span>
            )}
          </div>
        )}

        {/* CTA buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }} className="fadeUp">
          <button
            onClick={accept}
            disabled={accepting}
            style={{
              background: accepting ? `${levelColor}88` : levelColor,
              color: "#fff", border: "none", borderRadius: 12,
              padding: "16px 24px", fontWeight: 700, fontSize: 15, cursor: accepting ? "default" : "pointer",
              boxShadow: `0 8px 24px ${levelColor}30`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
            {accepting ? "Redirection…" : `🚀 Accepter ce niveau (${result.level}) et commencer →`}
          </button>

          {canRetake && (
            <button
              onClick={retake}
              style={{
                background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
                padding: "13px 24px", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>
              🔄 Reprendre le test (1 tentative restante)
            </button>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 20, color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
          Votre niveau est sauvegardé automatiquement — cette page peut être fermée.
        </div>
      </div>
    </div>
  );
}
