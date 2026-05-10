"use client";

import { useState, useEffect } from "react";

interface JoinRequestModalProps {
  type: "class" | "group" | "center";
  targetId: string;
  targetName: string;
  teacherName?: string;
  userLevel?: string;
  userFirstName?: string;
  userGoal?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.5}s`,
    color: ["#10b981", "#34d399", "#6ee7b7", "#059669", "#d1fae5", "#fbbf24"][i % 6],
    size: Math.random() * 8 + 4,
  }));
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(300px) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: "absolute", top: 0, left: p.left,
          width: p.size, height: p.size, borderRadius: i % 3 === 0 ? "50%" : 2,
          background: p.color,
          animation: `confettiFall 1.2s ${p.delay} ease-in forwards`,
        }} />
      ))}
    </div>
  );
}

const STEP_LABELS = ["Présentation", "Message", "Confirmation"];

export default function JoinRequestModal({
  type, targetId, targetName, teacherName, userLevel, userFirstName, userGoal, onClose, onSuccess,
}: JoinRequestModalProps) {
  const [step, setStep] = useState(1);
  const [presentation, setPresentation] = useState(
    `Bonjour${teacherName ? ` ${teacherName}` : ""}, je m'appelle ${userFirstName ?? "[prénom]"}, niveau ${userLevel ?? "A1"}.${userGoal ? ` Mon objectif : ${userGoal}.` : ""} Je souhaite rejoindre votre ${type === "class" ? "classe" : type === "group" ? "groupe" : "centre"} pour progresser en allemand.`
  );
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSend = async () => {
    setSending(true);
    setError("");
    try {
      const action = type === "class" ? "request-join-class" : type === "group" ? "request-join-group" : "request-join-class";
      const bodyKey = type === "class" ? "classroomId" : type === "group" ? "groupId" : "classroomId";
      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          [bodyKey]: targetId,
          message: [presentation, message].filter(Boolean).join("\n\n"),
        }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Erreur"); return; }
      setSent(true);
      setStep(3);
      onSuccess?.();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSending(false);
    }
  };

  const accentColor = "#10b981";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 2000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      backdropFilter: "blur(6px)",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: "100%", maxWidth: 480, background: "#0d1117",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24,
        overflow: "hidden", position: "relative",
      }}>
        {sent && <Confetti />}

        {/* Progress bar */}
        <div style={{ height: 3, background: "rgba(255,255,255,0.05)" }}>
          <div style={{ height: "100%", background: accentColor, width: `${(step / 3) * 100}%`, transition: "width 0.4s ease" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "white", fontWeight: 800, fontSize: 16 }}>
                {step === 3 ? "🎉 Demande envoyée !" : `📩 Rejoindre ${targetName}`}
              </div>
              {step < 3 && (
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  {STEP_LABELS.map((l, i) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: i + 1 <= step ? accentColor : "rgba(255,255,255,0.15)",
                      }} />
                      <span style={{ color: i + 1 === step ? accentColor : "rgba(255,255,255,0.3)", fontSize: 11 }}>{l}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer", padding: "4px 8px", lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div style={{ padding: "20px 24px 24px" }}>

          {/* Step 1: Auto-presentation */}
          {step === 1 && (
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 8 }}>
                ✍️ Présentation automatique (modifiable)
              </label>
              <textarea
                value={presentation}
                onChange={e => setPresentation(e.target.value)}
                rows={5}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12, resize: "vertical",
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${accentColor}30`,
                  color: "white", fontSize: 13, outline: "none", boxSizing: "border-box", lineHeight: 1.6,
                }}
              />
              <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 6 }}>
                Ce message sera envoyé automatiquement avec votre profil
              </div>
              <button onClick={() => setStep(2)} style={{
                marginTop: 16, width: "100%", padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: `linear-gradient(135deg, ${accentColor}, #059669)`, color: "white", border: "none", cursor: "pointer",
                boxShadow: `0 6px 20px ${accentColor}40`,
              }}>
                Suivant →
              </button>
            </div>
          )}

          {/* Step 2: Custom message */}
          {step === 2 && (
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 8 }}>
                💬 Message personnalisé (optionnel)
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Ajoutez des informations supplémentaires : disponibilités spécifiques, questions, etc."
                rows={4}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12, resize: "vertical",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "white", fontSize: 13, outline: "none", boxSizing: "border-box", lineHeight: 1.6,
                }}
              />

              {/* Summary */}
              <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 8 }}>📋 Résumé de votre demande</div>
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: 1.5 }}>
                  <div>• Destination : <strong style={{ color: "white" }}>{targetName}</strong></div>
                  {teacherName && <div>• Enseignant : <strong style={{ color: "white" }}>{teacherName}</strong></div>}
                  <div>• Niveau déclaré : <strong style={{ color: accentColor }}>{userLevel ?? "Non renseigné"}</strong></div>
                </div>
              </div>

              {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 10 }}>{error}</div>}

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer" }}>
                  ← Retour
                </button>
                <button onClick={handleSend} disabled={sending} style={{
                  flex: 2, padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: `linear-gradient(135deg, ${accentColor}, #059669)`, color: "white", border: "none",
                  cursor: "pointer", opacity: sending ? 0.7 : 1,
                  boxShadow: `0 6px 20px ${accentColor}40`,
                }}>
                  {sending ? "Envoi en cours..." : "✉️ Envoyer la demande"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <div style={{ color: "white", fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Demande envoyée avec succès !</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
                {teacherName ? `${teacherName} recevra` : "Le responsable recevra"} votre demande et vous répondra bientôt.<br />
                En attendant, continuez vos leçons pour progresser !
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer" }}>
                  Fermer
                </button>
                <a href="/courses" style={{
                  flex: 2, display: "block", textAlign: "center", padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 700,
                  background: `linear-gradient(135deg, ${accentColor}, #059669)`, color: "white", textDecoration: "none",
                }}>
                  📚 Continuer mes leçons →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
