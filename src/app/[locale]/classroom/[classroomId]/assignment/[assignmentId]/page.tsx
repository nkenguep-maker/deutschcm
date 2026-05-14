"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { Link } from "@/navigation";
import Layout from "@/components/Layout";

// ─── Types ────────────────────────────────────────────────────────────────────

type AssignmentType = "MODULE" | "QUIZ" | "SIMULATEUR";
type AssignmentStatus = "pending" | "in_progress" | "completed" | "overdue";

interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correct: number;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  type: AssignmentType;
  dueDate: string | null;
  module: { id: string; title: string; level: string } | null;
  scenario: string | null;
  status: AssignmentStatus;
  maxAttempts: number;
  attemptsUsed: number;
  pointsMax: number;
  pointsEarned: number | null;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ASSIGNMENTS: Record<string, Assignment> = {
  "a1": {
    id: "a1", title: "Vocabulaire : Se présenter",
    description: "Apprenez le vocabulaire essentiel pour vous présenter en allemand. Couvrez le nom, la nationalité, la profession et les loisirs.",
    type: "MODULE", dueDate: "2025-05-15T23:59:00",
    module: { id: "mod-1", title: "Se présenter en allemand", level: "A1" },
    scenario: null, status: "pending", maxAttempts: 3, attemptsUsed: 0,
    pointsMax: 100, pointsEarned: null,
  },
  "a2": {
    id: "a2", title: "Grammaire : Der/Die/Das",
    description: "Maîtrisez les articles définis allemands. Répondez aux 10 questions pour valider votre compréhension des genres grammaticaux.",
    type: "QUIZ", dueDate: "2025-05-22T23:59:00",
    module: null, scenario: null, status: "completed",
    maxAttempts: 1, attemptsUsed: 1, pointsMax: 100, pointsEarned: 85,
  },
  "a3": {
    id: "a3", title: "Simulation : Se présenter à un inconnu",
    description: "Simulez une conversation avec un natif allemand. Vous devez vous présenter, demander le prénom de votre interlocuteur, et parler de vos loisirs pendant au moins 2 minutes.",
    type: "SIMULATEUR", dueDate: "2025-05-25T23:59:00",
    module: null,
    scenario: "Vous rencontrez une personne à la gare de Berlin. Présentez-vous, échangez vos prénoms et parlez brièvement de vos hobbys.",
    status: "pending", maxAttempts: 2, attemptsUsed: 0, pointsMax: 100, pointsEarned: null,
  },
};

