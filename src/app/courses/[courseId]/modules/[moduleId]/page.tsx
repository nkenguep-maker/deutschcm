"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import dynamic from "next/dynamic"
import AudioPlayer from "@/components/AudioPlayer"
import VoiceRecorder from "@/components/VoiceRecorder"
import SchreibenEditor from "@/components/SchreibenEditor"

const AdaptiveQuiz = dynamic(() => import("@/components/AdaptiveQuiz"), { ssr: false })
const DialogPlayer = dynamic(() => import("@/components/DialogPlayer"), { ssr: false })

// ─── Types ───────────────────────────────────────────────
type ModuleType = "LESSON" | "QUIZ" | "CONVERSATION" | "HOEREN" | "SCHREIBEN" | "VIDEO"

interface Module {
  id: string
  title: string
  titleDE: string
  type: ModuleType
  level: string
  topic: string
  xpReward: number
  duration: number
  content: any
}

// ─── Données démo ────────────────────────────────────────
const DEMO_MODULES: Record<string, Module> = {
  "lektion-1-lesen": {
    id: "lektion-1-lesen",
    title: "Guten Tag! — Leçon",
    titleDE: "Lektion 1 — Lesen & Grammatik",
    type: "LESSON",
    level: "A1",
    topic: "Salutations et présentations",
    xpReward: 50,
    duration: 15,
    content: {
      introduction: "Dans cette leçon, vous apprendrez les salutations de base en allemand et comment vous présenter.",
      kulturhinweis: "En Allemagne, on se serre la main lors des présentations formelles. Le vouvoiement (Sie) est très important dans les contextes professionnels.",
      wortschatz: [
        { de: "Hallo", fr: "Bonjour (familier)", article: null, example: "Hallo, ich bin Paul!", audio: true },
        { de: "Guten Tag", fr: "Bonjour (formel)", article: null, example: "Guten Tag, Frau Müller.", audio: true },
        { de: "Guten Morgen", fr: "Bonjour (matin)", article: null, example: "Guten Morgen! Wie geht es Ihnen?", audio: true },
        { de: "Auf Wiedersehen", fr: "Au revoir (formel)", article: null, example: "Auf Wiedersehen, bis morgen!", audio: true },
        { de: "Danke", fr: "Merci", article: null, example: "Danke schön!", audio: true },
        { de: "Bitte", fr: "S'il vous plaît / De rien", article: null, example: "Bitte sehr!", audio: true },
      ],
      grammatik: {
        rule: "Le verbe 'sein' (être) au présent",
        ruleDE: "Das Verb 'sein' im Präsens",
        explanation: "Le verbe 'sein' est irrégulier. Apprenez ces formes par cœur !",
        table: {
          headers: ["Pronom", "Forme", "Exemple"],
          rows: [
            ["ich", "bin", "Ich bin Student."],
            ["du", "bist", "Du bist nett."],
            ["er/sie/es", "ist", "Er ist Lehrer."],
            ["wir", "sind", "Wir sind Freunde."],
            ["ihr", "seid", "Ihr seid hier."],
            ["sie/Sie", "sind", "Sie sind willkommen."],
          ]
        },
        commonMistakes: [
          { wrong: "Ich ist Student", correct: "Ich bin Student", explanation: "Avec 'ich', on utilise toujours 'bin'" },
          { wrong: "Du bin nett", correct: "Du bist nett", explanation: "Avec 'du', c'est toujours 'bist'" },
        ]
      },
      lesetext: {
        title: "Ein erstes Gespräch — Une première conversation",
        context: "Anna rencontre Klaus pour la première fois au bureau.",
        text: "Anna: Guten Tag! Ich heiße Anna Müller. Wie heißen Sie?\nKlaus: Guten Tag, Frau Müller! Ich bin Klaus Weber. Ich bin der neue Kollege.\nAnna: Sehr angenehm, Herr Weber! Woher kommen Sie?\nKlaus: Ich komme aus Berlin. Und Sie?\nAnna: Ich komme aus München. Willkommen im Team!",
        translation: "Anna: Bonjour! Je m'appelle Anna Müller. Comment vous appelez-vous?\nKlaus: Bonjour, Mme Müller! Je suis Klaus Weber. Je suis le nouveau collègue.\nAnna: Enchanté, M. Weber! D'où venez-vous?\nKlaus: Je viens de Berlin. Et vous?\nAnna: Je viens de Munich. Bienvenue dans l'équipe!"
      }
    }
  },
  "lektion-1-hoeren": {
    id: "lektion-1-hoeren",
    title: "Guten Tag! — Écoute",
    titleDE: "Lektion 1 — Hören",
    type: "HOEREN",
    level: "A1",
    topic: "Dialogues de salutation",
    xpReward: 30,
    duration: 10,
    content: {
      dialogs: [
        {
          title: "Am Empfang — À l'accueil",
          context_fr: "Paul arrive pour la première fois dans une entreprise allemande.",
          lines: [
            { sprecher: "Empfangsdame", text: "Guten Tag! Willkommen bei DeutschCM.", translation: "Bonjour ! Bienvenue chez DeutschCM.", gender: "female", pause_after_ms: 800 },
            { sprecher: "Paul", text: "Guten Tag. Ich heiße Paul Nkengue. Ich habe einen Termin.", translation: "Bonjour. Je m'appelle Paul Nkengue. J'ai un rendez-vous.", gender: "male", pause_after_ms: 700 },
            { sprecher: "Empfangsdame", text: "Einen Moment bitte, Herr Nkengue.", translation: "Un instant s'il vous plaît, M. Nkengue.", gender: "female", pause_after_ms: 600 },
          ]
        },
        {
          title: "Kennenlernen — Faire connaissance",
          context_fr: "Deux collègues se rencontrent pour la première fois.",
          lines: [
            { sprecher: "Maria", text: "Hallo! Ich bin Maria. Und du?", translation: "Bonjour ! Je suis Maria. Et toi ?", gender: "female", pause_after_ms: 700 },
            { sprecher: "Thomas", text: "Ich heiße Thomas. Woher kommst du?", translation: "Je m'appelle Thomas. D'où viens-tu ?", gender: "male", pause_after_ms: 700 },
            { sprecher: "Maria", text: "Aus Kamerun. Und du?", translation: "Du Cameroun. Et toi ?", gender: "female", pause_after_ms: 600 },
            { sprecher: "Thomas", text: "Ich komme aus Deutschland. Willkommen!", translation: "Je viens d'Allemagne. Bienvenue !", gender: "male" },
          ]
        }
      ]
    }
  },
  "lektion-1-sprechen": {
    id: "lektion-1-sprechen",
    title: "Guten Tag! — Expression orale",
    titleDE: "Lektion 1 — Sprechen",
    type: "CONVERSATION",
    level: "A1",
    topic: "Se présenter à voix haute",
    xpReward: 40,
    duration: 15,
    content: {
      exercises: [
        {
          instruction: "Répétez ces phrases après le modèle audio :",
          phrases: [
            { de: "Guten Tag, ich heiße Paul.", fr: "Bonjour, je m'appelle Paul." },
            { de: "Ich komme aus Kamerun.", fr: "Je viens du Cameroun." },
            { de: "Ich bin Student.", fr: "Je suis étudiant." },
            { de: "Wie heißen Sie?", fr: "Comment vous appelez-vous ?" },
          ]
        }
      ],
      freeTask: {
        instruction: "Présentez-vous en allemand (30-60 secondes) :",
        prompt: "Dites votre nom, votre origine et votre profession en allemand.",
        example: "Hallo! Ich heiße... Ich komme aus... Ich bin..."
      }
    }
  },
  "lektion-1-schreiben": {
    id: "lektion-1-schreiben",
    title: "Guten Tag! — Écriture",
    titleDE: "Lektion 1 — Schreiben",
    type: "SCHREIBEN",
    level: "A1",
    topic: "Se présenter à l'écrit",
    xpReward: 35,
    duration: 20,
    content: {
      task: "Présentez-vous en allemand : votre nom, votre pays d'origine, votre profession et pourquoi vous apprenez l'allemand.",
      taskDE: "Stellen Sie sich vor: Ihr Name, Ihre Herkunft, Ihr Beruf und warum Sie Deutsch lernen.",
      minWords: 30,
      maxWords: 80,
      example: "Hallo! Ich heiße Marie Kamdem. Ich komme aus Douala in Kamerun. Ich bin Ingenieurin. Ich lerne Deutsch, weil ich in Deutschland arbeiten möchte. Deutsch ist eine wichtige Sprache für meinen Beruf."
    }
  },
  "lektion-1-quiz": {
    id: "lektion-1-quiz",
    title: "Guten Tag! — Quiz",
    titleDE: "Lektion 1 — Quiz",
    type: "QUIZ",
    level: "A1",
    topic: "Salutations et présentations — Lektion 1",
    xpReward: 50,
    duration: 10,
    content: {}
  }
}

