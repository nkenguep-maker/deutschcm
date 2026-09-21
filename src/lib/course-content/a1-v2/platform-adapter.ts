import legacyMetaJson from "@/data/courses/monde/adulte/de-a1/meta.json";
import type { CourseBlock, CourseContent, CourseExercise, CourseLesson, CourseMeta, CourseUnit } from "@/data/courses/types";
import { A1_V2_SYLLABUS, A1_V2_UNITS } from "@/content/monde-a1-v2";
import { getA1V2Dialogue } from "@/content/monde-a1-v2/audio";
import type { A1Exercise, A1LessonV2, A1UnitReference } from "@/content/monde-a1-v2/types";

export const A1_V2_PLATFORM_COURSE_ID = "monde-adulte-de-a1" as const;
export const A1_V2_PLATFORM_CONTENT_VERSION = "2026.09.21-a1-v2-platform-r1" as const;

const legacyMeta = legacyMetaJson as unknown as CourseMeta;
const syllabusById = new Map(A1_V2_SYLLABUS.map((unit) => [unit.id, unit]));

function correctChoice(exercise: A1Exercise) {
  return exercise.choices?.find((choice) => choice.correct) ?? null;
}

function mapExercise(exercise: A1Exercise, passScore?: number): CourseExercise {
  const correct = correctChoice(exercise);
  const humanReviewable = exercise.type === "shadowing"
    ? ["Répéter les blocs proposés de façon intelligible."]
    : exercise.successCriteria;

  return {
    id: exercise.id,
    type: exercise.type,
    prompt: exercise.prompt,
    choices: exercise.choices?.map((choice) => choice.text),
    tokens: exercise.tokens,
    answer: exercise.answer ?? correct?.text,
    acceptedAnswers: exercise.acceptedAnswers,
    feedbackCorrect: correct?.feedback,
    feedbackIncorrect:
      exercise.feedbackIncorrect
      ?? exercise.choices?.find((choice) => !choice.correct)?.feedback,
    minimumWords: exercise.minimumWords,
    successCriteria: humanReviewable,
    ...(passScore !== undefined ? { passScore } : {}),
  };
}

function objectiveText(unit: A1UnitReference, lesson: A1LessonV2): string {
  const labels = lesson.objectiveIds
    .map((id) => unit.objectives.find((objective) => objective.id === id)?.label)
    .filter((label): label is string => Boolean(label));
  return labels.join(" · ") || lesson.title;
}

function mapLesson(unit: A1UnitReference, lesson: A1LessonV2): CourseLesson {
  const validation = lesson.phase === "Valide";
  return {
    id: lesson.id,
    order: lesson.order,
    phase: lesson.phase,
    title: lesson.title,
    objective: objectiveText(unit, lesson),
    durationMinutes: lesson.durationMinutes,
    xp: validation ? 40 : 20,
    primaryCta: validation ? "Valider l’unité" : "Continuer",
    blocks: lesson.blocks.map((block) => ({ ...block } as CourseBlock)),
    exercises: lesson.exercises.map((exercise, index) =>
      mapExercise(exercise, validation && index === 0 ? 70 : undefined)),
    completionMessage: lesson.completionMessage,
  };
}