const MOCK_QUIZ: QuizQuestion[] = [
  { id: "q1", text: "Quel est l'article défini pour le mot « Hund » (chien) ?", options: ["der", "die", "das", "den"], correct: 0 },
  { id: "q2", text: "Quelle est la forme correcte pour « Frau » (femme) ?", options: ["der Frau", "die Frau", "das Frau", "dem Frau"], correct: 1 },
  { id: "q3", text: "Comment dit-on « the book » en allemand ?", options: ["der Buch", "die Buch", "das Buch", "den Buch"], correct: 2 },
  { id: "q4", text: "Quel est l'article pour « Kind » (enfant) ?", options: ["der", "die", "das", "ein"], correct: 2 },
  { id: "q5", text: "L'article défini de « Tisch » (table) est :", options: ["die", "der", "das", "den"], correct: 1 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimeLeft(dueDate: string | null): { days: number; hours: number; minutes: number; seconds: number; overdue: boolean } | null {
  if (!dueDate) return null;
  const diff = new Date(dueDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, overdue: true };
  const totalSec = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    overdue: false,
  };
}

function pad(n: number) { return String(n).padStart(2, "0"); }

const TYPE_META: Record<AssignmentType, { icon: string; label: string; color: string; bg: string; border: string }> = {
  MODULE:     { icon: "📚", label: "Module de cours",   color: "#6366f1", bg: "rgba(99,102,241,0.1)",  border: "rgba(99,102,241,0.25)" },
  QUIZ:       { icon: "📝", label: "Quiz noté",         color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)" },
  SIMULATEUR: { icon: "🎙️", label: "Simulation IA",    color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)" },
};

const STATUS_META: Record<AssignmentStatus, { label: string; color: string; bg: string }> = {
  pending:    { label: "À faire",     color: "#f59e0b", bg: "rgba(245,158,11,0.12)"   },
  in_progress:{ label: "En cours",   color: "#6366f1", bg: "rgba(99,102,241,0.12)"   },
  completed:  { label: "Terminé",    color: "#10b981", bg: "rgba(16,185,129,0.12)"   },
  overdue:    { label: "En retard",  color: "#ef4444", bg: "rgba(239,68,68,0.12)"    },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function CountdownBlock({ dueDate }: { dueDate: string }) {
  const [tl, setTl] = useState(() => getTimeLeft(dueDate));

  useEffect(() => {
    const id = setInterval(() => setTl(getTimeLeft(dueDate)), 1000);
    return () => clearInterval(id);
  }, [dueDate]);

  if (!tl) return null;

  if (tl.overdue) return (
    <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "14px 18px", textAlign: "center" }}>
      <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 14 }}>⏰ Date limite dépassée</div>
    </div>
  );

  const urgent = tl.days === 0 && tl.hours < 24;
  const accentColor = urgent ? "#ef4444" : "#10b981";

  return (
    <div style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}30`, borderRadius: 12, padding: "14px 18px" }}>
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10, textAlign: "center" }}>
        {urgent ? "⚠️ Temps restant" : "🕐 Date limite dans"}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        {tl.days > 0 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ color: accentColor, fontWeight: 800, fontSize: 22, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{tl.days}</div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, marginTop: 2 }}>j</div>
          </div>
        )}
        <div style={{ textAlign: "center" }}>
          <div style={{ color: accentColor, fontWeight: 800, fontSize: 22, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{pad(tl.hours)}</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, marginTop: 2 }}>h</div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 18, alignSelf: "flex-start", paddingTop: 2 }}>:</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: accentColor, fontWeight: 800, fontSize: 22, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{pad(tl.minutes)}</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, marginTop: 2 }}>min</div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 18, alignSelf: "flex-start", paddingTop: 2 }}>:</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: accentColor, fontWeight: 800, fontSize: 22, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{pad(tl.seconds)}</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, marginTop: 2 }}>s</div>
        </div>
      </div>
    </div>
  );
}

// ─── Quiz mode ────────────────────────────────────────────────────────────────

function QuizMode({ assignment, onComplete }: { assignment: Assignment; onComplete: (score: number) => void }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(MOCK_QUIZ.length).fill(null));
  const [confirmed, setConfirmed] = useState(false);
  const [done, setDone] = useState(false);

  const q = MOCK_QUIZ[current];
  const totalQ = MOCK_QUIZ.length;
  const isLast = current === totalQ - 1;

  const confirm = () => {
    if (selected === null) return;
    const newAnswers = [...answers];
    newAnswers[current] = selected;
    setAnswers(newAnswers);
    setConfirmed(true);
  };

  const next = () => {
    if (isLast) {
      const correct = answers.filter((a, i) => a === MOCK_QUIZ[i].correct).length;
      const score = Math.round((correct / totalQ) * 100);
      setDone(true);
      setTimeout(() => onComplete(score), 1500);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setConfirmed(false);
    }
  };

  if (done) return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
      <div style={{ color: "#10b981", fontWeight: 800, fontSize: 22, fontFamily: "'Syne', sans-serif" }}>Quiz terminé !</div>
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 8 }}>Calcul de votre score...</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Progress bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Question {current + 1} / {totalQ}</span>
          <span style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700 }}>{Math.round(((current) / totalQ) * 100)}%</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 4 }}>
          <div style={{ width: `${((current) / totalQ) * 100}%`, height: "100%", background: "#f59e0b", borderRadius: 4, transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* Question */}
      <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 14, padding: "20px 24px" }}>
        <p style={{ margin: 0, color: "#f1f5f9", fontSize: 16, fontWeight: 600, lineHeight: 1.5 }}>{q.text}</p>
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {q.options.map((opt, i) => {
          let bg = "rgba(255,255,255,0.03)";
          let border = "rgba(255,255,255,0.08)";
          let color = "rgba(255,255,255,0.65)";

          if (confirmed) {
            if (i === q.correct) { bg = "rgba(16,185,129,0.12)"; border = "rgba(16,185,129,0.35)"; color = "#10b981"; }
            else if (i === selected && i !== q.correct) { bg = "rgba(239,68,68,0.1)"; border = "rgba(239,68,68,0.3)"; color = "#ef4444"; }
          } else if (selected === i) {
            bg = "rgba(245,158,11,0.1)"; border = "rgba(245,158,11,0.3)"; color = "#f59e0b";
          }

          return (
            <button key={i} disabled={confirmed} onClick={() => setSelected(i)} style={{
              display: "flex", alignItems: "center", gap: 12, textAlign: "left",
              background: bg, border: `1px solid ${border}`, borderRadius: 10,
              padding: "13px 16px", cursor: confirmed ? "default" : "pointer",
              transition: "all 0.15s",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                background: selected === i || (confirmed && i === q.correct) ? border : "rgba(255,255,255,0.05)",
                border: `2px solid ${border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color, fontSize: 11, fontWeight: 700,
              }}>
                {confirmed && i === q.correct ? "✓" : confirmed && i === selected ? "✗" : String.fromCharCode(65 + i)}
              </div>
              <span style={{ color, fontSize: 14 }}>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Action */}
      {!confirmed ? (
        <button onClick={confirm} disabled={selected === null} style={{
          background: selected !== null ? "#f59e0b" : "rgba(255,255,255,0.06)",
          color: selected !== null ? "#000" : "rgba(255,255,255,0.2)",
          border: "none", borderRadius: 10, padding: "13px 24px",
          fontWeight: 700, fontSize: 14, cursor: selected !== null ? "pointer" : "default",
          transition: "all 0.2s",
        }}>
          Valider la réponse
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{
            background: selected === q.correct ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${selected === q.correct ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
            borderRadius: 10, padding: "12px 16px",
            color: selected === q.correct ? "#10b981" : "#ef4444", fontSize: 13,
          }}>
            {selected === q.correct ? "✓ Bonne réponse !" : `✗ La bonne réponse était : ${q.options[q.correct]}`}
          </div>
          <button onClick={next} style={{
            background: "#10b981", color: "#fff", border: "none", borderRadius: 10,
            padding: "13px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>
            {isLast ? "Terminer le quiz →" : "Question suivante →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Simulator mode ───────────────────────────────────────────────────────────

function SimulatorMode({ assignment, onComplete }: { assignment: Assignment; onComplete: (score: number) => void }) {
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!started || done) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [started, done]);

  const finish = useCallback(() => {
    setDone(true);
    const score = elapsed >= 120 ? 88 : Math.round((elapsed / 120) * 70);
    setTimeout(() => onComplete(score), 1200);
  }, [elapsed, onComplete]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  if (done) return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🎙️</div>
      <div style={{ color: "#10b981", fontWeight: 800, fontSize: 22, fontFamily: "'Syne', sans-serif" }}>Simulation terminée !</div>
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 8 }}>Analyse de votre performance...</div>
    </div>
  );

  if (!started) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 14, padding: "20px 24px" }}>
        <div style={{ color: "#10b981", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>🎭 Scénario imposé</div>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.6 }}>{assignment.scenario}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          "Durée minimale : 2 minutes de conversation",
          "L'IA jouera le rôle de l'interlocuteur natif",
          "Vous serez évalué sur la fluidité, le vocabulaire et la grammaire",
          "Une seule tentative — prenez le temps de vous préparer",
        ].map((tip, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: "#10b981", fontSize: 12, marginTop: 1 }}>✓</span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{tip}</span>
          </div>
        ))}
      </div>

      <button onClick={() => setStarted(true)} style={{
        background: "#10b981", color: "#fff", border: "none", borderRadius: 12,
        padding: "15px 24px", fontWeight: 700, fontSize: 15, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>🎙️</span> Lancer la simulation
      </button>
    </div>
  );

  const minTarget = elapsed >= 120;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Recording indicator */}
      <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px rgba(239,68,68,0.6)", animation: "pulse 1.2s infinite" }} />
        <div>
          <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 13 }}>Simulation en cours</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Microphone actif</div>
        </div>
        <div style={{ marginLeft: "auto", color: "#ef4444", fontFamily: "monospace", fontWeight: 700, fontSize: 20 }}>
          {pad(minutes)}:{pad(seconds)}
        </div>
      </div>

      {/* Simulated chat */}
      <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, minHeight: 160 }}>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "center", marginBottom: 12 }}>— Conversation en cours —</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.1)", borderRadius: "4px 12px 12px 12px", padding: "10px 14px", maxWidth: "80%" }}>
            <div style={{ color: "#10b981", fontSize: 10, fontWeight: 600, marginBottom: 4 }}>🤖 Interlocuteur IA</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Hallo! Ich heiße Anna. Wie heißen Sie?</div>
          </div>
          {elapsed > 8 && (
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px 4px 12px 12px", padding: "10px 14px", maxWidth: "80%", alignSelf: "flex-end" }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Vous</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Guten Tag! Ich heiße... [votre réponse]</div>
            </div>
          )}
          {elapsed > 20 && (
            <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.1)", borderRadius: "4px 12px 12px 12px", padding: "10px 14px", maxWidth: "80%" }}>
              <div style={{ color: "#10b981", fontSize: 10, fontWeight: 600, marginBottom: 4 }}>🤖 Interlocuteur IA</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Was machen Sie beruflich?</div>
            </div>
          )}
        </div>
      </div>

      {/* Progress to minimum */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Durée minimale (2 min)</span>
          <span style={{ color: minTarget ? "#10b981" : "#f59e0b", fontSize: 11, fontWeight: 700 }}>
            {minTarget ? "✓ Atteinte" : `${Math.round((elapsed / 120) * 100)}%`}
          </span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 5 }}>
          <div style={{ width: `${Math.min((elapsed / 120) * 100, 100)}%`, height: "100%", background: minTarget ? "#10b981" : "#f59e0b", borderRadius: 4, transition: "width 1s linear" }} />
        </div>
      </div>

      <button onClick={finish} style={{
        background: minTarget ? "#10b981" : "rgba(255,255,255,0.06)",
        color: minTarget ? "#fff" : "rgba(255,255,255,0.3)",
        border: "none", borderRadius: 10, padding: "13px 24px",
        fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.3s",
      }}>
        {minTarget ? "Terminer la simulation →" : `Continuer... (${Math.max(0, 120 - elapsed)}s restantes)`}
      </button>
    </div>
  );
}

