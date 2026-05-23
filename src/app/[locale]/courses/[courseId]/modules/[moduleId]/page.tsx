"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import dynamic from "next/dynamic"
import AudioPlayer from "@/components/AudioPlayer"
import VoiceRecorder from "@/components/VoiceRecorder"
import SchreibenEditor from "@/components/SchreibenEditor"
import { A1_BETA_MODULES, COURSE_TO_MODULE_IDS, COURSE_LABELS } from "@/data/a1-beta-modules"
import { YEMA_MODULES, YEMA_COURSE_TO_MODULE_IDS, YEMA_COURSE_LABELS, YEMA_COURSE_SEQUENCE } from "@/data/courses/index"
import { checkGermanGrammar, type GrammarError } from "@/lib/grammarGuardrail"

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
}

// ─── Bilingual labels ─────────────────────────────────────
const LABELS = {
  en: {
    back: "← Back to courses",
    introduction: "Introduction",
    vocabulary: "📖 Vocabulary",
    grammar: "📝 Grammar",
    commonMistakes: "Common mistakes",
    showTranslation: "🇫🇷 Translation",
    hideTranslation: "Hide",
    markDone: "✅ Mark as complete · +{xp} XP",
    listenInstructions: "🎧 Listen to the dialogues, then answer the comprehension questions.",
    exercisesDone: "✅ Exercises done · +{xp} XP",
    speakInstructions: "🎙️ Speak German! Click the mic and pronounce the sentences. AI will analyze your pronunciation and grammar.",
    repeatModel: "🔊 Repeat after the model",
    freeExpression: "🎙️ Free expression",
    guideLabel: "Guide",
    writeInstructions: "✍️ Write your text in German. AI will correct your grammar and vocabulary.",
    grammarInspector: "Grammar inspector",
    grammarInspectorHint: "Type a German sentence to check for errors:",
    grammarPlaceholder: "e.g. ich ist Student",
    noErrors: "No errors detected.",
    correctionLabel: "Correction",
    quizInstructions: "🎯 Adaptive quiz — Difficulty adjusts to your level automatically.",
    moduleComplete: "Module complete!",
    scoreLabel: "Score:",
    xpEarned: "{xp} XP earned",
    nextModule: "→ Next module",
    nextLesson: "→ Next lesson",
    viewProgress: "→ View my progress",
    moduleCompleted: "Module completed!",
    completionText: "Well done, you just completed this module. Every step matters.",
    finalModuleTitle: "Path completed for now",
    finalModuleText: "Well done. You completed the available content. Your progress is waiting in your dashboard.",
    backToCourses: "Back to courses",
    practiceSimulator: "Practice with the simulator",
    lockedMessage: "The next step will be available when this path is unlocked.",
    xpThisModule: "XP this module",
    xpPoints: "⚡ Experience points",
    infoPanel: "Info",
    typeLabel: "Type",
    levelLabel: "Level",
    durationLabel: "Duration",
    statusLabel: "Status",
    done: "✅ Done",
    inProgress: "🔄 In progress",
    aiTools: "AI Tools",
    aiTts: "🔊 Azure TTS Audio",
    aiVoice: "🎙️ Voice recognition",
    aiCorrection: "✨ AI correction",
    aiQuiz: "🧠 Adaptive quiz",
    min: "min",
    loading: "Loading module…",
    disclaimer: "Yema Languages provides independent CEFR-aligned language practice and is not affiliated with any official examination institute.",
    menuLabel: "Modules",
    typeLesson: "Lesson",
    typeHoeren: "Listening",
    typeConversation: "Speaking",
    typeSchreiben: "Writing",
    typeQuiz: "Quiz",
    typeVideo: "Video",
  },
  fr: {
    back: "← Retour aux cours",
    introduction: "Introduction",
    vocabulary: "📖 Vocabulaire",
    grammar: "📝 Grammaire",
    commonMistakes: "Erreurs fréquentes",
    showTranslation: "🇫🇷 Traduction",
    hideTranslation: "Masquer",
    markDone: "✅ Marquer comme terminé · +{xp} XP",
    listenInstructions: "🎧 Écoutez les dialogues, puis répondez aux questions de compréhension.",
    exercisesDone: "✅ Exercices terminés · +{xp} XP",
    speakInstructions: "🎙️ Parlez en allemand ! Cliquez sur le micro et prononcez les phrases. L'IA analysera votre prononciation et grammaire.",
    repeatModel: "🔊 Répétez après le modèle",
    freeExpression: "🎙️ Expression libre",
    guideLabel: "Guide",
    writeInstructions: "✍️ Rédigez votre texte en allemand. L'IA corrigera votre grammaire et vocabulaire.",
    grammarInspector: "Vérificateur grammatical",
    grammarInspectorHint: "Écrivez une phrase allemande pour détecter les erreurs :",
    grammarPlaceholder: "ex. : ich ist Student",
    noErrors: "Aucune erreur détectée.",
    correctionLabel: "Correction",
    quizInstructions: "🎯 Quiz adaptatif — La difficulté s'ajuste à votre niveau automatiquement.",
    moduleComplete: "Module terminé !",
    scoreLabel: "Score :",
    xpEarned: "{xp} XP gagnés",
    nextModule: "→ Module suivant",
    nextLesson: "→ Leçon suivante",
    viewProgress: "→ Voir ma progression",
    moduleCompleted: "Module terminé !",
    completionText: "Bravo, tu viens de terminer ce module. Chaque étape compte.",
    finalModuleTitle: "Parcours terminé pour le moment",
    finalModuleText: "Bravo. Tu as terminé les contenus disponibles. Ta progression t'attend dans ton tableau de bord.",
    backToCourses: "Retour aux cours",
    practiceSimulator: "Pratiquer avec le simulateur",
    lockedMessage: "La suite sera disponible lorsque ce parcours sera débloqué.",
    xpThisModule: "XP ce module",
    xpPoints: "⚡ Points d'expérience",
    infoPanel: "Informations",
    typeLabel: "Type",
    levelLabel: "Niveau",
    durationLabel: "Durée",
    statusLabel: "Statut",
    done: "✅ Terminé",
    inProgress: "🔄 En cours",
    aiTools: "Outils IA disponibles",
    aiTts: "🔊 Audio TTS Azure",
    aiVoice: "🎙️ Reconnaissance vocale",
    aiCorrection: "✨ Correction IA",
    aiQuiz: "🧠 Quiz adaptatif",
    min: "min",
    loading: "Chargement du module…",
    disclaimer: "Yema Languages propose une pratique linguistique indépendante alignée sur le CECRL et n'est affiliée à aucun organisme officiel d'examen.",
    menuLabel: "Modules",
    typeLesson: "Leçon",
    typeHoeren: "Écoute",
    typeConversation: "Expression orale",
    typeSchreiben: "Écriture",
    typeQuiz: "Quiz",
    typeVideo: "Vidéo",
  },
} as const

