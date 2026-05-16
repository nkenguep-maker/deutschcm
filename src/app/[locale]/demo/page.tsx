"use client"
import { useState, useEffect } from "react"
import { Link } from "@/navigation"

// ── Demo data — static, believable, no real user data ────────────────────────

const DEMO_USER = {
  name: "Amara Diallo",
  initials: "AD",
  level: "A1",
  xp: 1_240,
  xpToNext: 2_000,
  streak: 7,
  completedModules: 9,
  totalModules: 24,
  avgScore: 76,
  city: "Douala",
}

const DEMO_SKILLS = [
  { label: "Lecture",         labelEN: "Reading",         score: 78, color: "#10b981" },
  { label: "Écoute",          labelEN: "Listening",       score: 64, color: "#3b82f6" },
  { label: "Expression orale",labelEN: "Speaking",        score: 71, color: "#8b5cf6" },
  { label: "Écriture",        labelEN: "Writing",         score: 68, color: "#f59e0b" },
  { label: "Grammaire",       labelEN: "Grammar",         score: 82, color: "#10b981" },
]

const DEMO_WEEKLY = [
  { day: "Lun", xp: 80,  modules: 1 },
  { day: "Mar", xp: 120, modules: 2 },
  { day: "Mer", xp: 40,  modules: 0 },
  { day: "Jeu", xp: 160, modules: 2 },
  { day: "Ven", xp: 200, modules: 3 },
  { day: "Sam", xp: 90,  modules: 1 },
  { day: "Dim", xp: 60,  modules: 1 },
]

const DEMO_COURSES = [
  { id: "a1-beta-1", icon: "👋", titleDE: "Willkommen!",       titleFR: "Begrüßungen",   progress: 100, level: "A1", color: "#10b981" },
  { id: "a1-beta-2", icon: "👨‍👩‍👧", titleDE: "Meine Familie",   titleFR: "Ma famille",    progress: 60,  level: "A1", color: "#10b981" },
  { id: "a1-beta-3", icon: "🕐", titleDE: "Mein Alltag",       titleFR: "Mon quotidien", progress: 20,  level: "A1", color: "#10b981" },
  { id: "a1-beta-4", icon: "🛒", titleDE: "Einkaufen & Essen", titleFR: "Shopping",      progress: 0,   level: "A1", color: "#10b981" },
  { id: "a1-beta-5", icon: "✈️", titleDE: "Deutschland-Reise", titleFR: "Voyage",        progress: 0,   level: "A1", color: "#10b981" },
  { id: "a2-1",      icon: "💼", titleDE: "Arbeit und Beruf",  titleFR: "Profession",    progress: 0,   level: "A2", color: "#14b8a6", locked: true },
]

const DEMO_BADGES = [
  { icon: "🎯", label: "Premier Quiz",   earned: true  },
  { icon: "🔥", label: "7 jours streak", earned: true  },
  { icon: "📖", label: "Lecteur",        earned: true  },
  { icon: "🗣️", label: "Orateur",        earned: true  },
  { icon: "⚡", label: "500 XP",         earned: false },
  { icon: "🏆", label: "Champion A1",    earned: false },
]

const DEMO_CONVERSATION = [
  { role: "agent", text: "Guten Tag! Ich bin Herr Bauer vom Deutschen Generalkonsulat. Bitte nehmen Sie Platz. Wie kann ich Ihnen helfen?", translation: "Bonjour ! Je suis M. Bauer du consulat général allemand. Veuillez vous asseoir. Comment puis-je vous aider ?", scores: null },
  { role: "user",  text: "Guten Tag, Herr Bauer. Ich heiße Amara Diallo. Ich möchte ein Studentenvisum beantragen.", translation: "Bonjour, M. Bauer. Je m'appelle Amara Diallo. Je voudrais demander un visa étudiant.", scores: { grammaire: 8.5, vocabulaire: 8, fluence: 7.5 } },
  { role: "agent", text: "Sehr gut, Herr Diallo. Haben Sie Ihre Dokumente dabei — Reisepass, Immatrikulationsbescheinigung und Finanzierungsnachweis?", translation: "Très bien, M. Diallo. Avez-vous vos documents — passeport, certificat d'inscription et justificatif financier ?", scores: null },
  { role: "user",  text: "Ja, natürlich. Hier sind meine Unterlagen. Ich studiere Informatik an der Universität Yaoundé.", translation: "Oui, bien sûr. Voici mes documents. J'étudie l'informatique à l'Université de Yaoundé.", scores: { grammaire: 9, vocabulaire: 8.5, fluence: 8 } },
]

const DEMO_PRONUNCIATION = {
  transcript: "Ich heiße Amara Diallo und ich komme aus Kamerun.",
  score_global: 8,
  score_grammaire: 9,
  score_vocabulaire: 8,
  score_prononciation: 7,
  texte_corrige: "Ich heiße Amara Diallo und ich komme aus Kamerun.",
  feedback_positif_fr: "Excellente structure de phrase et très bon vocabulaire !",
  conseil_fr: "Travaillez la prononciation du son 'ü' dans 'Amara' et des consonnes finales.",
  errors: [
    { type: "prononciation", original: "komme", correction: "komme", explication_fr: "La double consonne 'm' doit être bien articulée.", severite: "mineur" },
  ],
}