// ─── Composant principal ─────────────────────────────────
export default function ModulePage() {
  const params = useParams<{ courseId: string; moduleId: string }>()
  const [module, setModule] = useState<Module | null>(null)
  const [completed, setCompleted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)

  useEffect(() => {
    const mod = DEMO_MODULES[params.moduleId] || DEMO_MODULES["lektion-1-lesen"]
    setModule(mod)
  }, [params.moduleId])

  if (!module) return (
    <div style={{ minHeight:"100vh", background:"#080c10", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ color:"#10b981" }}>⏳ Chargement du module...</p>
    </div>
  )

  const handleComplete = (earnedScore?: number) => {
    setCompleted(true)
    if (earnedScore) setScore(earnedScore)
    setXpEarned(module.xpReward)
  }

  return (
    <div style={{
      minHeight:"100vh", background:"#080c10",
      fontFamily:"'DM Mono',monospace", color:"white"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono&display=swap');
        ::-webkit-scrollbar { display:none; }
      `}</style>

      <div style={{ display:"flex", height:"100vh" }}>

        {/* ── Sidebar gauche ── */}
        <div style={{
          width:260, flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.06)",
          background:"rgba(255,255,255,0.02)", overflowY:"auto", padding:"24px 16px"
        }}>
          <a href="/courses" style={{ color:"rgba(255,255,255,0.4)", fontSize:11, textDecoration:"none", display:"flex", alignItems:"center", gap:6, marginBottom:20 }}>
            ← Retour aux cours
          </a>

          <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>
            Lektion 1 — Guten Tag!
          </p>

          {Object.values(DEMO_MODULES).map((mod) => {
            const icons: Record<ModuleType, string> = {
              LESSON:"📖", HOEREN:"🎧", CONVERSATION:"🎙️",
              SCHREIBEN:"✍️", QUIZ:"🎯", VIDEO:"🎬"
            }
            const isActive = mod.id === module.id
            return (
              <a key={mod.id} href={`/courses/${params.courseId}/modules/${mod.id}`}
                style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"10px 12px", borderRadius:10, marginBottom:6,
                  background: isActive ? "rgba(16,185,129,0.12)" : "transparent",
                  border: isActive ? "1px solid rgba(16,185,129,0.2)" : "1px solid transparent",
                  textDecoration:"none", transition:"all 0.15s"
                }}>
                <span style={{ fontSize:16 }}>{icons[mod.type]}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color: isActive ? "#10b981" : "rgba(255,255,255,0.6)", fontSize:12, fontWeight: isActive ? 700 : 400, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {mod.title.split("—")[1]?.trim() || mod.title}
                  </p>
                  <p style={{ color:"rgba(255,255,255,0.3)", fontSize:9, margin:0 }}>
                    {mod.duration} min · +{mod.xpReward} XP
                  </p>
                </div>
              </a>
            )
          })}
        </div>

        {/* ── Contenu principal ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"32px 40px" }}>

          {/* Header module */}
          <div style={{ marginBottom:28 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
              <span style={{
                fontSize:10, padding:"3px 10px", borderRadius:99, fontWeight:700,
                background:"rgba(16,185,129,0.15)", border:"1px solid rgba(16,185,129,0.25)", color:"#10b981"
              }}>{module.level}</span>
              <span style={{
                fontSize:10, padding:"3px 10px", borderRadius:99,
                background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.4)"
              }}>{module.type}</span>
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>⏱ {module.duration} min</span>
              <span style={{ fontSize:10, color:"#f59e0b" }}>+{module.xpReward} XP</span>
            </div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, margin:"0 0 4px" }}>
              {module.title}
            </h1>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, margin:0, fontStyle:"italic" }}>
              {module.titleDE}
            </p>
          </div>

          {/* ── MODULE LESSON ── */}
          {module.type === "LESSON" && module.content && (
            <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

              {/* Introduction */}
              <div style={{ padding:"16px 20px", borderRadius:14, background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.15)" }}>
                <p style={{ fontSize:10, color:"#10b981", textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 8px" }}>Introduction</p>
                <p style={{ color:"rgba(255,255,255,0.8)", fontSize:14, margin:"0 0 8px", lineHeight:1.7 }}>{module.content.introduction}</p>
                <p style={{ color:"rgba(255,255,255,0.45)", fontSize:12, margin:0, fontStyle:"italic" }}>🇩🇪 {module.content.kulturhinweis}</p>
              </div>

              {/* Vocabulaire avec audio */}
              <div style={{ padding:"20px 24px", borderRadius:16, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:17, margin:"0 0 16px" }}>📖 Vocabulaire</h2>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                  {module.content.wortschatz?.map((word: any, i: number) => (
                    <div key={i} style={{ padding:"12px 16px", borderRadius:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                        <span style={{ color:"#10b981", fontSize:16, fontWeight:700 }}>{word.de}</span>
                        <AudioPlayer text={word.de} gender="female" accent="de" rate="0.8" label={word.de} />
                      </div>
                      <p style={{ color:"rgba(255,255,255,0.5)", fontSize:11, margin:"0 0 6px" }}>{word.fr}</p>
                      <p style={{ color:"rgba(255,255,255,0.3)", fontSize:10, margin:0, fontStyle:"italic" }}>{word.example}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grammaire */}
              {module.content.grammatik && (
                <div style={{ padding:"20px 24px", borderRadius:16, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:17, margin:"0 0 6px" }}>📝 Grammaire</h2>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:12, margin:"0 0 16px", fontStyle:"italic" }}>{module.content.grammatik.ruleDE}</p>
                  <p style={{ color:"rgba(255,255,255,0.7)", fontSize:13, margin:"0 0 16px", lineHeight:1.7 }}>{module.content.grammatik.explanation}</p>

                  {/* Tableau conjugaison */}
                  <div style={{ borderRadius:12, overflow:"hidden", border:"1px solid rgba(255,255,255,0.07)", marginBottom:16 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", background:"rgba(16,185,129,0.08)", borderBottom:"1px solid rgba(16,185,129,0.15)" }}>
                      {module.content.grammatik.table.headers.map((h: string, i: number) => (
                        <div key={i} style={{ padding:"10px 16px", color:"#10b981", fontSize:11, fontWeight:700, textTransform:"uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {module.content.grammatik.table.rows.map((row: string[], i: number) => (
                      <div key={i} style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none", background: i%2===0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                        {row.map((cell, j) => (
                          <div key={j} style={{ padding:"10px 16px", color: j===0 ? "#10b981" : j===1 ? "white" : "rgba(255,255,255,0.5)", fontSize: j===1 ? 15 : 13, fontWeight: j===1 ? 700 : 400, fontStyle: j===2 ? "italic" : "normal", display:"flex", alignItems:"center", gap:6 }}>
                            {cell}
                            {j===1 && <AudioPlayer text={`Ich ${cell} Student`} gender="female" rate="0.8" />}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Erreurs communes */}
                  <div>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>Erreurs fréquentes</p>
                    {module.content.grammatik.commonMistakes?.map((err: any, i: number) => (
                      <div key={i} style={{ padding:"8px 12px", borderRadius:8, background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)", marginBottom:6, display:"flex", gap:10, alignItems:"center" }}>
                        <span style={{ color:"#ef4444", fontSize:11, textDecoration:"line-through" }}>{err.wrong}</span>
                        <span style={{ color:"rgba(255,255,255,0.4)" }}>→</span>
                        <span style={{ color:"#10b981", fontSize:11, fontWeight:700 }}>{err.correct}</span>
                        <span style={{ color:"rgba(255,255,255,0.4)", fontSize:10 }}>{err.explanation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Texte de lecture */}
              {module.content.lesetext && (
                <div style={{ padding:"20px 24px", borderRadius:16, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:17, margin:0 }}>📄 {module.content.lesetext.title}</h2>
                    <button onClick={() => setShowTranslation(!showTranslation)}
                      style={{ padding:"5px 12px", borderRadius:99, fontSize:10, fontWeight:700, background: showTranslation ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", border: showTranslation ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.1)", color: showTranslation ? "#10b981" : "rgba(255,255,255,0.4)", cursor:"pointer" }}>
                      🇫🇷 {showTranslation ? "Masquer" : "Traduction"}
                    </button>
                  </div>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:11, margin:"0 0 12px", fontStyle:"italic" }}>{module.content.lesetext.context}</p>
                  <div style={{ padding:"14px 18px", borderRadius:10, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", marginBottom:12 }}>
                    {module.content.lesetext.text.split("\n").map((line: string, i: number) => (
                      <p key={i} style={{ color:"rgba(255,255,255,0.8)", fontSize:13, margin:"0 0 6px", lineHeight:1.7 }}>{line}</p>
                    ))}
                  </div>
                  {showTranslation && (
                    <div style={{ padding:"12px 16px", borderRadius:10, background:"rgba(16,185,129,0.05)", border:"1px solid rgba(16,185,129,0.12)" }}>
                      {module.content.lesetext.translation.split("\n").map((line: string, i: number) => (
                        <p key={i} style={{ color:"rgba(255,255,255,0.5)", fontSize:12, margin:"0 0 4px", fontStyle:"italic" }}>{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bouton compléter */}
              <button onClick={() => handleComplete(85)}
                style={{ padding:"14px", borderRadius:14, background:"linear-gradient(135deg,#10b981,#059669)", border:"none", color:"white", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                ✅ Marquer comme terminé → +{module.xpReward} XP
              </button>
            </div>
          )}

          {/* ── MODULE HÖREN ── */}
          {module.type === "HOEREN" && module.content && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div style={{ padding:"12px 16px", borderRadius:12, background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.15)" }}>
                <p style={{ color:"rgba(255,255,255,0.7)", fontSize:13, margin:0 }}>
                  🎧 Écoutez les dialogues, puis répondez aux questions de compréhension.
                </p>
              </div>

              {module.content.dialogs?.map((dialog: any, i: number) => (
                <DialogPlayer
                  key={i}
                  title={dialog.title}
                  context_fr={dialog.context_fr}
                  lines={dialog.lines}
                  onComplete={() => i === module.content.dialogs.length - 1 && handleComplete(80)}
                />
              ))}

              <button onClick={() => handleComplete(80)}
                style={{ padding:"14px", borderRadius:14, background:"linear-gradient(135deg,#10b981,#059669)", border:"none", color:"white", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                ✅ Exercices terminés → +{module.xpReward} XP
              </button>
            </div>
          )}

          {/* ── MODULE SPRECHEN ── */}
          {module.type === "CONVERSATION" && module.content && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div style={{ padding:"12px 16px", borderRadius:12, background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.15)" }}>
                <p style={{ color:"rgba(255,255,255,0.7)", fontSize:13, margin:0 }}>
                  🎙️ Parlez en allemand ! Cliquez sur le micro et prononcez les phrases.
                  L'IA analysera votre prononciation et grammaire.
                </p>
              </div>

              {/* Phrases à répéter avec audio */}
              {module.content.exercises?.[0]?.phrases && (
                <div style={{ padding:"20px 24px", borderRadius:16, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:15, margin:"0 0 16px" }}>
                    🔊 Répétez après le modèle
                  </h3>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {module.content.exercises[0].phrases.map((phrase: any, i: number) => (
                      <div key={i} style={{ padding:"12px 16px", borderRadius:12, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:12, alignItems:"center" }}>
                        <AudioPlayer text={phrase.de} gender="female" rate="0.8" label={phrase.de} />
                        <div style={{ flex:1 }}>
                          <p style={{ color:"white", fontSize:14, fontWeight:600, margin:"0 0 2px" }}>{phrase.de}</p>
                          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:11, margin:0, fontStyle:"italic" }}>{phrase.fr}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Zone expression libre */}
              {module.content.freeTask && (
                <div style={{ padding:"20px 24px", borderRadius:16, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:15, margin:"0 0 8px" }}>
                    🎙️ Expression libre
                  </h3>
                  <p style={{ color:"rgba(255,255,255,0.6)", fontSize:13, margin:"0 0 16px" }}>
                    {module.content.freeTask.instruction}
                  </p>
                  <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.15)", marginBottom:16 }}>
                    <p style={{ color:"#f59e0b", fontSize:12, margin:0 }}>
                      💡 Guide : {module.content.freeTask.example}
                    </p>
                  </div>
                  <VoiceRecorder
                    level={module.level}
                    exerciseType="expression_libre"
                    placeholder="Cliquez sur le micro et présentez-vous en allemand..."
                    onResult={(analysis) => {
                      if (analysis?.score_global >= 6) handleComplete(analysis.score_global * 10)
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── MODULE SCHREIBEN ── */}
          {module.type === "SCHREIBEN" && module.content && (
            <div>
              <div style={{ padding:"12px 16px", borderRadius:12, background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.15)", marginBottom:20 }}>
                <p style={{ color:"rgba(255,255,255,0.7)", fontSize:13, margin:0 }}>
                  ✍️ Rédigez votre texte en allemand. L'IA corrigera votre grammaire et vocabulaire.
                </p>
              </div>
              <SchreibenEditor
                task={module.content.task}
                taskDE={module.content.taskDE}
                level={module.level}
                exerciseType="presentation"
                minWords={module.content.minWords}
                maxWords={module.content.maxWords}
                example={module.content.example}
                onComplete={(score) => handleComplete(score)}
              />
            </div>
          )}

          {/* ── MODULE QUIZ ── */}
          {module.type === "QUIZ" && (
            <div>
              <div style={{ padding:"12px 16px", borderRadius:12, background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.15)", marginBottom:20 }}>
                <p style={{ color:"rgba(255,255,255,0.7)", fontSize:13, margin:0 }}>
                  🎯 Quiz adaptatif — La difficulté s'ajuste à votre niveau automatiquement.
                </p>
              </div>
              <AdaptiveQuiz
                level={module.level}
                topic={module.topic}
                moduleId={module.id}
                questionCount={10}
                adaptive={true}
                onComplete={(result) => handleComplete(result.percentage)}
                onClose={() => window.history.back()}
              />
            </div>
          )}

          {/* ── Completion banner ── */}
          {completed && (
            <div style={{
              marginTop:24, padding:"20px 24px", borderRadius:16,
              background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)",
              textAlign:"center"
            }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🎉</div>
              <h3 style={{ fontFamily:"'Syne',sans-serif", color:"#10b981", fontSize:20, margin:"0 0 4px" }}>
                Module terminé !
              </h3>
              {score && <p style={{ color:"rgba(255,255,255,0.6)", fontSize:13, margin:"0 0 12px" }}>Score : {score}%</p>}
              <p style={{ color:"#f59e0b", fontSize:14, fontWeight:700, margin:"0 0 16px" }}>
                +{xpEarned} XP gagnés ⚡
              </p>
              <a href={`/courses/${params.courseId}`}
                style={{ display:"inline-block", padding:"12px 24px", borderRadius:12, background:"linear-gradient(135deg,#10b981,#059669)", color:"white", textDecoration:"none", fontSize:13, fontWeight:700, fontFamily:"'Syne',sans-serif" }}>
                → Module suivant
              </a>
            </div>
          )}
        </div>

        {/* ── Panneau droit ── */}
        <div style={{
          width:260, flexShrink:0, borderLeft:"1px solid rgba(255,255,255,0.06)",
          background:"rgba(255,255,255,0.02)", overflowY:"auto", padding:"24px 16px"
        }}>
          {/* Score session */}
          <div style={{ padding:"16px", borderRadius:14, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", marginBottom:16, textAlign:"center" }}>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 8px" }}>XP ce module</p>
            <div style={{ fontSize:28, fontWeight:800, fontFamily:"'Syne',sans-serif", color:"#f59e0b" }}>
              +{xpEarned || module.xpReward}
            </div>
            <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", margin:"4px 0 0" }}>⚡ Points d'expérience</p>
          </div>

          {/* Infos module */}
          <div style={{ padding:"14px", borderRadius:12, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", marginBottom:16 }}>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 10px" }}>Informations</p>
            {[
              { label:"Type", value: module.type },
              { label:"Niveau", value: module.level },
              { label:"Durée", value: `${module.duration} min` },
              { label:"Statut", value: completed ? "✅ Terminé" : "🔄 En cours" },
            ].map((info, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>{info.label}</span>
                <span style={{ fontSize:10, color: info.label==="Statut" && completed ? "#10b981" : "rgba(255,255,255,0.7)", fontWeight:600 }}>
                  {info.value}
                </span>
              </div>
            ))}
          </div>

          {/* Outils IA */}
          <div style={{ padding:"14px", borderRadius:12, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 10px" }}>
              Outils IA disponibles
            </p>
            {[
              { icon:"🔊", label:"Audio TTS Azure" },
              { icon:"🎙️", label:"Reconnaissance vocale" },
              { icon:"✨", label:"Correction Gemini" },
              { icon:"🧠", label:"Quiz adaptatif" },
            ].map((tool, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontSize:14 }}>{tool.icon}</span>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>{tool.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