// ─── Score result ─────────────────────────────────────────────────────────────

function ScoreResult({ score, type, onBack }: { score: number; type: AssignmentType; onBack: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const grade = score >= 80 ? "Excellent" : score >= 60 ? "Bien" : score >= 40 ? "Passable" : "À revoir";
  const gradeColor = score >= 80 ? "#10b981" : score >= 60 ? "#6366f1" : score >= 40 ? "#f59e0b" : "#ef4444";

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center", padding: "32px 0" }}>
      {/* Score circle */}
      <div style={{ position: "relative", width: 120, height: 120 }}>
        <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="60" cy="60" r="52" fill="none" stroke={gradeColor} strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - score / 100)}`}
            style={{ transition: "stroke-dashoffset 1.5s ease" }}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: gradeColor, fontWeight: 800, fontSize: 28, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{score}</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>/ 100</div>
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ color: gradeColor, fontWeight: 800, fontSize: 20, fontFamily: "'Syne', sans-serif" }}>{grade}</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4 }}>
          {type === "QUIZ" && `${Math.round(score / 20)} / ${MOCK_QUIZ.length} bonnes réponses`}
          {type === "SIMULATEUR" && "Performance évaluée par l'IA"}
          {type === "MODULE" && "Module complété"}
        </div>
      </div>

      {submitted ? (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 12, padding: "16px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
          <div style={{ color: "#10b981", fontWeight: 700 }}>Devoir rendu avec succès !</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>Votre professeur recevra votre résultat.</div>
        </div>
      ) : (
        <button onClick={handleSubmit} disabled={submitting} style={{
          background: submitting ? "rgba(16,185,129,0.5)" : "#10b981",
          color: "#fff", border: "none", borderRadius: 12,
          padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {submitting ? "Envoi..." : "📤 Rendre le devoir"}
        </button>
      )}

      <button onClick={onBack} style={{
        background: "none", color: "rgba(255,255,255,0.3)", border: "none",
        cursor: "pointer", fontSize: 13, textDecoration: "underline",
      }}>
        Retour au devoir
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AssignmentDetailPage() {
  const { classroomId, assignmentId } = useParams<{ classroomId: string; assignmentId: string }>();
  const router = useRouter();

  const assignment = MOCK_ASSIGNMENTS[assignmentId] ?? MOCK_ASSIGNMENTS["a1"];
  const meta = TYPE_META[assignment.type];
  const statusMeta = STATUS_META[assignment.status];

  const [phase, setPhase] = useState<"info" | "active" | "result">("info");
  const [score, setScore] = useState<number | null>(null);

  const handleComplete = useCallback((s: number) => {
    setScore(s);
    setPhase("result");
  }, []);

  const canStart = assignment.status !== "completed" && assignment.attemptsUsed < assignment.maxAttempts;
  const attemptsLeft = assignment.maxAttempts - assignment.attemptsUsed;

  return (
    <Layout title={assignment.title}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        .syne { font-family: 'Syne', sans-serif; }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
      `}</style>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
        <Link href="/classroom" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Mes classes</Link>
        <span>›</span>
        <Link href={`/classroom/${classroomId}`} style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Classe</Link>
        <span>›</span>
        <span style={{ color: "rgba(255,255,255,0.6)" }}>{assignment.title}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>

        {/* ── Left: Main content ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Header card */}
          {phase === "info" && (
            <div style={{ background: "rgba(13,17,23,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderTop: `3px solid ${meta.color}`, borderRadius: 16, padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>{meta.icon}</span>
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                    <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                      {meta.label}
                    </span>
                    <span style={{ background: statusMeta.bg, color: statusMeta.color, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                      {statusMeta.label}
                    </span>
                  </div>
                  <h1 className="syne" style={{ margin: 0, color: "#f1f5f9", fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>
                    {assignment.title}
                  </h1>
                </div>
              </div>

              <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7 }}>
                {assignment.description}
              </p>

              {/* Module link */}
              {assignment.module && (
                <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <span style={{ fontSize: 20 }}>📘</span>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Module lié</div>
                    <div style={{ color: "#a5b4fc", fontSize: 13, fontWeight: 600, marginTop: 2 }}>{assignment.module.title}</div>
                  </div>
                  <span style={{ marginLeft: "auto", background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                    {assignment.module.level}
                  </span>
                </div>
              )}

              {/* Scenario */}
              {assignment.scenario && (
                <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ color: "#10b981", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>🎭 Scénario</div>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.6 }}>{assignment.scenario}</p>
                </div>
              )}

              {/* Stats row */}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[
                  { label: "Points max", value: `${assignment.pointsMax} pts`, color: meta.color },
                  { label: "Tentatives", value: `${attemptsLeft} restante${attemptsLeft > 1 ? "s" : ""}`, color: attemptsLeft > 0 ? "#10b981" : "#ef4444" },
                  ...(assignment.pointsEarned !== null ? [{ label: "Score obtenu", value: `${assignment.pointsEarned} pts`, color: "#10b981" }] : []),
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 16px" }}>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginBottom: 2 }}>{label}</div>
                    <div style={{ color, fontWeight: 700, fontSize: 14 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active phase */}
          {phase === "active" && (
            <div style={{ background: "rgba(13,17,23,0.85)", border: `1px solid ${meta.border}`, borderTop: `3px solid ${meta.color}`, borderRadius: 16, padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <span style={{ fontSize: 20 }}>{meta.icon}</span>
                <h2 className="syne" style={{ margin: 0, color: "#f1f5f9", fontSize: 17, fontWeight: 700 }}>{assignment.title}</h2>
                <button onClick={() => setPhase("info")} style={{ marginLeft: "auto", background: "none", color: "rgba(255,255,255,0.3)", border: "none", cursor: "pointer", fontSize: 12 }}>
                  ← Retour
                </button>
              </div>

              {assignment.type === "QUIZ" && <QuizMode assignment={assignment} onComplete={handleComplete} />}
              {assignment.type === "SIMULATEUR" && <SimulatorMode assignment={assignment} onComplete={handleComplete} />}
              {assignment.type === "MODULE" && (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                  <div style={{ color: "#a5b4fc", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Module : {assignment.module?.title}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24 }}>Ce module s&apos;ouvrira dans le lecteur de cours.</div>
                  <button onClick={() => router.push(`/courses/${assignment.module?.id}`)} style={{
                    background: "#6366f1", color: "#fff", border: "none", borderRadius: 10,
                    padding: "13px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer",
                  }}>
                    📖 Ouvrir le module →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Result phase */}
          {phase === "result" && score !== null && (
            <div style={{ background: "rgba(13,17,23,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 28 }}>
              <ScoreResult score={score} type={assignment.type} onBack={() => setPhase("info")} />
            </div>
          )}

          {/* Start button (info phase) */}
          {phase === "info" && (
            <div style={{ display: "flex", gap: 12 }}>
              {assignment.status === "completed" ? (
                <div style={{ flex: 1, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "16px 24px", textAlign: "center", color: "#10b981", fontWeight: 700 }}>
                  ✓ Devoir déjà soumis — Score : {assignment.pointsEarned} / {assignment.pointsMax}
                </div>
              ) : !canStart ? (
                <div style={{ flex: 1, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "16px 24px", textAlign: "center", color: "#ef4444", fontWeight: 700 }}>
                  ✗ Plus de tentatives disponibles
                </div>
              ) : (
                <button onClick={() => setPhase("active")} style={{
                  flex: 1, background: meta.color, color: "#fff", border: "none", borderRadius: 12,
                  padding: "16px 24px", fontWeight: 700, fontSize: 16, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  transition: "opacity 0.2s",
                }}>
                  <span style={{ fontSize: 20 }}>{meta.icon}</span>
                  {assignment.type === "MODULE" && "Commencer le module →"}
                  {assignment.type === "QUIZ" && "Commencer le quiz →"}
                  {assignment.type === "SIMULATEUR" && "Lancer la simulation →"}
                </button>
              )}
              <Link href={`/classroom/${classroomId}`} style={{
                background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
                padding: "16px 20px", textDecoration: "none", fontSize: 13, display: "flex", alignItems: "center",
              }}>
                ← Classe
              </Link>
            </div>
          )}
        </div>

        {/* ── Right: Sidebar info ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Countdown */}
          {assignment.dueDate && phase !== "result" && (
            <div style={{ background: "rgba(13,17,23,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 18 }}>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
                Échéance
              </div>
              <CountdownBlock dueDate={assignment.dueDate} />
              <div style={{ marginTop: 10, color: "rgba(255,255,255,0.25)", fontSize: 11, textAlign: "center" }}>
                {new Date(assignment.dueDate).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          )}

          {/* Rules */}
          <div style={{ background: "rgba(13,17,23,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 18 }}>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
              Règles
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "🔄", text: `${assignment.maxAttempts} tentative${assignment.maxAttempts > 1 ? "s" : ""} maximum` },
                { icon: "⏱️", text: assignment.type === "QUIZ" ? "Pas de limite de temps" : "Durée libre" },
                { icon: "🔒", text: "Soumission irréversible" },
                { icon: "📊", text: "Score visible immédiatement" },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 13 }}>{icon}</span>
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Help */}
          <div style={{ background: "rgba(13,17,23,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 18 }}>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
              Besoin d&apos;aide ?
            </div>
            <Link href={`/classroom/${classroomId}`} style={{
              display: "block", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)",
              borderRadius: 8, padding: "10px 14px", color: "#10b981", textDecoration: "none", fontSize: 12, fontWeight: 600,
            }}>
              💬 Poser une question au prof →
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