const DEMO_ACTIVITY = [
  { icon: "📖", title: "Willkommen! — Leçon",       score: 92, xp: 50,  done: true  },
  { icon: "🎧", title: "Willkommen! — Écoute",       score: 88, xp: 30,  done: true  },
  { icon: "🎙️", title: "Willkommen! — Expression",   score: 80, xp: 40,  done: true  },
  { icon: "✍️", title: "Willkommen! — Écriture",     score: 74, xp: 35,  done: true  },
  { icon: "🎯", title: "Willkommen! — Quiz",          score: 85, xp: 80,  done: true  },
  { icon: "📖", title: "Meine Familie — Leçon",       score: null, xp: 50, done: false },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEMO_WRITING = {
  task: "Vorstellung: Schreiben Sie 3–5 Sätze über sich selbst.",
  original: "Hallo! Ich heiße Amara. Ich ist aus Kamerun und ich haben 24 Jahre. Ich studiere Informatik. Ich sprechen ein bisschen Deutsch.",
  corrected: "Hallo! Ich heiße Amara. Ich bin aus Kamerun und ich bin 24 Jahre alt. Ich studiere Informatik. Ich spreche ein bisschen Deutsch.",
  score: 74,
  errors: [
    { orig: "ich ist aus", fix: "ich bin aus", type: "grammaire", sev: "majeur" },
    { orig: "ich haben 24", fix: "ich bin 24 Jahre alt", type: "grammaire", sev: "majeur" },
    { orig: "Ich sprechen", fix: "Ich spreche", type: "grammaire", sev: "mineur" },
  ],
  feedback_fr: "Très bonne structure de base ! Travaillez la conjugaison de sein (ich bin) et sprechen (ich spreche).",
  feedback_en: "Great basic structure! Work on the conjugation of sein (ich bin) and sprechen (ich spreche).",
}

const DEMO_ONBOARDING_STEPS = [
  { icon: "🌍", label: "Langue d'interface", labelEN: "Interface language", value: "Français", done: true },
  { icon: "🎯", label: "Objectif", labelEN: "Goal", value: "Visa étudiant Allemagne", done: true },
  { icon: "📊", label: "Test de niveau", labelEN: "Level test", value: "A1 détecté — 7/10", done: true },
  { icon: "👤", label: "Profil créé", labelEN: "Profile created", value: "Amara Diallo · Douala", done: true },
  { icon: "📖", label: "Première leçon", labelEN: "First lesson", value: "Willkommen! terminé — 92%", done: true },
]

const scoreColor = (s: number) => s >= 80 ? "#10b981" : s >= 65 ? "#f59e0b" : "#ef4444"
const scoreBg    = (s: number) => s >= 80 ? "rgba(16,185,129,0.12)" : s >= 65 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)"

type Tab = "onboarding" | "dashboard" | "simulator" | "pronunciation" | "writing" | "courses" | "progress"
const TABS: { id: Tab; label: string; labelEN: string; icon: string }[] = [
  { id: "onboarding",   label: "Démarrage",       labelEN: "Onboarding",   icon: "🚀" },
  { id: "dashboard",    label: "Tableau de bord",  labelEN: "Dashboard",    icon: "🏠" },
  { id: "simulator",    label: "Simulateur IA",    labelEN: "AI Simulator", icon: "🧑‍💼" },
  { id: "pronunciation",label: "Prononciation",    labelEN: "Speaking",     icon: "🎙️" },
  { id: "writing",      label: "Écriture IA",      labelEN: "AI Writing",   icon: "✍️" },
  { id: "courses",      label: "Cours",            labelEN: "Courses",      icon: "📖" },
  { id: "progress",     label: "Progression",      labelEN: "Progress",     icon: "📊" },
]

// ── Demo badge ────────────────────────────────────────────────────────────────

function DemoBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99, fontSize: "0.6rem", fontWeight: 700,
      background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
      color: "#f59e0b", fontFamily: "'Syne',sans-serif", letterSpacing: "0.08em",
    }}>
      ● DEMO
    </span>
  )
}

// ── Animated bar ──────────────────────────────────────────────────────────────

function Bar({ pct, color, height = 6 }: { pct: number; color: string; height?: number }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(pct), 200); return () => clearTimeout(t) }, [pct])
  return (
    <div style={{ height, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 99, transition: "width 0.9s ease-out", boxShadow: `0 0 8px ${color}66` }} />
    </div>
  )
}

// ── Screens ───────────────────────────────────────────────────────────────────

