import { describe, expect, it } from "vitest";
import type { CourseLesson, CourseUnit } from "@/data/courses/types";
import {
  assertPathwayPersonalizationIntegrity,
  resolveCourseLessonForPathway,
  resolveCourseUnitForPathway,
  resolveMondePathwayVariant,
} from "@/lib/course-content/pathway";
import { buildLessonAudioContent } from "@/lib/course-content/audio";

const lesson: CourseLesson = {
  id: "demo-l1",
  order: 1,
  phase: "Pratique",
  title: "Se présenter",
  objective: "Se présenter simplement",
  durationMinutes: 10,
  xp: 20,
  primaryCta: "Continuer",
  blocks: [{ type: "model", textDe: "Ich heiße Ana.", textFr: "Je m'appelle Ana." }],
  exercises: [{
    id: "demo-ex1",
    type: "multipleChoice",
    prompt: "Choisis la bonne présentation.",
    choices: ["Ich heiße Ana.", "Ich Kaffee Ana."],
    answer: "Ich heiße Ana.",
  }],
  completionMessage: "Terminé",
  pathwayVariants: {
    STUDIES: {
      label: "Études",
      context: "Tu rencontres une personne sur ton campus.",
      contextBlocks: [{
        type: "scenario",
        title: "Sur le campus",
        textDe: "Ich studiere in Berlin.",
        textFr: "J'étudie à Berlin.",
      }],
      exercisePromptOverrides: {
        "demo-ex1": "Sur le campus, choisis la bonne présentation.",
      },
    },
  },
};

const unit: CourseUnit = {
  id: "demo-u1",
  order: 1,
  title: "Se présenter",
  shortTitle: "Présentation",
  communicativeObjective: "Se présenter",
  canDo: "Je peux me présenter.",
  situation: "Rencontre du quotidien",
  estimatedMinutes: 60,
  skills: ["Sprechen"],
  finalMission: "Se présenter",
  hero: { eyebrow: "Unité 1", title: "Premiers échanges", description: "Présente-toi simplement." },
  coreDialogue: {
    id: "dialogue-1",
    title: "Rencontre",
    context: "Une rencontre",
    audioScript: [{ speaker: "A", de: "Hallo!", fr: "Salut !" }],
  },
  vocabulary: [],
  grammar: [],
  pronunciation: { focus: "h", tips: [], drills: [] },
  culture: { title: "Culture", text: "" },
  lessons: [lesson],
  pathwayVariants: {
    STUDIES: {
      label: "Études",
      situation: "Première rencontre sur le campus",
      heroDescription: "Utilise les mêmes bases dans un contexte d'études.",
    },
  },
};

describe("Monde pathway content variants", () => {
  it("reads explicit pathways without guessing ambiguous legacy answers", () => {
    expect(resolveMondePathwayVariant({ pathwayVariant: "VISA" })).toBe("VISA");
    expect(resolveMondePathwayVariant({ pathwayVariant: "NATURALIZATION" })).toBe("NATURALIZATION");
    expect(resolveMondePathwayVariant({ why: "study" })).toBe("STUDIES");
    expect(resolveMondePathwayVariant({ why: "exam" })).toBe("GENERAL");
    expect(resolveMondePathwayVariant({ why: "envie" })).toBe("GENERAL");
    expect(resolveMondePathwayVariant(null)).toBe("GENERAL");
  });

  it("personalizes context and prompts while preserving assessment truth", () => {
    const resolvedLesson = resolveCourseLessonForPathway(lesson, "STUDIES");
    const resolvedUnit = resolveCourseUnitForPathway(unit, "STUDIES");

    expect(resolvedLesson.id).toBe(lesson.id);
    expect(resolvedLesson.phase).toBe(lesson.phase);
    expect(resolvedLesson.xp).toBe(lesson.xp);
    expect(resolvedLesson.objective).toBe(lesson.objective);
    expect(resolvedLesson.exercises[0]?.prompt).toContain("campus");
    expect(resolvedLesson.exercises[0]?.answer).toBe(lesson.exercises[0]?.answer);
    expect(resolvedLesson.exercises[0]?.choices).toEqual(lesson.exercises[0]?.choices);
    expect(resolvedLesson.blocks.length).toBeGreaterThan(lesson.blocks.length);
    expect(resolvedUnit.situation).toContain("campus");
    expect(resolvedUnit.lessons).toBe(unit.lessons);
  });

  it("lets contextual German examples flow into the existing audio extractor", () => {
    const resolvedLesson = resolveCourseLessonForPathway(lesson, "STUDIES");
    const audio = buildLessonAudioContent(unit, resolvedLesson);
    expect(audio.all.some((item) => item.text === "Ich studiere in Berlin.")).toBe(true);
    expect(audio.all.some((item) => item.text === "Ich heiße Ana.")).toBe(true);
  });

  it("rejects structural or scoring fields inside pathway patches", () => {
    const unsafeLesson = {
      ...lesson,
      pathwayVariants: {
        STUDIES: {
          context: "Campus",
          xp: 999,
        },
      },
    } as unknown as CourseLesson;

    expect(() => assertPathwayPersonalizationIntegrity({
      course: {
        id: "unsafe-course",
        track: "monde",
        pathwayPersonalization: { coreShareTarget: 0.7, supportedVariants: ["STUDIES"] },
      },
      units: [{ ...unit, lessons: [unsafeLesson] }],
    })).toThrow(/COURSE_LESSON_PATHWAY_FIELD_FORBIDDEN/);
  });

  it("enforces a minimum 70 percent canonical target and forbids Monde variants in Racines", () => {
    expect(() => assertPathwayPersonalizationIntegrity({
      course: {
        id: "too-low",
        track: "monde",
        pathwayPersonalization: { coreShareTarget: 0.69, supportedVariants: ["STUDIES"] },
      },
      units: [unit],
    })).toThrow(/COURSE_PATHWAY_CORE_SHARE_INVALID/);

    expect(() => assertPathwayPersonalizationIntegrity({
      course: { id: "roots", track: "racines" },
      units: [unit],
    })).toThrow(/COURSE_PATHWAY_VARIANTS_FORBIDDEN/);
  });

  it("falls back to the canonical lesson when a pathway has no authored variant", () => {
    expect(resolveCourseLessonForPathway(lesson, "VISA")).toBe(lesson);
    expect(resolveCourseUnitForPathway(unit, "TOURISM")).toBe(unit);
  });
});