function mapUnit(unit: A1UnitReference): CourseUnit {
  const syllabus = syllabusById.get(unit.id);
  if (!syllabus) throw new Error(`A1_V2_SYLLABUS_MISSING:${unit.id}`);

  const dialogueId = unit.lessons
    .flatMap((lesson) => lesson.blocks)
    .find((block) => block.type === "dialogueRef" && block.dialogueId)
    ?.dialogueId;
  const dialogue = getA1V2Dialogue(dialogueId);
  const finalMission = syllabus.lessons.at(-1)?.title.replace(/^Mission finale\s*:\s*/i, "") ?? syllabus.canDo;

  return {
    id: unit.id,
    order: unit.order,
    title: unit.title,
    shortTitle: unit.title,
    communicativeObjective: syllabus.canDo,
    canDo: syllabus.canDo,
    situation: `Mission : ${finalMission}`,
    estimatedMinutes: unit.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0),
    skills: unit.objectives.slice(0, 4).map((objective) => objective.label),
    finalMission,
    hero: {
      eyebrow: `UNITÉ ${unit.order} · AUTONOMIE A1`,
      title: unit.title,
      description: syllabus.canDo,
    },
    coreDialogue: {
      id: dialogue?.id ?? `${unit.id}-dialogue`,
      title: dialogue?.title ?? unit.title,
      context: dialogue?.context ?? syllabus.canDo,
      audioScript: dialogue?.lines.map((line) => ({
        speaker: line.speaker,
        de: line.de,
        fr: line.fr,
      })) ?? [],
    },
    vocabulary: unit.cards.map((card) => ({
      de: card.de,
      fr: card.fr,
      exampleDe: card.de,
      exampleFr: card.fr,
    })),
    grammar: unit.cards
      .filter((card) => card.kind === "structure")
      .map((card) => ({
        title: card.de,
        explanation: card.fr,
        examples: [{ de: card.de, fr: card.fr }],
      })),
    pronunciation: { focus: "Prononciation en contexte", tips: [], drills: [] },
    culture: { title: "Objectif en situation", text: syllabus.canDo },
    lessons: unit.lessons.map((lesson) => mapLesson(unit, lesson)),
  };
}

const units = A1_V2_UNITS.map(mapUnit);

export const DE_A1_PLATFORM_COURSE: CourseContent = {
  ...legacyMeta,
  schemaVersion: "2.0",
  contentVersion: A1_V2_PLATFORM_CONTENT_VERSION,
  status: "refonte-integration",
  course: {
    ...legacyMeta.course,
    id: A1_V2_PLATFORM_COURSE_ID,
    title: "Allemand A1 — Autonomie du quotidien",
    subtitle: "Comprendre, pratiquer, produire et réactiver les échanges essentiels du niveau A1.",
    description: "Un parcours A1 en 12 missions : premières rencontres, famille, café, routine, ville, achats, logement, travail, santé, services, voyage et consolidation.",
    estimatedTotalMinutes: units.reduce((sum, unit) => sum + unit.estimatedMinutes, 0),
    estimatedWeeks: 12,
    unitCount: units.length,
    lessonCount: units.reduce((sum, unit) => sum + unit.lessons.length, 0),
    completionRule: "Terminer les 12 unités et obtenir au moins 70 % à chaque leçon de validation. Les examens blancs restent un outil de préparation distinct.",
    courseHero: {
      ...legacyMeta.course.courseHero,
      eyebrow: "ALLEMAND A1 · 12 MISSIONS",
      title: "Construis ton autonomie A1 en allemand",
      description: "Avance mission après mission, réactive ce que tu as appris et utilise immédiatement l’allemand dans des situations concrètes.",
      progressLabel: "Progression du niveau A1",
      continueLabel: "Continuer",
    },
    levelOutcomes: A1_V2_SYLLABUS.map((unit) => unit.canDo),
  },
  levelReview: {
    title: "Révision générale A1",
    description: "Réactive les 12 missions avant les examens blancs YEMA A1.",
    sections: units.map((unit) => ({
      title: unit.title,
      prompts: unit.vocabulary.slice(0, 4).map((item) => item.de),
    })),
    finalChecklist: [
      "Je peux comprendre les informations essentielles de situations A1 familières.",
      "Je peux poser et répondre à des questions simples sans traduire chaque mot.",
      "Je peux réutiliser les structures clés des 12 unités.",
      "Je peux accomplir les missions finales avec au moins 70 %.",
      "Je peux utiliser les examens blancs pour identifier mes derniers points à renforcer.",
    ],
  },
  alternativeStates: legacyMeta.alternativeStates.map((state) => {
    if (state.id === "levelComplete") {
      return { ...state, message: "Tu as validé les 12 missions du nouveau parcours A1." };
    }
    if (state.id === "nextLevel") {
      return {
        ...state,
        message: "A2 développera des conversations plus longues, davantage d’imprévus et des explications plus précises.",
      };
    }
    return state;
  }),
  editorialNotes: {
    ...legacyMeta.editorialNotes,
    sourceOfTruth: "src/content/monde-a1-v2",
    platformAdapter: A1_V2_PLATFORM_CONTENT_VERSION,
    legacyShapeReplaced: "6x6 -> 12x5",
  },
  units,
};
