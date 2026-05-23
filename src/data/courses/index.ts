// ── Yema Static Course Adapter ─────────────────────────────────────────────────
// Converts yemaStaticGermanCourses (seed file format) into the BetaModule-
// compatible record maps that the module player page already consumes.
// No AI, no runtime generation — pure static TypeScript.

import { yemaStaticGermanCourses } from "../yema-courses"

// ── Lean Module shape the module player needs ─────────────────────────────────
export interface YemaCourseModule {
  id: string
  title: string
  titleDE: string
  type: "LESSON" | "HOEREN" | "CONVERSATION" | "SCHREIBEN" | "QUIZ" | "VIDEO"
  level: string
  topic: string
  xpReward: number
  duration: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
}

// ── Type map from seed → BetaModule types ────────────────────────────────────
function mapType(seedType: string): YemaCourseModule["type"] {
  switch (seedType) {
    case "lesson":     return "LESSON"
    case "dialogue":   return "HOEREN"
    case "vocabulary": return "LESSON"
    case "grammar":    return "LESSON"
    case "speaking":   return "CONVERSATION"
    case "writing":    return "SCHREIBEN"
    case "quiz":       return "QUIZ"
    case "video":      return "VIDEO"
    default:           return "LESSON"
  }
}

// ── Build flat module maps ────────────────────────────────────────────────────
export const YEMA_MODULES: Record<string, YemaCourseModule> = {}
export const YEMA_COURSE_TO_MODULE_IDS: Record<string, string[]> = {}
export const YEMA_COURSE_LABELS: Record<string, string> = {}
export const YEMA_COURSE_SEQUENCE: string[] = []

// Lesson metadata for the courses listing page
export interface YemaLessonMeta {
  id: string
  courseId: string
  level: string
  order: number
  titleDE: string
  titleFR: string
  titleEN: string
  descriptionFR: string
  descriptionEN: string
  firstModuleId: string
  moduleCount: number
  totalXp: number
}
export const YEMA_LESSON_META: YemaLessonMeta[] = []

