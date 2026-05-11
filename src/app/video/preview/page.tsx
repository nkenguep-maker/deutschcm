"use client"
import { useState } from "react"
import dynamic from "next/dynamic"

const Player = dynamic(
  () => import("@remotion/player").then(m => m.Player),
  { ssr: false, loading: () => (
    <div style={{ aspectRatio:"16/9", background:"rgba(255,255,255,0.03)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:12 }}>⏳ Chargement du player...</p>
    </div>
  )}
)

const LessonSlide = dynamic(
  () => import("@/remotion/compositions/LessonSlide").then(m => m.LessonSlide),
  { ssr: false }
)

const VocabularySlide = dynamic(
  () => import("@/remotion/compositions/VocabularySlide").then(m => m.VocabularySlide),
  { ssr: false }
)

const GrammarSlide = dynamic(
  () => import("@/remotion/compositions/GrammarSlide").then(m => m.GrammarSlide),
  { ssr: false }
)

const QuizSlide = dynamic(
  () => import("@/remotion/compositions/QuizSlide").then(m => m.QuizSlide),
  { ssr: false }
)

const DEMO_WORDS = [
  { de: "Hallo", fr: "Bonjour", article: null, example: "Hallo, ich bin Paul!" },
  { de: "Guten Tag", fr: "Bonjour (formel)", article: null, example: "Guten Tag, Frau Müller." },
  { de: "Danke", fr: "Merci", article: null, example: "Danke schön!" },
  { de: "Bitte", fr: "S'il vous plaît", article: null, example: "Bitte kommen Sie herein." },
  { de: "Tschüss", fr: "Au revoir", article: null, example: "Tschüss, bis morgen!" }
]

const DEMO_TABLE = {
  headers: ["Pronom", "Forme", "Exemple"],
  rows: [
    ["ich", "bin", "Ich bin Student."],
    ["du", "bist", "Du bist nett."],
    ["er/sie/es", "ist", "Er ist Lehrer."],
    ["wir", "sind", "Wir sind Freunde."],
    ["ihr", "seid", "Ihr seid hier."],
    ["sie/Sie", "sind", "Sie sind willkommen."]
  ]
}

export default function VideoPreview() {
  const [activeSlide, setActiveSlide] = useState("intro")

  const slides = [
    { key: "intro", label: "🎬 Intro" },
    { key: "vocab", label: "📖 Vocabulaire" },
    { key: "grammar", label: "📝 Grammaire" },
    { key: "quiz", label: "❓ Quiz" },
  ]

  return (
    <div style={{
      minHeight: "100vh", background: "#080c10",
      padding: "40px 24px", fontFamily: "'DM Mono', monospace"
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono&display=swap')`}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h1 style={{ fontFamily:"'Syne',sans-serif", color:"white", fontSize:24, fontWeight:800, marginBottom:4 }}>
          🎬 Vidéos Cours — DeutschCM
        </h1>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, marginBottom:24 }}>
          Slides animées · Lektion 1 — Guten Tag! · A1
        </p>

        <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
          {slides.map(s => (
            <button key={s.key} onClick={() => setActiveSlide(s.key)}
              style={{
                padding:"8px 20px", borderRadius:99, fontSize:12, fontWeight:700,
                background: activeSlide === s.key
                  ? "linear-gradient(135deg,#10b981,#059669)"
                  : "rgba(255,255,255,0.05)",
                border: activeSlide === s.key ? "none" : "1px solid rgba(255,255,255,0.1)",
                color: activeSlide === s.key ? "white" : "rgba(255,255,255,0.5)",
                cursor:"pointer"
              }}>
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ borderRadius:20, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)" }}>
          {activeSlide === "intro" && (
            <Player
              component={LessonSlide as any}
              durationInFrames={300}
              fps={30}
              compositionWidth={1280}
              compositionHeight={720}
              style={{ width:"100%", aspectRatio:"16/9" }}
              controls
              inputProps={{
                title: "Guten Tag!",
                subtitle: "Salutations et présentations",
                level: "A1",
                manuel: "Netzwerk neu A1",
                lektion: 1
              }}
            />
          )}
          {activeSlide === "vocab" && (
            <Player
              component={VocabularySlide as any}
              durationInFrames={450}
              fps={30}
              compositionWidth={1280}
              compositionHeight={720}
              style={{ width:"100%", aspectRatio:"16/9" }}
              controls
              inputProps={{ words: DEMO_WORDS, level: "A1", title: "Vocabulaire — Lektion 1" }}
            />
          )}
          {activeSlide === "grammar" && (
            <Player
              component={GrammarSlide as any}
              durationInFrames={360}
              fps={30}
              compositionWidth={1280}
              compositionHeight={720}
              style={{ width:"100%", aspectRatio:"16/9" }}
              controls
              inputProps={{
                rule: "Conjugaison du verbe 'sein'",
                ruleDE: "Das Verb 'sein' im Präsens",
                level: "A1",
                table: DEMO_TABLE
              }}
            />
          )}
          {activeSlide === "quiz" && (
            <Player
              component={QuizSlide as any}
              durationInFrames={180}
              fps={30}
              compositionWidth={1280}
              compositionHeight={720}
              style={{ width:"100%", aspectRatio:"16/9" }}
              controls
              inputProps={{
                question: "Comment dit-on 'bonjour' formellement ?",
                options: ["Hallo", "Guten Tag", "Tschüss", "Danke"],
                correct: 1,
                explanation: "Guten Tag est la salutation formelle.",
                level: "A1"
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
