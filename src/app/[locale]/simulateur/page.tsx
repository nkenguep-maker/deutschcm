"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";
import VoiceRecorder from "@/components/VoiceRecorder";
import AudioPlayer from "@/components/AudioPlayer";
import { useAmbassade } from "@/hooks/useAmbassade";
import { SCENARIOS, NIVEAUX } from "@/types/ambassade";
import type { ConversationMessage, EvaluationScore, NiveauType, ScenarioType } from "@/types/ambassade";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(n: number): string {
  if (n >= 8) return "#10b981";
  if (n >= 5) return "#f59e0b";
  return "#ef4444";
}

function scoreBg(n: number): string {
  if (n >= 8) return "rgba(16,185,129,0.12)";
  if (n >= 5) return "rgba(245,158,11,0.12)";
  return "rgba(239,68,68,0.12)";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBadge({ label, value }: { label: string; value: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: "0.62rem",
        fontFamily: "'Syne', sans-serif",
        fontWeight: 600,
        background: scoreBg(value),
        color: scoreColor(value),
        border: `1px solid ${scoreColor(value)}33`,
      }}
    >
      {label} {value}/10
    </span>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, padding: "0 4px" }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.85rem",
          background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.08))",
          border: "1px solid rgba(16,185,129,0.25)",
        }}
      >
        🧑‍💼
      </div>
      <div
        style={{
          padding: "10px 16px",
          borderRadius: "18px 18px 18px 4px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <style>{`
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-5px); opacity: 1; }
          }
          .dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; animation: bounce 1.2s infinite; }
          .dot:nth-child(2) { animation-delay: 0.2s; }
          .dot:nth-child(3) { animation-delay: 0.4s; }
        `}</style>
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
    </div>
  );
}

function AgentBubble({
  msg,
  showTranslation,
  onToggle,
  isLast,
}: {
  msg: ConversationMessage;
  showTranslation: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.85rem",
          background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.08))",
          border: "1px solid rgba(16,185,129,0.25)",
        }}
      >
        🧑‍💼
      </div>
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", gap: 6 }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.62rem",
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          Herr Bauer •{" "}
          {msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "18px 18px 18px 4px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.9)",
              fontSize: "0.85rem",
              lineHeight: 1.6,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {msg.textDE}
          </p>
          <div style={{ marginTop: 8 }}>
            <AudioPlayer
              text={msg.textDE}
              gender="male"
              accent="de"
              rate="0.85"
              autoPlay={isLast}
              label="Herr Bauer"
            />
          </div>
          {showTranslation && (
            <p
              style={{
                margin: "8px 0 0",
                color: "rgba(16,185,129,0.7)",
                fontSize: "0.75rem",
                lineHeight: 1.5,
                fontFamily: "'DM Mono', monospace",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                paddingTop: 8,
              }}
            >
              {msg.translationFR}
            </p>
          )}
        </div>
        <button
          onClick={onToggle}
          style={{
            alignSelf: "flex-start",
            background: "none",
            border: "none",
            color: "rgba(16,185,129,0.6)",
            fontSize: "0.62rem",
            cursor: "pointer",
            fontFamily: "'DM Mono', monospace",
            padding: "2px 0",
          }}
        >
          {showTranslation ? "▲ Masquer la traduction" : "▼ Voir la traduction"}
        </button>
      </div>
    </div>
  );
}

function UserBubble({ msg }: { msg: ConversationMessage }) {
  const hasScores = !!msg.evaluation;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <p
        style={{
          margin: 0,
          fontSize: "0.62rem",
          color: "rgba(255,255,255,0.3)",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        Vous •{" "}
        {msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </p>
      <div
        style={{
          maxWidth: "72%",
          padding: "12px 16px",
          borderRadius: "18px 18px 4px 18px",
          background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))",
          border: "1px solid rgba(16,185,129,0.2)",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "rgba(255,255,255,0.9)",
            fontSize: "0.85rem",
            lineHeight: 1.6,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {msg.textDE}
        </p>
      </div>
      {hasScores && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <ScoreBadge label="Grammaire" value={msg.evaluation!.grammar} />
          <ScoreBadge label="Vocabulaire" value={msg.evaluation!.vocabulary} />
          <ScoreBadge label="Pertinence" value={msg.evaluation!.relevance} />
        </div>
      )}
    </div>
  );
}

function GlobalScoreRing({ score }: { score: number }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (score / 10) * circ;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <svg width={76} height={76} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={38} cy={38} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6} />
        <circle
          cx={38}
          cy={38}
          r={r}
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: scoreColor(score),
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: "1.2rem",
          }}
        >
          {score.toFixed(1)}
        </span>
        <span
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: "0.55rem",
          }}
        >
          /10
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SimulateurPageWrapper() {
  return (
    <Suspense>
      <SimulateurPage />
    </Suspense>
  );
}

function SimulateurPage() {
  const {
    messages,
    isLoading,
    error,
    concluded,
    visaDecision,
    scenario,
    niveau,
    sendMessage,
    resetSession,
    setScenario,
    setNiveau,
    startInterview,
  } = useAmbassade();

  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [showTranslations, setShowTranslations] = useState<Record<string, boolean>>({});
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const urlScenario = searchParams.get("scenario") as ScenarioType | null;
    const urlNiveau = searchParams.get("niveau") as NiveauType | null;
    if (urlScenario && SCENARIOS.find(s => s.id === urlScenario)) setScenario(urlScenario);
    if (urlNiveau && NIVEAUX.includes(urlNiveau)) setNiveau(urlNiveau);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const globalScore = useMemo(() => {
    const evaluated = messages.filter((m) => m.evaluation);
    if (!evaluated.length) return null;
    return (
      evaluated.reduce((s, m) => s + m.evaluation!.global, 0) / evaluated.length
    );
  }, [messages]);

  const lastTip = messages.filter((m) => m.pedagogicalTip).at(-1)?.pedagogicalTip;
  const userMsgCount = messages.filter((m) => m.role === "user").length;

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading || concluded) return;
    setInput("");
    sendMessage(text);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleTranslation = (id: string) =>
    setShowTranslations((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleScenarioChange = (s: ScenarioType) => {
    setScenario(s);
    resetSession();
  };

  const handleNiveauChange = (n: NiveauType) => {
    setNiveau(n);
    resetSession();
  };

  const handleMic = () => {
    const SR = (window as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      || (window as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new (SR as new () => {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onresult: ((e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    })();
    recognition.lang = "de-DE";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      setInput((prev) => prev + e.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const scenarioObj = SCENARIOS.find((s) => s.id === scenario)!;

  return (
    <Layout title="Simulateur d'ambassade">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        .sim-textarea::placeholder { color: rgba(255,255,255,0.2); }
        .sim-textarea:focus { border-color: rgba(16,185,129,0.4) !important; }
        .sim-scroll::-webkit-scrollbar { width: 4px; }
        .sim-scroll::-webkit-scrollbar-track { background: transparent; }
        .sim-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 4px; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg-in { animation: fadeSlideIn 0.3s ease forwards; }
        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
        .mic-active { animation: pulseRing 1.2s infinite; }
      `}</style>

      {/* Full-bleed override of Layout padding */}
      <div
        style={{
          margin: "-32px -28px -48px",
          height: "calc(100vh - 64px)",
          display: "flex",
          overflow: "hidden",
          background: "#080c10",
        }}
      >
        {/* ════ LEFT PANEL — Scenarios ════ */}
        <aside
          className="sim-scroll"
          style={{
            width: 230,
            borderRight: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            padding: "16px 10px",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {/* Level selector */}
          <div style={{ marginBottom: 4 }}>
            <p
              style={{
                margin: "0 0 8px 4px",
                fontSize: "0.62rem",
                color: "rgba(255,255,255,0.3)",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Niveau
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              {NIVEAUX.map((n) => (
                <button
                  key={n}
                  onClick={() => handleNiveauChange(n)}
                  style={{
                    padding: "6px 0",
                    borderRadius: 8,
                    border: niveau === n ? "1px solid rgba(16,185,129,0.5)" : "1px solid rgba(255,255,255,0.08)",
                    background: niveau === n ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
                    color: niveau === n ? "#10b981" : "rgba(255,255,255,0.4)",
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />

          {/* Scenario cards */}
          <p
            style={{
              margin: "0 0 4px 4px",
              fontSize: "0.62rem",
              color: "rgba(255,255,255,0.3)",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Scénario
          </p>
          {SCENARIOS.map((s) => {
            const active = scenario === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleScenarioChange(s.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: active ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  background: active ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: "1.2rem", flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      color: active ? "#10b981" : "rgba(255,255,255,0.75)",
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {s.label}
                  </p>
                  <p
                    style={{
                      margin: "3px 0 0",
                      color: "rgba(255,255,255,0.3)",
                      fontSize: "0.6rem",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {s.legalRef}
                  </p>
                </div>
              </button>
            );
          })}

          <div style={{ flex: 1 }} />

          {/* Reset button */}
          {messages.length > 0 && (
            <button
              onClick={() => { resetSession(); }}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid rgba(239,68,68,0.2)",
                background: "rgba(239,68,68,0.05)",
                color: "rgba(239,68,68,0.7)",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 600,
                fontSize: "0.7rem",
                cursor: "pointer",
                width: "100%",
              }}
            >
              🔄 Nouvelle session
            </button>
          )}
        </aside>

        {/* ════ CENTER — Chat ════ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Messages area */}
          <div
            className="sim-scroll"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* Empty state */}
            {messages.length === 0 && !isLoading && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                  opacity: 0.6,
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                    background: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(16,185,129,0.15)",
                  }}
                >
                  {scenarioObj.icon}
                </div>
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      margin: "0 0 6px",
                      color: "white",
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      fontSize: "1rem",
                    }}
                  >
                    {scenarioObj.label}
                  </p>
                  <p
                    style={{
                      margin: "0 0 20px",
                      color: "rgba(255,255,255,0.35)",
                      fontSize: "0.75rem",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {scenarioObj.legalRef} · Niveau {niveau}
                  </p>
                  <button
                    onClick={startInterview}
                    style={{
                      padding: "12px 28px",
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "white",
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
                    }}
                  >
                    Commencer l&apos;entretien →
                  </button>
                </div>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((msg, index) => (
              <div key={msg.id} className="msg-in">
                {msg.role === "agent" ? (
                  <AgentBubble
                    msg={msg}
                    showTranslation={!!showTranslations[msg.id]}
                    onToggle={() => toggleTranslation(msg.id)}
                    isLast={index === messages.length - 1}
                  />
                ) : (
                  <UserBubble msg={msg} />
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="msg-in">
                <TypingIndicator />
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#f87171",
                  fontSize: "0.78rem",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                ⚠️ {error.message}
              </div>
            )}

            {/* Concluded state */}
            {concluded && (
              <div
                className="msg-in"
                style={{
                  textAlign: "center",
                  padding: "24px",
                  borderRadius: 16,
                  background:
                    visaDecision === "approved"
                      ? "rgba(16,185,129,0.08)"
                      : "rgba(239,68,68,0.08)",
                  border: `1px solid ${visaDecision === "approved" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                }}
              >
                <p style={{ margin: "0 0 6px", fontSize: "2rem" }}>
                  {visaDecision === "approved" ? "✅" : "❌"}
                </p>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "white",
                  }}
                >
                  {visaDecision === "approved" ? "Visa accordé !" : "Visa refusé"}
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "0.75rem",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {visaDecision === "approved"
                    ? "Herzlichen Glückwunsch — félicitations !"
                    : "Ihr Antrag wurde abgelehnt — votre demande a été refusée."}
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            style={{
              padding: "12px 20px 16px",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(8,12,16,0.95)",
            }}
          >
            {concluded ? (
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => { resetSession(); }}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 10,
                    border: "1px solid rgba(16,185,129,0.3)",
                    background: "rgba(16,185,129,0.1)",
                    color: "#10b981",
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  Recommencer un entretien
                </button>
              </div>
            ) : (
              <>
              {messages.length > 0 && (
                <VoiceRecorder
                  level={niveau}
                  exerciseType={`simulateur_${scenario}`}
                  onResult={(_analysis, transcript) => {
                    if (transcript?.trim()) setInput(transcript);
                  }}
                  placeholder={
                    niveau === "A2" ? "Antworten Sie auf Deutsch..." :
                    niveau === "B1" ? "Bitte antworten Sie auf Deutsch..." :
                    niveau === "B2" ? "Formulieren Sie Ihre Antwort auf Deutsch..." :
                    "Bitte antworten Sie auf Deutsch..."
                  }
                />
              )}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Schreiben Sie auf Deutsch… (Entrée pour envoyer)"
                  rows={2}
                  disabled={isLoading}
                  className="sim-textarea"
                  style={{
                    flex: 1,
                    resize: "none",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 14,
                    color: "white",
                    padding: "12px 16px",
                    fontSize: "0.85rem",
                    fontFamily: "'DM Mono', monospace",
                    outline: "none",
                    lineHeight: 1.5,
                    transition: "border-color 0.15s",
                  }}
                />

                {/* Mic */}
                <button
                  onClick={handleMic}
                  title="Dicter en allemand"
                  className={isListening ? "mic-active" : ""}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: isListening
                      ? "1px solid rgba(239,68,68,0.5)"
                      : "1px solid rgba(255,255,255,0.1)",
                    background: isListening
                      ? "rgba(239,68,68,0.12)"
                      : "rgba(255,255,255,0.04)",
                    color: isListening ? "#ef4444" : "rgba(255,255,255,0.4)",
                    fontSize: "1.1rem",
                    cursor: "pointer",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  🎙️
                </button>

                {/* Send */}
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: "none",
                    background:
                      !input.trim() || isLoading
                        ? "rgba(255,255,255,0.05)"
                        : "linear-gradient(135deg, #10b981, #059669)",
                    color: !input.trim() || isLoading ? "rgba(255,255,255,0.2)" : "white",
                    fontSize: "1rem",
                    cursor: !input.trim() || isLoading ? "not-allowed" : "pointer",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    boxShadow: !input.trim() || isLoading ? "none" : "0 4px 16px rgba(16,185,129,0.3)",
                  }}
                >
                  ➤
                </button>
              </div>
              </>
            )}
          </div>
        </div>

        {/* ════ RIGHT PANEL — Scores & Tips ════ */}
        <aside
          className="sim-scroll"
          style={{
            width: 280,
            borderLeft: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            flexDirection: "column",
            padding: "20px 16px",
            gap: 16,
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          {/* Score global */}
          <div
            style={{
              borderRadius: 16,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Score de session
            </p>
            {globalScore !== null ? (
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GlobalScoreRing score={globalScore} />
              </div>
            ) : (
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: "50%",
                  border: "6px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.15)",
                  fontSize: "0.7rem",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                —
              </div>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
                width: "100%",
              }}
            >
              {(["grammar", "vocabulary", "relevance"] as const).map((key) => {
                const evaluated = messages.filter((m) => m.evaluation);
                if (!evaluated.length) return null;
                const avg =
                  evaluated.reduce((s, m) => s + m.evaluation![key], 0) / evaluated.length;
                const labels: Record<typeof key, string> = {
                  grammar: "Grammaire",
                  vocabulary: "Vocabulaire",
                  relevance: "Pertinence",
                };
                return (
                  <div
                    key={key}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: scoreBg(avg),
                      border: `1px solid ${scoreColor(avg)}22`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "0.58rem",
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {labels[key]}
                    </span>
                    <span
                      style={{
                        color: scoreColor(avg),
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700,
                        fontSize: "1rem",
                      }}
                    >
                      {avg.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conseil pédagogique */}
          <div
            style={{
              borderRadius: 16,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              padding: "14px 16px",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              💡 Conseil
            </p>
            <p
              style={{
                margin: 0,
                color: lastTip ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)",
                fontSize: "0.78rem",
                lineHeight: 1.6,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {lastTip ?? "Les conseils de Herr Bauer apparaîtront ici après chaque réponse."}
            </p>
          </div>

          {/* Progression */}
          <div
            style={{
              borderRadius: 16,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              padding: "14px 16px",
            }}
          >
            <p
              style={{
                margin: "0 0 12px",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              📊 Progression
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Échanges", value: userMsgCount.toString(), icon: "💬" },
                { label: "Scénario", value: scenarioObj.label, icon: scenarioObj.icon },
                { label: "Niveau", value: niveau, icon: "🎯" },
                {
                  label: "Statut",
                  value: concluded
                    ? visaDecision === "approved"
                      ? "Accordé ✅"
                      : "Refusé ❌"
                    : messages.length > 0
                    ? "En cours…"
                    : "Non démarré",
                  icon: "🏛️",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: "0.68rem",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {row.icon} {row.label}
                  </span>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.75)",
                      fontSize: "0.7rem",
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Terminer l'entretien */}
          {messages.length > 2 && !concluded && (
            <button
              onClick={() =>
                sendMessage(
                  "Ich habe alle Fragen beantwortet. Können Sie bitte eine Entscheidung treffen?"
                )
              }
              disabled={isLoading}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: "1px solid rgba(239,68,68,0.2)",
                background: "rgba(239,68,68,0.06)",
                color: "rgba(239,68,68,0.8)",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 600,
                fontSize: "0.75rem",
                cursor: isLoading ? "not-allowed" : "pointer",
                width: "100%",
              }}
            >
              🏁 Terminer l&apos;entretien
            </button>
          )}
        </aside>
      </div>
    </Layout>
  );
}