function DashboardScreen({ isMobile }: { isMobile: boolean }) {
  const xpPct = Math.round((DEMO_USER.xp / DEMO_USER.xpToNext) * 100)
  const modPct = Math.round((DEMO_USER.completedModules / DEMO_USER.totalModules) * 100)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Profile card */}
      <div style={{ padding: "20px 24px", borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,0.12),transparent)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg,rgba(16,185,129,0.25),rgba(5,150,105,0.1))", border: "1px solid rgba(16,185,129,0.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.1rem", flexShrink: 0 }}>
            {DEMO_USER.initials}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>{DEMO_USER.name}</p>
            <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.35)", fontSize: "0.68rem" }}>Apprenant · Niveau {DEMO_USER.level} · {DEMO_USER.city}</p>
          </div>
          <DemoBadge />
        </div>

        {/* XP bar */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#f59e0b", fontSize: "0.7rem", fontWeight: 700 }}>⚡ {DEMO_USER.xp.toLocaleString()} XP</span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem" }}>{xpPct}% vers A2</span>
          </div>
          <Bar pct={xpPct} color="linear-gradient(90deg,#d97706,#f59e0b)" />
        </div>
      </div>

      {/* Stat pills */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[
          { value: `${DEMO_USER.streak}j`,    label: "Streak",    color: "#f97316", icon: "🔥" },
          { value: `${modPct}%`,              label: "Modules",   color: "#10b981", icon: "📖" },
          { value: `${DEMO_USER.avgScore}%`,  label: "Moy. quiz", color: "#8b5cf6", icon: "🎯" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "14px 12px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
            <div style={{ fontSize: "1.1rem", marginBottom: 4 }}>{s.icon}</div>
            <p style={{ margin: 0, color: s.color, fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.3rem" }}>{s.value}</p>
            <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.3)", fontSize: "0.6rem" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly XP bars */}
      <div style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p style={{ margin: "0 0 14px", color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>XP cette semaine</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
          {DEMO_WEEKLY.map((d, i) => {
            const maxXP = Math.max(...DEMO_WEEKLY.map(x => x.xp))
            const h = Math.round((d.xp / maxXP) * 52)
            const isToday = i === 4
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", height: h, borderRadius: "6px 6px 0 0", background: isToday ? "#10b981" : "rgba(16,185,129,0.25)", boxShadow: isToday ? "0 0 12px rgba(16,185,129,0.4)" : "none", transition: "height 0.8s ease-out" }} />
                <span style={{ color: isToday ? "#10b981" : "rgba(255,255,255,0.3)", fontSize: "0.55rem", fontWeight: isToday ? 700 : 400 }}>{d.day}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Activité récente</p>
        {DEMO_ACTIVITY.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < DEMO_ACTIVITY.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
            <span style={{ fontSize: "1rem", width: 20, textAlign: "center" }}>{a.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, color: a.done ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.35)", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</p>
            </div>
            {a.done && a.score ? (
              <span style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: 6, background: scoreBg(a.score), color: scoreColor(a.score), fontWeight: 700, flexShrink: 0 }}>{a.score}%</span>
            ) : !a.done ? (
              <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>En cours…</span>
            ) : null}
            {a.done && <span style={{ fontSize: "0.62rem", color: "#f59e0b", flexShrink: 0 }}>+{a.xp}</span>}
          </div>
        ))}
      </div>

      {/* Badges */}
      <div style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Badges</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {DEMO_BADGES.map((b, i) => (
            <div key={i} style={{ padding: "10px 8px", borderRadius: 12, textAlign: "center", background: b.earned ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${b.earned ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)"}`, opacity: b.earned ? 1 : 0.4 }}>
              <div style={{ fontSize: "1.3rem", marginBottom: 4 }}>{b.icon}</div>
              <p style={{ margin: 0, color: b.earned ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)", fontSize: "0.58rem", lineHeight: 1.3 }}>{b.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SimulatorScreen() {
  const [typing, setTyping] = useState(true)
  useEffect(() => { const t = setTimeout(() => setTyping(false), 1200); return () => clearTimeout(t) }, [])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Header */}
      <div style={{ padding: "14px 18px", borderRadius: 14, background: "linear-gradient(135deg,rgba(16,185,129,0.06),rgba(5,150,105,0.02))", border: "1px solid rgba(16,185,129,0.15)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>🧑‍💼</div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.85rem" }}>Herr Bauer</p>
          <p style={{ margin: "1px 0 0", color: "#10b981", fontSize: "0.62rem" }}>Consul IA — Consulat Général d&apos;Allemagne · Visa Étudiant</p>
        </div>
        <DemoBadge />
      </div>

      {/* Conversation */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "4px 0" }}>
        {DEMO_CONVERSATION.map((msg, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
              {msg.role === "agent" && (
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", flexShrink: 0 }}>🧑‍💼</div>
              )}
              <div style={{ maxWidth: "82%", padding: "11px 15px", borderRadius: msg.role === "agent" ? "18px 18px 18px 4px" : "18px 18px 4px 18px", background: msg.role === "agent" ? "rgba(255,255,255,0.04)" : "rgba(16,185,129,0.12)", border: msg.role === "agent" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(16,185,129,0.25)" }}>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.88)", fontSize: "0.78rem", lineHeight: 1.6 }}>{msg.text}</p>
                <p style={{ margin: "5px 0 0", color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", fontStyle: "italic", lineHeight: 1.4 }}>{msg.translation}</p>
              </div>
            </div>
            {msg.scores && (
              <div style={{ display: "flex", gap: 6, marginRight: 4 }}>
                {Object.entries(msg.scores).map(([k, v]) => (
                  <span key={k} style={{ fontSize: "0.6rem", padding: "2px 8px", borderRadius: 20, background: scoreBg(v * 10), color: scoreColor(v * 10), border: `1px solid ${scoreColor(v * 10)}33`, fontWeight: 700 }}>
                    {k === "grammaire" ? "G" : k === "vocabulaire" ? "V" : "F"} {v}/10
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>🧑‍💼</div>
            <div style={{ padding: "10px 16px", borderRadius: "18px 18px 18px 4px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 5, alignItems: "center" }}>
              <style>{`@keyframes db{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}.db{width:5px;height:5px;border-radius:50%;background:#10b981;animation:db 1.2s infinite}.db:nth-child(2){animation-delay:.2s}.db:nth-child(3){animation-delay:.4s}`}</style>
              <div className="db" /><div className="db" /><div className="db" />
            </div>
          </div>
        )}
      </div>

      {/* Input mock */}
      <div style={{ padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.2)", fontSize: "0.75rem", fontStyle: "italic" }}>Parlez en allemand ou écrivez votre réponse…</p>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>🎙️</div>
      </div>

      {/* Session score */}
      <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 16, justifyContent: "center" }}>
        {[{ label: "Grammaire", v: 8.5 }, { label: "Vocabulaire", v: 8.0 }, { label: "Fluidité", v: 7.5 }].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <p style={{ margin: 0, color: scoreColor(s.v * 10), fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.3rem" }}>{s.v}</p>
            <p style={{ margin: "1px 0 0", color: "rgba(255,255,255,0.3)", fontSize: "0.6rem" }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PronunciationScreen() {
  const p = DEMO_PRONUNCIATION
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Analyse de prononciation</p>
        <DemoBadge />
      </div>

      {/* Transcript */}
      <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)" }}>
        <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.35)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Vous avez dit</p>
        <p style={{ margin: 0, color: "white", fontSize: "0.9rem", lineHeight: 1.5, fontStyle: "italic" }}>&ldquo;{p.transcript}&rdquo;</p>
      </div>

      {/* Scores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
        {[
          { label: "Score global",       v: p.score_global,         icon: "🌟" },
          { label: "Grammaire",          v: p.score_grammaire,       icon: "📝" },
          { label: "Vocabulaire",        v: p.score_vocabulaire,     icon: "📚" },
          { label: "Prononciation",      v: p.score_prononciation,   icon: "🎙️" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${scoreColor(s.v * 10)}33`, textAlign: "center" }}>
            <div style={{ fontSize: "1.1rem", marginBottom: 6 }}>{s.icon}</div>
            <p style={{ margin: 0, color: scoreColor(s.v * 10), fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.8rem" }}>{s.v}</p>
            <p style={{ margin: "1px 0 0", color: "rgba(255,255,255,0.35)", fontSize: "0.6rem" }}>/10 · {s.label}</p>
          </div>
        ))}
      </div>

      {/* Feedback */}
      <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <p style={{ margin: "0 0 6px", color: "#10b981", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Point positif</p>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "0.78rem", lineHeight: 1.6 }}>{p.feedback_positif_fr}</p>
      </div>
      <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <p style={{ margin: "0 0 6px", color: "#f59e0b", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Conseil</p>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "0.78rem", lineHeight: 1.6 }}>{p.conseil_fr}</p>
      </div>

      {/* Error list */}
      <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.35)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Points à améliorer</p>
        {p.errors.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", marginBottom: 6 }}>
            <span style={{ color: "#f59e0b", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0 }}>⚠ {e.type}</span>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", lineHeight: 1.5 }}>{e.explication_fr}</p>
          </div>
        ))}
        <p style={{ margin: "8px 0 0", color: "#10b981", fontSize: "0.72rem" }}>✓ Aucune erreur de conjugaison détectée</p>
      </div>

      {/* Mock mic button */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 4 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "2px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", boxShadow: "0 0 24px rgba(16,185,129,0.2)" }}>🎙️</div>
      </div>
    </div>
  )
}

function CoursesScreen({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Piste Bêta A1 — Yema Languages</p>
        <DemoBadge />
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8 }}>
        {["Tous", "A1", "A2"].map((f, i) => (
          <span key={i} style={{ padding: "5px 14px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 600, fontFamily: "'Syne',sans-serif", background: i === 0 ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)", color: i === 0 ? "#10b981" : "rgba(255,255,255,0.4)", border: `1px solid ${i === 0 ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.07)"}` }}>
            {f}
          </span>
        ))}
      </div>

      {/* Course cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: 10 }}>
        {DEMO_COURSES.map((c, i) => (
          <div key={i} style={{ padding: "14px", borderRadius: 16, background: c.locked ? "rgba(255,255,255,0.02)" : "linear-gradient(135deg,rgba(16,185,129,0.04),rgba(255,255,255,0.02))", border: `1px solid ${c.locked ? "rgba(255,255,255,0.05)" : "rgba(16,185,129,0.15)"}`, opacity: c.locked ? 0.5 : 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", background: c.locked ? "rgba(255,255,255,0.03)" : "rgba(16,185,129,0.08)", border: `1px solid ${c.locked ? "rgba(255,255,255,0.06)" : "rgba(16,185,129,0.2)"}` }}>
                {c.locked ? "🔒" : c.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.titleDE}</p>
                <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.35)", fontSize: "0.62rem" }}>{c.titleFR}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              <span style={{ fontSize: "0.58rem", padding: "2px 7px", borderRadius: 5, background: "rgba(16,185,129,0.08)", color: "#10b981" }}>{c.level}</span>
              <span style={{ fontSize: "0.58rem", padding: "2px 7px", borderRadius: 5, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)" }}>5 modules</span>
            </div>
            {!c.locked && (
              <div>
                <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${c.progress}%`, background: "#10b981", borderRadius: 99, boxShadow: c.progress > 0 ? "0 0 6px rgba(16,185,129,0.5)" : "none" }} />
                </div>
                <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.22)", fontSize: "0.58rem" }}>
                  {c.progress === 0 ? "Non commencé" : c.progress === 100 ? "Terminé ✓" : `${c.progress}% complété`}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CEFR disclaimer */}
      <p style={{ margin: 0, color: "rgba(255,255,255,0.18)", fontSize: "0.6rem", textAlign: "center", lineHeight: 1.5 }}>
        Yema Languages — pratique CEFR indépendante · non affiliée à un organisme officiel d&apos;examen
      </p>
    </div>
  )
}

function ProgressScreen({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Progression — Niveau A1</p>
        <DemoBadge />
      </div>

      {/* Global level card */}
      <div style={{ padding: "20px 22px", borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,0.1),transparent)", pointerEvents: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Niveau actuel</p>
            <p style={{ margin: "4px 0 0", color: "#10b981", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "2.2rem" }}>A1</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "2.4rem" }}>62%</p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: "0.68rem" }}>vers A2</p>
          </div>
        </div>
        <Bar pct={62} color="linear-gradient(90deg,#059669,#10b981,#34d399)" height={10} />
        <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.3)", fontSize: "0.65rem" }}>
          9/24 modules · 1 240 / 2 000 XP
        </p>
      </div>

      {/* Skill breakdown */}
      <div style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p style={{ margin: "0 0 14px", color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Compétences CEFR</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {DEMO_SKILLS.map((s, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.72rem" }}>{s.label}</span>
                <span style={{ color: scoreColor(s.score), fontSize: "0.72rem", fontWeight: 700 }}>{s.score}%</span>
              </div>
              <Bar pct={s.score} color={s.color} height={6} />
            </div>
          ))}
        </div>
      </div>

      {/* Quiz history pills */}
      <div style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Derniers quiz</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[92, 85, 74, 88, 60, 96, 78, 82].map((score, i) => (
            <div key={i} style={{ padding: "6px 12px", borderRadius: 8, background: scoreBg(score), border: `1px solid ${scoreColor(score)}33`, textAlign: "center" }}>
              <p style={{ margin: 0, color: scoreColor(score), fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.85rem" }}>{score}%</p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.25)", fontSize: "0.55rem" }}>Quiz {i + 1}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Simulator history */}
      <div style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Sessions simulateur</p>
        {[
          { scenario: "Visa Étudiant", g: 8.5, v: 8.0, f: 7.5 },
          { scenario: "Au Restaurant", g: 7.0, v: 7.5, f: 6.8 },
          { scenario: "À la Gare",    g: 9.0, v: 8.5, f: 8.0 },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
            <span style={{ fontSize: "0.75rem" }}>🧑‍💼</span>
            <span style={{ flex: 1, color: "rgba(255,255,255,0.65)", fontSize: "0.72rem" }}>{s.scenario}</span>
            {[{ l: "G", v: s.g }, { l: "V", v: s.v }, { l: "F", v: s.f }].map((sc, j) => (
              <span key={j} style={{ fontSize: "0.62rem", padding: "2px 6px", borderRadius: 6, background: scoreBg(sc.v * 10), color: scoreColor(sc.v * 10), fontWeight: 700 }}>{sc.l} {sc.v}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function OnboardingScreen({ lang }: { lang: "fr" | "en" }) {
  const [revealed, setRevealed] = useState(false)
  useEffect(() => { const t = setTimeout(() => setRevealed(true), 400); return () => clearTimeout(t) }, [])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {lang === "fr" ? "Configuration de votre profil" : "Setting up your profile"}
        </p>
        <DemoBadge />
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {DEMO_ONBOARDING_STEPS.map((step, i) => (
          <div key={i} style={{ padding: "13px 16px", borderRadius: 14, background: revealed ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.03)", border: `1px solid ${revealed ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.07)"}`, display: "flex", alignItems: "center", gap: 14, transition: "all 0.4s ease", transitionDelay: `${i * 80}ms` }}>
            <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{step.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>{lang === "fr" ? step.label : step.labelEN}</p>
              <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.85)", fontSize: "0.8rem", fontWeight: 600 }}>{step.value}</p>
            </div>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: revealed ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)", border: `1.5px solid ${revealed ? "#10b981" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", flexShrink: 0, transition: "all 0.4s ease", transitionDelay: `${i * 80}ms` }}>
              {revealed ? "✓" : ""}
            </div>
          </div>
        ))}
      </div>

      {/* Celebration card */}
      <div style={{ padding: "22px 20px", borderRadius: 18, background: "linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.04))", border: "1px solid rgba(16,185,129,0.25)", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -50, left: "50%", transform: "translateX(-50%)", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,0.08),transparent)", pointerEvents: "none" }} />
        <p style={{ margin: "0 0 8px", fontSize: "2.2rem" }}>🎉</p>
        <p style={{ margin: "0 0 6px", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "white" }}>
          {lang === "fr" ? "Profil configuré !" : "Profile complete!"}
        </p>
        <p style={{ margin: "0 0 16px", color: "rgba(255,255,255,0.45)", fontSize: "0.78rem", lineHeight: 1.6 }}>
          {lang === "fr" ? "Niveau A1 confirmé. Votre parcours vers le visa étudiant commence maintenant." : "A1 level confirmed. Your path to the student visa starts now."}
        </p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 99, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
          <span style={{ color: "#f59e0b", fontSize: "1rem" }}>⚡</span>
          <span style={{ color: "#f59e0b", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "0.9rem" }}>+150 XP</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>bonus démarrage</span>
        </div>
      </div>

      {/* Level badge */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ padding: "16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{lang === "fr" ? "Niveau" : "Level"}</p>
          <p style={{ margin: 0, color: "#10b981", fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: "2rem" }}>A1</p>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "0.6rem" }}>CEFR certified</p>
        </div>
        <div style={{ padding: "16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{lang === "fr" ? "Objectif" : "Goal"}</p>
          <p style={{ margin: 0, fontSize: "1.8rem" }}>✈️</p>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "0.62rem", lineHeight: 1.4 }}>Visa étudiant<br/>Allemagne</p>
        </div>
      </div>

      {/* Next step hint */}
      <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: "1rem", flexShrink: 0 }}>💡</span>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", lineHeight: 1.5 }}>
          {lang === "fr" ? "Prochaine étape : Leçon 2 — Meine Familie (5 modules)" : "Next up: Lesson 2 — Meine Familie (5 modules)"}
        </p>
      </div>
    </div>
  )
}

function WritingScreen({ lang }: { lang: "fr" | "en" }) {
  const w = DEMO_WRITING

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {lang === "fr" ? "Correction écriture IA" : "AI Writing Correction"}
        </p>
        <DemoBadge />
      </div>

      {/* Task */}
      <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.18)" }}>
        <p style={{ margin: "0 0 3px", color: "rgba(255,255,255,0.35)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{lang === "fr" ? "Consigne" : "Task"}</p>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "0.78rem" }}>{w.task}</p>
      </div>

      {/* Score ring */}
      <div style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 68, height: 68, borderRadius: "50%", background: `conic-gradient(${scoreColor(w.score)} ${w.score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#0d1117", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <p style={{ margin: 0, color: scoreColor(w.score), fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.2rem" }}>{w.score}</p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "0.5rem" }}>/100</p>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", fontWeight: 600 }}>
            {lang === "fr" ? "Score global" : "Overall score"}
          </p>
          {[
            { l: lang === "fr" ? "Contenu" : "Content", v: 18, max: 25, c: "#10b981" },
            { l: lang === "fr" ? "Grammaire" : "Grammar", v: 14, max: 25, c: "#f59e0b" },
            { l: lang === "fr" ? "Vocabulaire" : "Vocabulary", v: 22, max: 25, c: "#10b981" },
            { l: lang === "fr" ? "Format" : "Format", v: 20, max: 25, c: "#10b981" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.6rem", width: 60, flexShrink: 0 }}>{s.l}</span>
              <div style={{ flex: 1, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(s.v / s.max) * 100}%`, background: s.c, borderRadius: 99 }} />
              </div>
              <span style={{ color: s.c, fontSize: "0.6rem", fontWeight: 700, width: 28, flexShrink: 0, textAlign: "right" }}>{s.v}/{s.max}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Original vs corrected */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ padding: "13px 16px", borderRadius: 12, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.18)" }}>
          <p style={{ margin: "0 0 5px", color: "#ef4444", fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{lang === "fr" ? "Votre texte" : "Your text"}</p>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: "0.76rem", lineHeight: 1.7 }}>
            Hallo! Ich heiße Amara. <span style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", borderRadius: 3, padding: "0 2px", textDecoration: "line-through" }}>Ich ist</span> aus Kamerun und <span style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", borderRadius: 3, padding: "0 2px", textDecoration: "line-through" }}>ich haben</span> 24 Jahre. Ich studiere Informatik. <span style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", borderRadius: 3, padding: "0 2px", textDecoration: "line-through" }}>Ich sprechen</span> ein bisschen Deutsch.
          </p>
        </div>
        <div style={{ padding: "13px 16px", borderRadius: 12, background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <p style={{ margin: "0 0 5px", color: "#10b981", fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{lang === "fr" ? "Texte corrigé" : "Corrected text"}</p>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: "0.76rem", lineHeight: 1.7 }}>
            Hallo! Ich heiße Amara. <span style={{ background: "rgba(16,185,129,0.2)", color: "#6ee7b7", borderRadius: 3, padding: "0 2px" }}>Ich bin</span> aus Kamerun und <span style={{ background: "rgba(16,185,129,0.2)", color: "#6ee7b7", borderRadius: 3, padding: "0 2px" }}>ich bin 24 Jahre alt</span>. Ich studiere Informatik. <span style={{ background: "rgba(16,185,129,0.2)", color: "#6ee7b7", borderRadius: 3, padding: "0 2px" }}>Ich spreche</span> ein bisschen Deutsch.
          </p>
        </div>
      </div>

      {/* Errors */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {w.errors.map((e, i) => (
          <div key={i} style={{ padding: "10px 14px", borderRadius: 11, background: e.sev === "majeur" ? "rgba(239,68,68,0.05)" : "rgba(245,158,11,0.05)", border: `1px solid ${e.sev === "majeur" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.18)"}`, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: e.sev === "majeur" ? "#ef4444" : "#f59e0b", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0, paddingTop: 1 }}>{e.sev === "majeur" ? "●" : "○"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ color: "#fca5a5", fontSize: "0.73rem", textDecoration: "line-through" }}>{e.orig}</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem" }}>→</span>
                <span style={{ color: "#6ee7b7", fontSize: "0.73rem", fontWeight: 600 }}>{e.fix}</span>
              </div>
              <span style={{ fontSize: "0.6rem", padding: "1px 7px", borderRadius: 5, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" }}>{e.type}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Feedback */}
      <div style={{ padding: "13px 16px", borderRadius: 12, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.18)" }}>
        <p style={{ margin: "0 0 4px", color: "#10b981", fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Feedback IA</p>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: "0.76rem", lineHeight: 1.6 }}>{lang === "fr" ? w.feedback_fr : w.feedback_en}</p>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [tab, setTab] = useState<Tab>("onboarding")
  const [isMobile, setIsMobile] = useState(false)
  const [lang, setLang] = useState<"fr" | "en">("fr")

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const activeTab = TABS.find(t => t.id === tab)!

  return (
    <div style={{ minHeight: "100vh", background: "#080c10", fontFamily: "'DM Mono',monospace", color: "white" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{display:none;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .screen{animation:fadeIn 0.3s ease both}
      `}</style>

      {/* Top nav */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,12,16,0.96)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: isMobile ? "12px 16px" : "14px 32px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ fontSize: "1.2rem" }}>🇩🇪</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, color: "white", fontSize: "1rem" }}>Yema</span>
          </Link>
          <div style={{ flex: 1 }} />
          {/* Lang toggle */}
          <button onClick={() => setLang(l => l === "fr" ? "en" : "fr")} style={{ padding: "4px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", cursor: "pointer" }}>
            {lang === "fr" ? "EN" : "FR"}
          </button>
          <span style={{ padding: "4px 12px", borderRadius: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", fontSize: "0.68rem", fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>
            DEMO PREVIEW
          </span>
        </div>
      </div>

      {/* Hero header */}
      <div style={{ padding: isMobile ? "28px 16px 20px" : "36px 32px 24px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 14px", borderRadius: 99, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: 14 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
          <span style={{ color: "#10b981", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em" }}>
            {lang === "fr" ? "Aperçu Bêta · Yema Languages" : "Beta Preview · Yema Languages"}
          </span>
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: isMobile ? "1.6rem" : "2.2rem", color: "white", lineHeight: 1.15, marginBottom: 10 }}>
          {lang === "fr" ? "L'allemand conçu pour le Cameroun" : "German designed for Cameroon"}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", lineHeight: 1.6 }}>
          {lang === "fr"
            ? "Simulateur ambassade IA · Correction vocale · Quiz adaptatif · CEFR A1→C1"
            : "AI embassy simulator · Voice correction · Adaptive quiz · CEFR A1→C1"}
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ padding: isMobile ? "0 8px" : "0 32px", maxWidth: 680 + 64, margin: "0 auto", overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 4, padding: "0 0 2px", borderBottom: "1px solid rgba(255,255,255,0.06)", minWidth: "max-content" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: isMobile ? "9px 12px" : "10px 18px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer", background: tab === t.id ? "rgba(16,185,129,0.1)" : "transparent", borderBottom: tab === t.id ? "2px solid #10b981" : "2px solid transparent", color: tab === t.id ? "#10b981" : "rgba(255,255,255,0.35)", fontSize: "0.72rem", fontFamily: "'Syne',sans-serif", fontWeight: tab === t.id ? 700 : 400, display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s", whiteSpace: "nowrap" }}>
              <span>{t.icon}</span>
              <span>{lang === "fr" ? t.label : t.labelEN}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Screen content — phone mockup on desktop */}
      <div style={{ padding: isMobile ? "20px 12px 40px" : "28px 32px 60px", maxWidth: 680, margin: "0 auto" }}>
        {isMobile ? (
          <div className="screen" key={tab}>
            {tab === "onboarding"   && <OnboardingScreen lang={lang} />}
            {tab === "dashboard"    && <DashboardScreen isMobile={true} />}
            {tab === "simulator"    && <SimulatorScreen />}
            {tab === "pronunciation"&& <PronunciationScreen />}
            {tab === "writing"      && <WritingScreen lang={lang} />}
            {tab === "courses"      && <CoursesScreen isMobile={true} />}
            {tab === "progress"     && <ProgressScreen isMobile={true} />}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 24 }}>
            {/* Phone frame */}
            <div style={{ width: 320, flexShrink: 0, borderRadius: 40, background: "#0d1117", border: "1.5px solid rgba(255,255,255,0.12)", boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 60px rgba(16,185,129,0.06)", overflow: "hidden", position: "relative" }}>
              {/* Status bar */}
              <div style={{ height: 32, background: "#0d1117", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.6rem", fontWeight: 600 }}>9:41</span>
                <div style={{ width: 70, height: 9, borderRadius: 99, background: "rgba(255,255,255,0.07)" }} />
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.55rem" }}>●●●</span>
                </div>
              </div>
              <div style={{ height: 572, overflowY: "auto", padding: "14px 14px 20px" }}>
                <div className="screen" key={tab}>
                  {tab === "onboarding"   && <OnboardingScreen lang={lang} />}
                  {tab === "dashboard"    && <DashboardScreen isMobile={true} />}
                  {tab === "simulator"    && <SimulatorScreen />}
                  {tab === "pronunciation"&& <PronunciationScreen />}
                  {tab === "writing"      && <WritingScreen lang={lang} />}
                  {tab === "courses"      && <CoursesScreen isMobile={true} />}
                  {tab === "progress"     && <ProgressScreen isMobile={true} />}
                </div>
              </div>
              {/* Home bar */}
              <div style={{ height: 28, background: "#0d1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 100, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.12)" }} />
              </div>
            </div>

            {/* Feature info panel */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20, paddingTop: 16 }}>
              <div>
                <span style={{ fontSize: "2rem" }}>{activeTab.icon}</span>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "white", margin: "10px 0 8px" }}>
                  {lang === "fr" ? activeTab.label : activeTab.labelEN}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", lineHeight: 1.7, marginBottom: 20 }}>
                  {tab === "onboarding"   && (lang === "fr" ? "En 5 minutes : test de niveau, objectif personnalisé et première leçon. Zéro configuration technique." : "In 5 minutes: level test, personalised goal and first lesson. Zero technical setup.")}
                  {tab === "dashboard"    && (lang === "fr" ? "Suivez vos XP, streak et progression par compétence en temps réel." : "Track your XP, streak and skill progress in real time.")}
                  {tab === "simulator"    && (lang === "fr" ? "Simulez un entretien consulaire avec Herr Bauer, consul allemand IA. Scoring grammaire, vocabulaire et fluidité." : "Simulate a consular interview with Herr Bauer, AI German consul. Grammar, vocabulary and fluency scoring.")}
                  {tab === "pronunciation"&& (lang === "fr" ? "Parlez en allemand et recevez un feedback IA instantané sur votre prononciation, grammaire et vocabulaire." : "Speak German and receive instant AI feedback on pronunciation, grammar and vocabulary.")}
                  {tab === "writing"      && (lang === "fr" ? "Écrivez en allemand et recevez une correction IA mot par mot — erreurs surlignées en rouge, corrections en vert." : "Write in German and receive word-by-word AI correction — errors highlighted in red, fixes in green.")}
                  {tab === "courses"      && (lang === "fr" ? "5 leçons originales A1 : vocabulaire, lecture, écoute, expression orale et écrite + quiz adaptatif 8 questions." : "5 original A1 lessons: vocabulary, reading, listening, speaking, writing + 8-question adaptive quiz.")}
                  {tab === "progress"     && (lang === "fr" ? "Visualisez votre évolution par compétence CEFR et suivez votre trajectoire vers A2." : "Visualise your CEFR skill evolution and track your path to A2.")}
                </p>
              </div>

              {/* Feature bullets */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(tab === "onboarding" ? [
                  lang === "fr" ? "🎯 Objectif visa ou études personnalisé" : "🎯 Personalised visa or study goal",
                  lang === "fr" ? "📊 Test de niveau CEFR en 10 questions" : "📊 10-question CEFR level test",
                  lang === "fr" ? "⚡ +150 XP bonus de bienvenue" : "⚡ +150 XP welcome bonus",
                  lang === "fr" ? "🚀 Première leçon débloquée immédiatement" : "🚀 First lesson unlocked immediately",
                ] : tab === "dashboard" ? [
                  lang === "fr" ? "🔥 Streak quotidien motivant" : "🔥 Daily motivating streak",
                  lang === "fr" ? "⚡ Points XP par activité" : "⚡ XP points per activity",
                  lang === "fr" ? "🏆 Système de badges" : "🏆 Badge achievement system",
                  lang === "fr" ? "📊 Historique d'activité" : "📊 Activity history",
                ] : tab === "simulator" ? [
                  lang === "fr" ? "🧑‍💼 Herr Bauer — consul IA réaliste" : "🧑‍💼 Herr Bauer — realistic AI consul",
                  lang === "fr" ? "📝 Scoring Grammaire · Vocab · Fluidité" : "📝 Grammar · Vocab · Fluency scoring",
                  lang === "fr" ? "🇫🇷 Traduction française en temps réel" : "🇫🇷 Real-time French translation",
                  lang === "fr" ? "🎯 Scenarios visa, études, tourisme" : "🎯 Visa, study, tourism scenarios",
                ] : tab === "pronunciation" ? [
                  lang === "fr" ? "🎙️ Analyse vocale IA en secondes" : "🎙️ AI voice analysis in seconds",
                  lang === "fr" ? "✅ Correction grammaire automatique" : "✅ Automatic grammar correction",
                  lang === "fr" ? "💡 Conseils personnalisés EN/FR" : "💡 Personalised EN/FR advice",
                  lang === "fr" ? "🔒 Aucune forme incorrecte retournée" : "🔒 No incorrect German returned",
                ] : tab === "writing" ? [
                  lang === "fr" ? "✍️ Correction mot par mot surlignée" : "✍️ Word-by-word highlighted correction",
                  lang === "fr" ? "🔴 Erreurs en rouge, corrections en vert" : "🔴 Errors in red, fixes in green",
                  lang === "fr" ? "📊 Score contenu/grammaire/vocab/format" : "📊 Content/grammar/vocab/format score",
                  lang === "fr" ? "💡 Feedback IA bilingue FR/EN" : "💡 Bilingual FR/EN AI feedback",
                ] : tab === "courses" ? [
                  lang === "fr" ? "📖 Vocabulaire + lecture originaux" : "📖 Original vocabulary + reading",
                  lang === "fr" ? "🎧 Dialogues audio natifs" : "🎧 Native audio dialogues",
                  lang === "fr" ? "✍️ Exercices écriture + IA" : "✍️ Writing exercises + AI",
                  lang === "fr" ? "🎯 Quiz 8 questions adaptatif" : "🎯 8-question adaptive quiz",
                ] : [
                  lang === "fr" ? "📈 5 compétences CEFR tracées" : "📈 5 CEFR skills tracked",
                  lang === "fr" ? "🏅 Historique quiz et simulateur" : "🏅 Quiz and simulator history",
                  lang === "fr" ? "🎯 Progression vers A2 visible" : "🎯 Visible A2 progression",
                  lang === "fr" ? "📊 Barres animées par compétence" : "📊 Animated per-skill bars",
                ]).map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.78rem" }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href="/register" style={{ padding: "13px 24px", borderRadius: 12, background: "linear-gradient(135deg,#10b981,#059669)", color: "white", textAlign: "center", textDecoration: "none", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.85rem", boxShadow: "0 6px 24px rgba(16,185,129,0.3)", display: "block" }}>
                  {lang === "fr" ? "Commencer gratuitement →" : "Get started for free →"}
                </Link>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.2)", fontSize: "0.62rem", textAlign: "center", lineHeight: 1.5 }}>
                  {lang === "fr"
                    ? "Aperçu démo — les données affichées sont fictives à des fins de présentation uniquement."
                    : "Demo preview — all data shown is fictional for presentation purposes only."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile: lang toggle */}
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
            <button onClick={() => setLang(l => l === "fr" ? "en" : "fr")} style={{ padding: "6px 20px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", cursor: "pointer" }}>
              {lang === "fr" ? "Switch to English" : "Passer en français"}
            </button>
          </div>
        )}

        {/* Mobile CTA */}
        {isMobile && (
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/register" style={{ padding: "14px", borderRadius: 14, background: "linear-gradient(135deg,#10b981,#059669)", color: "white", textAlign: "center", textDecoration: "none", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.9rem", boxShadow: "0 6px 24px rgba(16,185,129,0.3)", display: "block" }}>
              {lang === "fr" ? "Commencer gratuitement →" : "Get started for free →"}
            </Link>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.2)", fontSize: "0.62rem", textAlign: "center" }}>
              {lang === "fr" ? "Aperçu démo — données fictives" : "Demo preview — fictional data"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