type Locale = keyof typeof LABELS

// ─── Safe score helper ───────────────────────────────────
function safeScore(raw: number | undefined): number | null {
  if (raw === undefined || raw === null) return null
  const n = Math.round(raw)
  if (!isFinite(n)) return null
  return Math.max(0, Math.min(100, n))
}

// ─── Static quiz renderer (deterministic, no AI) ─────────
interface StaticQuestion {
  id: string
  qtype?: string
  question_fr: string
  question_en: string
  prompt_de: string
  options: string[]
  correctIndex: number
  correctAnswer: string
  explanation_fr: string
  explanation_en: string
  skill?: string
  difficulty?: string
}

function StaticQuizRenderer({
  questions,
  locale,
  onComplete,
}: {
  questions: StaticQuestion[]
  locale: "fr" | "en"
  onComplete: (score: number) => void
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ correct: number; total: number; pct: number } | null>(null)

  if (!questions || questions.length === 0) {
    return (
      <div style={{ padding: "32px 24px", borderRadius: 14, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
          {locale === "en" ? "No questions available for this quiz." : "Aucune question disponible pour ce quiz."}
        </p>
      </div>
    )
  }

  const handleSubmit = () => {
    const correct = questions.filter(q => answers[q.id] === q.correctIndex).length
    const total = questions.length
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    setResult({ correct, total, pct })
    setSubmitted(true)
    onComplete(pct)
  }

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
    setResult(null)
  }

  const answeredCount = Object.keys(answers).length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {questions.map((q, qi) => {
        const question = locale === "en" ? q.question_en : q.question_fr
        const explanation = locale === "en" ? q.explanation_en : q.explanation_fr
        const chosen = answers[q.id]
        const isCorrect = submitted && chosen === q.correctIndex
        const isWrong = submitted && chosen !== undefined && chosen !== q.correctIndex

        return (
          <div key={q.id} style={{
            padding: "20px 24px", borderRadius: 14,
            background: submitted
              ? (isCorrect ? "rgba(16,185,129,0.07)" : isWrong ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)")
              : "rgba(255,255,255,0.03)",
            border: `1px solid ${submitted ? (isCorrect ? "rgba(16,185,129,0.25)" : isWrong ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)") : "rgba(255,255,255,0.07)"}`,
          }}>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>
              Q{qi + 1} · {q.skill ?? "grammar"}
            </p>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, margin: "0 0 6px", lineHeight: 1.6 }}>{question}</p>
            {q.prompt_de && (
              <p style={{ color: "#10b981", fontSize: 15, fontWeight: 700, fontFamily: "'DM Mono',monospace", margin: "0 0 14px", padding: "8px 12px", background: "rgba(16,185,129,0.08)", borderRadius: 8 }}>
                {q.prompt_de}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {q.options.map((opt, oi) => {
                const isChosen = chosen === oi
                const isRight = submitted && oi === q.correctIndex
                const isWrongChoice = submitted && isChosen && oi !== q.correctIndex
                return (
                  <button
                    key={oi}
                    onClick={() => !submitted && setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                    style={{
                      padding: "10px 16px", borderRadius: 10, textAlign: "left",
                      cursor: submitted ? "default" : "pointer",
                      border: `1px solid ${isRight ? "rgba(16,185,129,0.5)" : isWrongChoice ? "rgba(239,68,68,0.4)" : isChosen ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
                      background: isRight ? "rgba(16,185,129,0.12)" : isWrongChoice ? "rgba(239,68,68,0.08)" : isChosen ? "rgba(255,255,255,0.07)" : "transparent",
                      color: isRight ? "#10b981" : isWrongChoice ? "#ef4444" : isChosen ? "white" : "rgba(255,255,255,0.72)",
                      fontSize: 13, fontFamily: "'DM Mono',monospace", fontWeight: isChosen || isRight ? 700 : 400,
                      transition: "all 0.15s",
                    }}
                  >
                    {isRight && "✓ "}{isWrongChoice && "✗ "}{opt}
                  </button>
                )
              })}
            </div>
            {submitted && (
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, margin: "12px 0 0", lineHeight: 1.6, fontStyle: "italic" }}>
                {explanation}
              </p>
            )}
          </div>
        )
      })}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={answeredCount < questions.length}
          style={{
            padding: "14px", borderRadius: 14, border: "none",
            cursor: answeredCount < questions.length ? "not-allowed" : "pointer",
            background: answeredCount < questions.length ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#10b981,#059669)",
            color: answeredCount < questions.length ? "rgba(255,255,255,0.35)" : "white",
            fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif",
          }}
        >
          {locale === "en" ? `Submit answers (${answeredCount}/${questions.length})` : `Valider (${answeredCount}/${questions.length})`}
        </button>
      ) : result && (
        <div style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", textAlign: "center" }}>
          <p style={{ color: "#10b981", fontSize: 20, fontWeight: 800, fontFamily: "'Syne',sans-serif", margin: "0 0 4px" }}>
            {result.correct}/{result.total}
          </p>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, margin: "0 0 14px" }}>
            {locale === "en" ? `${result.pct}% correct` : `${result.pct}% de bonnes réponses`}
          </p>
          {result.pct < 80 && (
            <button
              onClick={handleReset}
              style={{
                padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(245,158,11,0.3)",
                background: "rgba(245,158,11,0.08)", color: "#f59e0b",
                fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: "pointer",
              }}
            >
              {locale === "en" ? "↩ Try again" : "↩ Réessayer"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Grammar inspector widget ─────────────────────────────
type AnyLabels = typeof LABELS["en"] | typeof LABELS["fr"]

function GrammarInspector({ locale, labels }: { locale: Locale; labels: AnyLabels }) {
  const [input, setInput] = useState("")
  const [errors, setErrors] = useState<GrammarError[]>([])

  const handleChange = (val: string) => {
    setInput(val)
    setErrors(checkGermanGrammar(val))
  }

  return (
    <div style={{ marginBottom: 20, padding: "16px 20px", borderRadius: 14, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
      <p style={{ fontSize: 12, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px", fontWeight: 700 }}>
        🔍 {labels.grammarInspector}
      </p>
      <p style={{ color: "rgba(255,255,255,0.68)", fontSize: 13, margin: "0 0 10px" }}>
        {labels.grammarInspectorHint}
      </p>
      <input
        value={input}
        onChange={e => handleChange(e.target.value)}
        placeholder={labels.grammarPlaceholder}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "10px 14px", borderRadius: 10,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          color: "white", fontSize: 16, fontFamily: "'DM Mono', monospace",
          outline: "none",
        }}
      />
      {input.trim() !== "" && (
        <div style={{ marginTop: 12 }}>
          {errors.length === 0 ? (
            <p style={{ color: "#10b981", fontSize: 13 }}>✅ {labels.noErrors}</p>
          ) : (
            errors.map((err, i) => (
              <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", marginBottom: 6 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ color: "#ef4444", fontSize: 13, textDecoration: "line-through", fontFamily: "'DM Mono', monospace" }}>{err.input}</span>
                  <span style={{ color: "rgba(255,255,255,0.65)" }}>→</span>
                  <span style={{ color: "#10b981", fontSize: 13, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{err.correction}</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.68)", fontSize: 13, margin: 0 }}>
                  {locale === "en" ? err.explanationEN : err.explanationFR}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Demo modules fallback ────────────────────────────────
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
        { de: "Hallo",          fr: "Bonjour (familier)", article: null, example: "Hallo, ich bin Paul!",           audio: true },
        { de: "Guten Tag",      fr: "Bonjour (formel)",   article: null, example: "Guten Tag, Frau Müller.",         audio: true },
        { de: "Guten Morgen",   fr: "Bonjour (matin)",    article: null, example: "Guten Morgen! Wie geht es Ihnen?", audio: true },
        { de: "Auf Wiedersehen",fr: "Au revoir (formel)", article: null, example: "Auf Wiedersehen, bis morgen!",   audio: true },
        { de: "Danke",          fr: "Merci",              article: null, example: "Danke schön!",                   audio: true },
        { de: "Bitte",          fr: "S'il vous plaît",    article: null, example: "Bitte sehr!",                    audio: true },
      ],
      grammatik: {
        rule: "Le verbe 'sein' (être) au présent",
        ruleDE: "Das Verb 'sein' im Präsens",
        explanation: "Le verbe 'sein' est irrégulier. Apprenez ces formes par cœur !",
        table: {
          headers: ["Pronom", "Forme", "Exemple"],
          rows: [
            ["ich",       "bin",  "Ich bin Student."],
            ["du",        "bist", "Du bist nett."],
            ["er/sie/es", "ist",  "Er ist Lehrer."],
            ["wir",       "sind", "Wir sind Freunde."],
            ["ihr",       "seid", "Ihr seid hier."],
            ["sie/Sie",   "sind", "Sie sind willkommen."],
          ],
        },
        commonMistakes: [
          { wrong: "Ich ist Student",  correct: "Ich bin Student",  explanation: "Avec 'ich', on utilise toujours 'bin' / With 'ich', always use 'bin'." },
          { wrong: "Du bin nett",      correct: "Du bist nett",     explanation: "Avec 'du', c'est toujours 'bist' / With 'du', always use 'bist'." },
          { wrong: "Wir ist Freunde",  correct: "Wir sind Freunde", explanation: "Avec 'wir', c'est toujours 'sind' / With 'wir', always use 'sind'." },
        ],
      },
      lesetext: {
        title: "Ein erstes Gespräch — Une première conversation",
        context: "Anna rencontre Klaus pour la première fois au bureau.",
        text: "Anna: Guten Tag! Ich heiße Anna Müller. Wie heißen Sie?\nKlaus: Guten Tag, Frau Müller! Ich bin Klaus Weber. Ich bin der neue Kollege.\nAnna: Sehr angenehm, Herr Weber! Woher kommen Sie?\nKlaus: Ich komme aus Berlin. Und Sie?\nAnna: Ich komme aus München. Willkommen im Team!",
        translation: "Anna : Bonjour ! Je m'appelle Anna Müller. Comment vous appelez-vous ?\nKlaus : Bonjour, Mme Müller ! Je suis Klaus Weber. Je suis le nouveau collègue.\nAnna : Enchanté, M. Weber ! D'où venez-vous ?\nKlaus : Je viens de Berlin. Et vous ?\nAnna : Je viens de Munich. Bienvenue dans l'équipe !",
      },
    },
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
            { sprecher: "Empfangsdame", text: "Guten Tag! Willkommen bei Yema.", translation: "Bonjour ! Bienvenue chez Yema.", gender: "female", pause_after_ms: 800 },
            { sprecher: "Paul", text: "Guten Tag. Ich heiße Paul Nkengue. Ich habe einen Termin.", translation: "Bonjour. Je m'appelle Paul Nkengue. J'ai un rendez-vous.", gender: "male", pause_after_ms: 700 },
            { sprecher: "Empfangsdame", text: "Einen Moment bitte, Herr Nkengue.", translation: "Un instant s'il vous plaît, M. Nkengue.", gender: "female" },
          ],
        },
      ],
    },
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
            { de: "Ich komme aus Kamerun.",    fr: "Je viens du Cameroun." },
            { de: "Ich bin Student.",          fr: "Je suis étudiant." },
          ],
        },
      ],
      freeTask: {
        instruction: "Présentez-vous en allemand (30–60 secondes) :",
        prompt: "Dites votre nom, votre origine et votre profession en allemand.",
        example: "Hallo! Ich heiße... Ich komme aus... Ich bin...",
      },
    },
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
      example: "Hallo! Ich heiße Marie Kamdem. Ich komme aus Douala in Kamerun. Ich bin Ingenieurin. Ich lerne Deutsch, weil ich in Deutschland arbeiten möchte.",
    },
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
    content: {},
  },
}

const ALL_MODULES: Record<string, Module> = {
  ...DEMO_MODULES,
  ...A1_BETA_MODULES as unknown as Record<string, Module>,
  ...YEMA_MODULES as unknown as Record<string, Module>,
}

const MERGED_COURSE_TO_MODULE_IDS: Record<string, string[]> = {
  ...COURSE_TO_MODULE_IDS,
  ...YEMA_COURSE_TO_MODULE_IDS,
}

const MERGED_COURSE_LABELS: Record<string, string> = {
  ...COURSE_LABELS,
  ...YEMA_COURSE_LABELS,
}

// ─── Course order for sequential navigation ───────────────
const COURSE_SEQUENCE = [
  "a1-beta-1", "a1-beta-2", "a1-beta-3", "a1-beta-4", "a1-beta-5",
  ...YEMA_COURSE_SEQUENCE,
]

interface NextStep {
  type: "next_module" | "next_lesson" | "progress"
  href: string
  label: string
  isFinal: boolean
}

function getNextLearningStep(
  courseId: string,
  moduleId: string,
  locale: string,
  labels: AnyLabels
): NextStep {
  const courseModuleIds = MERGED_COURSE_TO_MODULE_IDS[courseId]
  const currentIndex = courseModuleIds?.indexOf(moduleId) ?? -1

  // Case 1: there is a next module in the same course
  if (courseModuleIds && currentIndex >= 0 && currentIndex < courseModuleIds.length - 1) {
    const nextId = courseModuleIds[currentIndex + 1]
    return {
      type: "next_module",
      href: `/${locale}/courses/${courseId}/modules/${nextId}`,
      label: labels.nextModule,
      isFinal: false,
    }
  }

  // Case 2: last module of this course — look for the next course in sequence
  const seqIndex = COURSE_SEQUENCE.indexOf(courseId)
  if (seqIndex >= 0 && seqIndex < COURSE_SEQUENCE.length - 1) {
    const nextCourseId = COURSE_SEQUENCE[seqIndex + 1]
    const nextIds = MERGED_COURSE_TO_MODULE_IDS[nextCourseId]
    if (nextIds && nextIds.length > 0) {
      return {
        type: "next_lesson",
        href: `/${locale}/courses/${nextCourseId}/modules/${nextIds[0]}`,
        label: labels.nextLesson,
        isFinal: false,
      }
    }
  }

  // Case 3: no more available content — send to progress dashboard
  return {
    type: "progress",
    href: `/${locale}/dashboard#progress`,
    label: labels.viewProgress,
    isFinal: true,
  }
}

// ─── Main page ───────────────────────────────────────────
export default function ModulePage() {
  const params = useParams<{ locale: string; courseId: string; moduleId: string }>()
  const locale: Locale = (params.locale === "en" ? "en" : "fr")
  const labels = LABELS[locale]

  const [module, setModule] = useState<Module | null>(null)
  const [completed, setCompleted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [quizKey, setQuizKey] = useState(0)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const mod = ALL_MODULES[params.moduleId] ?? ALL_MODULES["lektion-1-lesen"]
    setModule(mod)
  }, [params.moduleId])

  const localizedType = (type: ModuleType): string => {
    const map: Record<ModuleType, string> = {
      LESSON: labels.typeLesson,
      HOEREN: labels.typeHoeren,
      CONVERSATION: labels.typeConversation,
      SCHREIBEN: labels.typeSchreiben,
      QUIZ: labels.typeQuiz,
      VIDEO: labels.typeVideo,
    };
    return map[type] ?? type;
  };

  if (!module) return (
    <div style={{ minHeight: "100vh", background: "#080c10", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#10b981" }}>⏳ {labels.loading}</p>
    </div>
  )

  const handleComplete = (earnedScore?: number) => {
    setCompleted(true)
    const s = safeScore(earnedScore)
    if (s !== null) setScore(s)
    setXpEarned(module.xpReward)
    // Save XP to DB — fire and forget, silent failure
    if (module.xpReward > 0) {
      fetch("/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xpEarned: module.xpReward }),
      }).catch(() => {})
    }
  }

  const courseModules = ((): Module[] => {
    const ids = MERGED_COURSE_TO_MODULE_IDS[params.courseId]
    return ids
      ? ids.map(id => ALL_MODULES[id]).filter(Boolean) as Module[]
      : Object.values(ALL_MODULES)
  })()

  const icons: Record<string, string> = {
    LESSON: "📖", HOEREN: "🎧", CONVERSATION: "🎙️",
    SCHREIBEN: "✍️", QUIZ: "🎯", VIDEO: "🎬",
  }
  const getIcon = (type: string) => icons[type] ?? "📄"

  const courseLabel = MERGED_COURSE_LABELS[params.courseId] ?? params.courseId

  // ── Sidebar nav content (shared between desktop + mobile) ──
  const SidebarNav = () => (
    <>
      <a href={`/${locale}/courses`} style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
        {labels.back}
      </a>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.58)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
        {courseLabel}
      </p>
      {courseModules.map((mod) => {
        const isActive = mod.id === module.id
        return (
          <a key={mod.id} href={`/${locale}/courses/${params.courseId}/modules/${mod.id}`}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10, marginBottom: 6,
              background: isActive ? "rgba(16,185,129,0.12)" : "transparent",
              border: isActive ? "1px solid rgba(16,185,129,0.2)" : "1px solid transparent",
              textDecoration: "none", transition: "all 0.15s",
            }}>
            <span style={{ fontSize: 16 }}>{getIcon(mod.type)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: isActive ? "#10b981" : "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: isActive ? 700 : 400, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {mod.title.split("—")[1]?.trim() ?? mod.title}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, margin: 0 }}>
                {mod.duration} {labels.min} · +{mod.xpReward} XP
              </p>
            </div>
          </a>
        )
      })}
    </>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#080c10", fontFamily: "'DM Mono',monospace", color: "white" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono&display=swap');
        ::-webkit-scrollbar { display: none; }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Mobile top bar ── */}
      {isMobile && (
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#080c10", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <a href={`/${locale}/courses`} style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textDecoration: "none" }}>
            ←
          </a>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, color: "white", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {module.title.split("—")[1]?.trim() ?? module.title}
            </p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.62)", fontSize: 12 }}>
              {module.level} · {module.duration} {labels.min} · +{module.xpReward} XP
            </p>
          </div>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", color: "rgba(255,255,255,0.6)", fontSize: 11, cursor: "pointer" }}
          >
            {labels.menuLabel}
          </button>
        </div>
      )}

      {/* ── Mobile drawer menu ── */}
      {isMobile && showMobileMenu && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)" }} onClick={() => setShowMobileMenu(false)}>
          <div
            style={{ position: "absolute", top: 0, left: 0, width: 280, height: "100%", background: "#0d1117", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "24px 16px", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            <SidebarNav />
          </div>
        </div>
      )}

      <div style={{ display: "flex", height: isMobile ? "auto" : "100vh" }}>

        {/* ── Desktop left sidebar ── */}
        {!isMobile && (
          <div style={{ width: 260, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", overflowY: "auto", padding: "24px 16px" }}>
            <SidebarNav />
          </div>
        )}

        {/* ── Main content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 16px" : "32px 40px" }}>

          {/* Module header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 99, fontWeight: 700, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
                {module.level}
              </span>
              <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 99, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.65)" }}>
                {localizedType(module.type)}
              </span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.60)" }}>⏱ {module.duration} {labels.min}</span>
              <span style={{ fontSize: 10, color: "#f59e0b" }}>+{module.xpReward} XP</span>
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 20 : 26, fontWeight: 800, margin: "0 0 4px" }}>
              {module.title}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, margin: 0, fontStyle: "italic" }}>
              {module.titleDE}
            </p>
          </div>

          {/* ── LESSON ── */}
          {module.type === "LESSON" && module.content && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Introduction */}
              <div style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <p style={{ fontSize: 10, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>
                  {labels.introduction}
                </p>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, margin: "0 0 8px", lineHeight: 1.7 }}>
                  {locale === "en" && module.content.introduction_en
                    ? module.content.introduction_en as string
                    : module.content.introduction as string}
                </p>
                {(locale === "en" ? module.content.kulturhinweis_en : module.content.kulturhinweis) && (
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, margin: 0, fontStyle: "italic" }}>
                    {locale === "en"
                      ? module.content.kulturhinweis_en as string
                      : module.content.kulturhinweis as string}
                  </p>
                )}
              </div>

              {/* Key phrases preview — only for intro modules (wortschatz is null but keyPhrases exist) */}
              {!module.content.wortschatz && ((module.content.keyPhrases as string[] | undefined)?.length ?? 0) > 0 && (
                <div style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
                  <p style={{ fontSize: 10, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px", fontWeight: 700 }}>
                    {locale === "en" ? "Key phrases" : "Phrases clés"}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(module.content.keyPhrases as string[]).map((phrase, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <AudioPlayer text={phrase} gender="female" accent="de" rate="0.85" label={phrase} />
                        <span style={{ color: "#10b981", fontSize: 14, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{phrase}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vocabulary — only when wortschatz has items */}
              {((module.content.wortschatz as unknown[] | null | undefined)?.length ?? 0) > 0 && (
                <div style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, margin: "0 0 16px" }}>{labels.vocabulary}</h2>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 10 }}>
                    {(module.content.wortschatz as Array<{ de: string; fr: string; en?: string; example: string }>).map((word, i) => (
                      <div key={i} style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                          <span style={{ color: "#10b981", fontSize: 15, fontWeight: 700 }}>{word.de}</span>
                          <AudioPlayer text={word.de} gender="female" accent="de" rate="0.8" label={word.de} />
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.70)", fontSize: 13, margin: "0 0 6px" }}>
                          {locale === "en" ? (word.en ?? word.fr) : word.fr}
                        </p>
                        {word.example && word.example !== word.de && (
                          <p style={{ color: "rgba(255,255,255,0.60)", fontSize: 12, margin: 0, fontStyle: "italic" }}>{word.example}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grammar — only when grammatik exists */}
              {module.content.grammatik && (
                <div style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, margin: "0 0 6px" }}>{labels.grammar}</h2>
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, margin: "0 0 16px", fontStyle: "italic" }}>
                    {locale === "en"
                      ? (module.content.grammatik.ruleEN as string ?? module.content.grammatik.ruleDE as string)
                      : module.content.grammatik.ruleDE as string}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: "0 0 16px", lineHeight: 1.7 }}>
                    {locale === "en"
                      ? (module.content.grammatik.explanation_en as string ?? module.content.grammatik.explanation as string)
                      : module.content.grammatik.explanation as string}
                  </p>

                  {/* Examples table — dynamic columns */}
                  {(module.content.grammatik.table.rows as string[][]).length > 0 && (() => {
                    const headers = module.content.grammatik.table.headers as string[]
                    const rows = module.content.grammatik.table.rows as string[][]
                    const colCount = headers.filter((h: string) => h !== "").length || 1
                    const isMultiCol = colCount >= 3
                    return (
                      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: `repeat(${colCount},1fr)`, background: "rgba(16,185,129,0.08)", borderBottom: "1px solid rgba(16,185,129,0.15)" }}>
                          {headers.filter((h: string) => h !== "").map((h: string, i: number) => (
                            <div key={i} style={{ padding: "10px 16px", color: "#10b981", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{h}</div>
                          ))}
                        </div>
                        {rows.map((row: string[], i: number) => {
                          const cells = row.filter((c: string) => !(colCount < 3 && c === ""))
                          return (
                            <div key={i} style={{ display: "grid", gridTemplateColumns: `repeat(${colCount},1fr)`, borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                              {cells.map((cell: string, j: number) => (
                                <div key={j} style={{ padding: isMobile ? "8px 10px" : "10px 16px", color: isMultiCol ? (j === 0 ? "#10b981" : j === 1 ? "white" : "rgba(255,255,255,0.5)") : "#10b981", fontSize: isMultiCol && j === 1 ? 15 : 13, fontWeight: isMultiCol && j === 1 ? 700 : (j === 0 ? 700 : 400), fontStyle: isMultiCol && j === 2 ? "italic" : "normal", display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Mono',monospace" }}>
                                  {cell}
                                  {isMultiCol && j === 1 && <AudioPlayer text={cell} gender="female" rate="0.8" />}
                                  {!isMultiCol && j === 0 && <AudioPlayer text={cell} gender="female" rate="0.8" />}
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}

                  {/* Common mistakes — only when non-empty */}
                  {((module.content.grammatik.commonMistakes as unknown[] | undefined)?.length ?? 0) > 0 && (
                    <div>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.58)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                        {labels.commonMistakes}
                      </p>
                      {(module.content.grammatik.commonMistakes as Array<{ wrong: string; correct: string; explanation: string }>).map((err, i) => (
                        <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", marginBottom: 6, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ color: "#ef4444", fontSize: 13, textDecoration: "line-through" }}>{err.wrong}</span>
                          <span style={{ color: "rgba(255,255,255,0.65)" }}>→</span>
                          <span style={{ color: "#10b981", fontSize: 13, fontWeight: 700 }}>{err.correct}</span>
                          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>{err.explanation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reading text */}
              {module.content.lesetext && (
                <div style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                    <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, margin: 0 }}>📄 {(module.content.lesetext as { title: string }).title}</h2>
                    <button
                      onClick={() => setShowTranslation(!showTranslation)}
                      style={{ padding: "5px 12px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: showTranslation ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", border: showTranslation ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.1)", color: showTranslation ? "#10b981" : "rgba(255,255,255,0.4)", cursor: "pointer" }}
                    >
                      {showTranslation ? labels.hideTranslation : labels.showTranslation}
                    </button>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, margin: "0 0 12px", fontStyle: "italic" }}>
                    {(module.content.lesetext as { context: string }).context}
                  </p>
                  <div style={{ padding: "14px 18px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 12 }}>
                    {(module.content.lesetext as { text: string }).text.split("\n").map((line: string, i: number) => (
                      <p key={i} style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, margin: "0 0 6px", lineHeight: 1.7 }}>{line}</p>
                    ))}
                  </div>
                  {showTranslation && (
                    <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)" }}>
                      {(module.content.lesetext as { translation: string }).translation.split("\n").map((line: string, i: number) => (
                        <p key={i} style={{ color: "rgba(255,255,255,0.68)", fontSize: 13, margin: "0 0 4px", fontStyle: "italic" }}>{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => handleComplete(85)}
                style={{ padding: "14px", borderRadius: 14, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
                {labels.markDone.replace("{xp}", String(module.xpReward))}
              </button>
            </div>
          )}

          {/* ── HOEREN ── */}
          {module.type === "HOEREN" && module.content && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0 }}>
                  {labels.listenInstructions}
                </p>
              </div>

              {module.content.dialogs?.map((dialog: { title: string; context_fr: string; context_en?: string; lines: { sprecher: string; text: string; translation: string; gender: "male" | "female" | undefined; pause_after_ms?: number }[] }, i: number) => (
                <DialogPlayer
                  key={i}
                  title={dialog.title}
                  context_fr={dialog.context_fr}
                  context_en={dialog.context_en}
                  lines={dialog.lines}
                  onComplete={() => i === module.content.dialogs.length - 1 && handleComplete(80)}
                  locale={locale}
                />
              ))}

              <button onClick={() => handleComplete(80)}
                style={{ padding: "14px", borderRadius: 14, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {labels.exercisesDone.replace("{xp}", String(module.xpReward))}
              </button>
            </div>
          )}

          {/* ── CONVERSATION (Sprechen) ── */}
          {module.type === "CONVERSATION" && module.content && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0 }}>
                  {labels.speakInstructions}
                </p>
              </div>

              {/* Phrases to repeat */}
              {module.content.exercises?.[0]?.phrases && (
                <div style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, margin: "0 0 16px" }}>
                    {labels.repeatModel}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {module.content.exercises[0].phrases.map((phrase: { de: string; fr: string }, i: number) => (
                      <div key={i} style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 12, alignItems: "center" }}>
                        <AudioPlayer text={phrase.de} gender="female" rate="0.8" label={phrase.de} />
                        <div style={{ flex: 1 }}>
                          <p style={{ color: "white", fontSize: 14, fontWeight: 600, margin: "0 0 2px" }}>{phrase.de}</p>
                          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0, fontStyle: "italic" }}>{phrase.fr}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Free expression */}
              {module.content.freeTask && (
                <div style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, margin: "0 0 8px" }}>
                    {labels.freeExpression}
                  </h3>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: "0 0 16px" }}>
                    {module.content.freeTask.instruction}
                  </p>
                  <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", marginBottom: 16 }}>
                    <p style={{ color: "#f59e0b", fontSize: 12, margin: 0 }}>
                      💡 {labels.guideLabel} : {module.content.freeTask.example}
                    </p>
                  </div>
                  <VoiceRecorder
                    level={module.level}
                    exerciseType="expression_libre"
                    placeholder={locale === "en" ? "Click the mic and speak German…" : "Cliquez sur le micro et parlez en allemand…"}
                    onResult={(analysis) => {
                      if (analysis?.score_global >= 6) handleComplete(analysis.score_global * 10)
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── SCHREIBEN ── */}
          {module.type === "SCHREIBEN" && module.content && (
            <div>
              <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", marginBottom: 20 }}>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0 }}>
                  {labels.writeInstructions}
                </p>
              </div>

              {/* Live grammar inspector */}
              <GrammarInspector locale={locale} labels={labels} />

              <SchreibenEditor
                task={module.content.task}
                taskDE={module.content.taskDE}
                level={module.level}
                exerciseType="presentation"
                minWords={module.content.minWords}
                maxWords={module.content.maxWords}
                example={module.content.example}
                onComplete={(scoreVal) => handleComplete(scoreVal)}
              />
            </div>
          )}

          {/* ── QUIZ ── */}
          {module.type === "QUIZ" && (
            <div>
              <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", marginBottom: 20 }}>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0 }}>
                  {labels.quizInstructions}
                </p>
              </div>
              {module.content?.staticQuestions ? (
                <StaticQuizRenderer
                  key={quizKey}
                  questions={module.content.staticQuestions as StaticQuestion[]}
                  locale={locale}
                  onComplete={handleComplete}
                />
              ) : (
                <AdaptiveQuiz
                  key={quizKey}
                  level={module.level}
                  topic={module.topic}
                  moduleId={module.id}
                  questionCount={8}
                  adaptive={true}
                  onComplete={(result) => handleComplete(result.percentage)}
                  onClose={() => { setCompleted(false); setScore(null); setXpEarned(0); setQuizKey(k => k + 1) }}
                />
              )}
            </div>
          )}

          {/* ── VIDEO script placeholder ── */}
          {module.type === "VIDEO" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Coming-soon banner */}
              <div style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, color: "#a5b4fc", margin: "0 0 4px" }}>
                  {locale === "en" ? "Cartoon video — coming soon" : "Vidéo cartoon — bientôt disponible"}
                </h3>
                <p style={{ color: "rgba(255,255,255,0.60)", fontSize: 13, margin: 0 }}>
                  {locale === "en" ? "Scene script available for beta below." : "Script de scène disponible en bêta ci-dessous."}
                </p>
              </div>

              {/* Video meta */}
              {module.content?.videoScript && (() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const vs = module.content.videoScript as any
                return (
                  <div style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p style={{ color: "#10b981", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
                      {locale === "en" ? vs.title_en ?? "Video script" : vs.title_fr ?? "Script vidéo"}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, margin: "0 0 4px" }}>
                      ⏱ {vs.durationSeconds}s · {vs.style}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, margin: 0, fontStyle: "italic" }}>
                      {locale === "en" ? vs.objective_en : vs.objective_fr}
                    </p>
                  </div>
                )
              })()}

              {/* Scenes */}
              {(module.content?.videoScript as { scenes?: Array<{
                sceneNumber: number
                visualPrompt_fr: string
                visualPrompt_en: string
                narration_fr: string
                narration_en: string
                dialogue_de: string
                caption_fr: string
                caption_en: string
                keyVocabulary: string[]
              }> })?.scenes?.map((scene, i) => (
                <div key={i} style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
                    {locale === "en" ? `Scene ${scene.sceneNumber}` : `Scène ${scene.sceneNumber}`}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.70)", fontSize: 13, margin: "0 0 8px", lineHeight: 1.6 }}>
                    {locale === "en" ? scene.visualPrompt_en : scene.visualPrompt_fr}
                  </p>
                  {scene.dialogue_de && (
                    <p style={{ color: "#10b981", fontSize: 14, fontWeight: 700, fontFamily: "'DM Mono',monospace", margin: "0 0 8px", padding: "6px 10px", background: "rgba(16,185,129,0.08)", borderRadius: 6 }}>
                      "{scene.dialogue_de}"
                    </p>
                  )}
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: "0 0 6px", fontStyle: "italic" }}>
                    {locale === "en" ? scene.caption_en : scene.caption_fr}
                  </p>
                  {scene.keyVocabulary?.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {scene.keyVocabulary.map((w, j) => (
                        <span key={j} style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: 11, border: "1px solid rgba(16,185,129,0.2)" }}>
                          {w}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <button onClick={() => handleComplete(100)}
                style={{ padding: "14px", borderRadius: 14, background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
                {locale === "en" ? `✓ Mark as viewed · +${module.xpReward} XP` : `✓ Marquer comme vu · +${module.xpReward} XP`}
              </button>
            </div>
          )}

          {/* ── Completion banner ── */}
          {completed && (() => {
            const step = getNextLearningStep(params.courseId, params.moduleId, locale, labels)
            return (
              <div style={{
                marginTop: 24, padding: "28px 24px", borderRadius: 16, textAlign: "center",
                background: step.isFinal ? "rgba(99,102,241,0.08)" : "rgba(16,185,129,0.1)",
                border: `1px solid ${step.isFinal ? "rgba(99,102,241,0.25)" : "rgba(16,185,129,0.25)"}`,
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <h3 style={{
                  fontFamily: "'Syne',sans-serif", fontSize: 20, margin: "0 0 8px",
                  color: step.isFinal ? "#a5b4fc" : "#10b981",
                }}>
                  {step.isFinal ? labels.finalModuleTitle : labels.moduleCompleted}
                </h3>
                <p style={{
                  color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 1.7,
                  margin: "0 auto 10px", maxWidth: 420,
                }}>
                  {step.isFinal ? labels.finalModuleText : labels.completionText}
                </p>
                {score !== null && (
                  <p style={{ color: score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444", fontSize: 13, fontWeight: 700, margin: "0 0 10px" }}>
                    {labels.scoreLabel} {score}%
                    {score < 60 && <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.5)", marginLeft: 8 }}>— {locale === "en" ? "Keep practicing!" : "Continuez à pratiquer !"}</span>}
                  </p>
                )}
                <p style={{ color: "#f59e0b", fontSize: 14, fontWeight: 700, margin: "0 0 20px" }}>
                  {labels.xpEarned.replace("{xp}", String(xpEarned))} ⚡
                </p>

                {/* Primary CTA — always has a valid href */}
                <a
                  href={step.href}
                  style={{
                    display: "inline-block", padding: "13px 28px", borderRadius: 12,
                    background: step.isFinal
                      ? "linear-gradient(135deg,#6366f1,#4f46e5)"
                      : "linear-gradient(135deg,#10b981,#059669)",
                    color: "white", textDecoration: "none", fontSize: 14,
                    fontWeight: 700, fontFamily: "'Syne',sans-serif",
                  }}
                >
                  {step.label}
                </a>

                {/* Secondary actions */}
                <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
                  {module.type === "QUIZ" && (
                    <>
                      <button
                        onClick={() => { setCompleted(false); setScore(null); setXpEarned(0); setQuizKey(k => k + 1) }}
                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.58)", fontSize: 13, cursor: "pointer", padding: 0 }}
                      >
                        {locale === "en" ? "↩ Retry quiz" : "↩ Réessayer le quiz"}
                      </button>
                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>·</span>
                    </>
                  )}
                  <a href={`/${locale}/courses`} style={{ color: "rgba(255,255,255,0.58)", fontSize: 13, textDecoration: "none" }}>
                    {labels.backToCourses}
                  </a>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>·</span>
                  <a href={`/${locale}/simulateur`} style={{ color: "rgba(255,255,255,0.58)", fontSize: 13, textDecoration: "none" }}>
                    {labels.practiceSimulator}
                  </a>
                </div>
              </div>
            )
          })()}

          {/* Disclaimer */}
          <div style={{ marginTop: 40, padding: "10px 16px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <p style={{ color: "rgba(255,255,255,0.42)", fontSize: "0.72rem", margin: 0, lineHeight: 1.6, textAlign: "center" }}>
              {labels.disclaimer}
            </p>
          </div>
        </div>

        {/* ── Desktop right panel ── */}
        {!isMobile && (
          <div style={{ width: 240, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", overflowY: "auto", padding: "24px 16px" }}>

            {/* XP */}
            <div style={{ padding: "16px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 16, textAlign: "center" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.58)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>{labels.xpThisModule}</p>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: "#f59e0b" }}>
                +{xpEarned || module.xpReward}
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: "4px 0 0" }}>{labels.xpPoints}</p>
            </div>

            {/* Info */}
            <div style={{ padding: "14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.58)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>{labels.infoPanel}</p>
              {[
                { label: labels.typeLabel,     value: module.type },
                { label: labels.levelLabel,    value: module.level },
                { label: labels.durationLabel, value: `${module.duration} ${labels.min}` },
                { label: labels.statusLabel,   value: completed ? labels.done : labels.inProgress },
              ].map((info, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.60)" }}>{info.label}</span>
                  <span style={{ fontSize: 12, color: info.label === labels.statusLabel && completed ? "#10b981" : "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                    {info.value}
                  </span>
                </div>
              ))}
            </div>

            {/* AI tools */}
            <div style={{ padding: "14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.58)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
                {labels.aiTools}
              </p>
              {[
                { icon: "🔊", label: labels.aiTts },
                { icon: "🎙️", label: labels.aiVoice },
                { icon: "✨", label: labels.aiCorrection },
                { icon: "🧠", label: labels.aiQuiz },
              ].map((tool, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>{tool.icon}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{tool.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