for (const course of yemaStaticGermanCourses as unknown as Array<{
  id: string
  level: string
  lessons: Array<{
    id: string
    order: number
    title_de: string
    title_fr: string
    title_en: string
    description_fr: string
    description_en: string
    objective_fr: string
    objective_en: string
    grammar: { fr: string; en: string }
    modules: Array<{
      id: string
      order: number
      type: string
      title_fr: string
      title_en: string
      duration: string
      xp: number
      content?: Record<string, unknown>
      quiz?: Array<{
        id: string
        type: string
        question_fr: string
        question_en: string
        prompt_de: string
        options: string[]
        correctAnswer: string
        explanation_fr: string
        explanation_en: string
        skill: string
        difficulty: string
      }>
      video?: Record<string, unknown>
    }>
  }>
}>) {
  for (const lesson of course.lessons) {
    const lessonId = lesson.id
    YEMA_COURSE_SEQUENCE.push(lessonId)

    const moduleIds = lesson.modules.map(m => m.id)
    YEMA_COURSE_TO_MODULE_IDS[lessonId] = moduleIds
    YEMA_COURSE_LABELS[lessonId] = `${course.level} · ${lesson.title_fr}`

    let lessonXp = 0

    // Pre-collect key phrases from speaking module for intro enrichment
    const speakingMod = lesson.modules.find(m => m.type === "speaking")
    const keyPhrases = ((speakingMod?.content?.starter_de as string[] | undefined) ?? []).slice(0, 4)

    for (const mod of lesson.modules) {
      lessonXp += mod.xp
      const baseType = mapType(mod.type)
      const durNum = parseInt(mod.duration) || 8

      let content: Record<string, unknown> = {}

      if (mod.type === "lesson") {
        content = {
          // Locale-aware intro text — renderer picks the right field
          introduction: (mod.content?.objective_fr as string) ?? "",
          introduction_en: (mod.content?.objective_en as string) ?? "",
          kulturhinweis: (mod.content?.realLifeGoal_fr as string) ?? "",
          kulturhinweis_en: (mod.content?.realLifeGoal_en as string) ?? "",
          wortschatz: null,   // intro has no vocabulary — guard prevents empty section
          grammatik: null,
          lesetext: null,
          keyPhrases,         // preview phrases from speaking module
        }
      } else if (mod.type === "dialogue") {
        const lines = ((mod.content?.dialogue ?? []) as Array<{ speaker: string; text_de: string }>).map(d => ({
          sprecher: d.speaker,
          text: d.text_de,
          translation: "",
          gender: "male" as const,
          pause_after_ms: 700,
        }))
        content = {
          dialogs: [{
            title: lesson.title_de,
            context_fr: (mod.content?.note_fr as string) ?? "",
            context_en: (mod.content?.note_en as string) ?? "",
            lines,
          }],
        }
      } else if (mod.type === "vocabulary") {
        const items = ((mod.content?.items ?? []) as Array<{ de: string; fr: string; en: string }>).map(item => ({
          de: item.de,
          fr: (item.fr && item.fr !== "à traduire dans l'UI") ? item.fr : item.de,
          en: (item.en && item.en.trim()) ? item.en : item.de,
          article: null,
          example: item.de,
          audio: true,
        }))
        content = {
          introduction: `Vocabulaire — ${lesson.title_fr}`,
          introduction_en: `Vocabulary — ${lesson.title_en}`,
          kulturhinweis: null,
          wortschatz: items,   // filled — section renders
          grammatik: null,
          lesetext: null,
        }
      } else if (mod.type === "grammar") {
        const examples = (mod.content?.examples_de ?? []) as string[]
        content = {
          introduction: (mod.content?.explanation_fr as string) ?? "",
          introduction_en: (mod.content?.explanation_en as string) ?? "",
          kulturhinweis: null,
          wortschatz: null,    // grammar has no vocabulary — guard prevents empty section
          grammatik: {
            rule: lesson.grammar.fr,
            ruleEN: lesson.grammar.en,
            ruleDE: lesson.grammar.en,
            explanation: (mod.content?.explanation_fr as string) ?? "",
            explanation_en: (mod.content?.explanation_en as string) ?? "",
            table: {
              headers: ["Beispiel"],
              rows: examples.map(ex => [ex]),
            },
            commonMistakes: [],
          },
          lesetext: null,
        }
      } else if (mod.type === "speaking") {
        const starters = (mod.content?.starter_de ?? []) as string[]
        content = {
          exercises: [{
            instruction: (mod.content?.prompt_fr as string) ?? "",
            phrases: starters.map(de => ({ de, fr: "" })),
          }],
          freeTask: {
            instruction: (mod.content?.prompt_fr as string) ?? "",
            prompt: (mod.content?.prompt_en as string) ?? "",
            example: starters[0] ?? "",
          },
        }
      } else if (mod.type === "writing") {
        content = {
          task: (mod.content?.prompt_fr as string) ?? "",
          taskDE: (mod.content?.prompt_en as string) ?? "",
          minWords: (mod.content?.minWords as number) ?? 20,
          maxWords: (mod.content?.maxWords as number) ?? 60,
          example: "",
        }
      } else if (mod.type === "quiz") {
        const rawQs = mod.quiz ?? []
        content = {
          staticQuestions: rawQs.map(q => ({
            id: q.id,
            qtype: q.type,
            question_fr: q.question_fr,
            question_en: q.question_en,
            prompt_de: q.prompt_de,
            options: q.options,
            correctIndex: q.options.indexOf(q.correctAnswer),
            correctAnswer: q.correctAnswer,
            explanation_fr: q.explanation_fr,
            explanation_en: q.explanation_en,
            skill: q.skill,
            difficulty: q.difficulty,
          })),
        }
      } else if (mod.type === "video") {
        content = {
          videoScript: mod.video ?? {},
        }
      }

      const ym: YemaCourseModule = {
        id: mod.id,
        title: `${lesson.title_fr} — ${mod.title_fr}`,
        titleDE: `${lesson.title_de} — ${mod.title_en}`,
        type: baseType,
        level: course.level,
        topic: lesson.objective_fr,
        xpReward: mod.xp,
        duration: durNum,
        content,
      }
      YEMA_MODULES[mod.id] = ym
    }

    YEMA_LESSON_META.push({
      id: lessonId,
      courseId: course.id,
      level: course.level,
      order: lesson.order,
      titleDE: lesson.title_de,
      titleFR: lesson.title_fr,
      titleEN: lesson.title_en,
      descriptionFR: lesson.description_fr,
      descriptionEN: lesson.description_en,
      firstModuleId: lesson.modules[0]?.id ?? "",
      moduleCount: lesson.modules.length,
      totalXp: lessonXp,
    })
  }
}
