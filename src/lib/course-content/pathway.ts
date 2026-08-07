import type {
  CourseLesson,
  CourseUnit,
  MondePathwayVariant,
  PersonalizedMondePathwayVariant,
} from "@/data/courses/types";
import { MONDE_PATHWAY_VARIANTS } from "@/data/courses/types";

const PERSONALIZED_VARIANTS = MONDE_PATHWAY_VARIANTS.filter(
  (variant): variant is PersonalizedMondePathwayVariant => variant !== "GENERAL",
);

const LABELS_FR: Record<MondePathwayVariant, string> = {
  GENERAL: "Parcours général",
  STUDIES: "Études",
  VISA: "Visa et démarches",
  NATURALIZATION: "Naturalisation",
  TOURISM: "Tourisme",
};

const LABELS_EN: Record<MondePathwayVariant, string> = {
  GENERAL: "General pathway",
  STUDIES: "Studies",
  VISA: "Visa and procedures",
  NATURALIZATION: "Naturalization",
  TOURISM: "Tourism",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isMondePathwayVariant(value: unknown): value is MondePathwayVariant {
  return typeof value === "string" && (MONDE_PATHWAY_VARIANTS as readonly string[]).includes(value);
}

export function pathwayLabel(pathway: MondePathwayVariant, locale = "fr"): string {
  return locale === "en" ? LABELS_EN[pathway] : LABELS_FR[pathway];
}

/**
 * Reads the explicit modern pathway first, then a very conservative subset
 * of legacy onboarding values. Ambiguous legacy answers intentionally fall
 * back to GENERAL instead of guessing a user's goal.
 */
export function resolveMondePathwayVariant(onboardingAnswers: unknown): MondePathwayVariant {
  if (!isRecord(onboardingAnswers)) return "GENERAL";

  const explicit = onboardingAnswers.pathwayVariant;
  if (isMondePathwayVariant(explicit)) return explicit;

  const why = typeof onboardingAnswers.why === "string" ? onboardingAnswers.why.toLowerCase() : "";
  if (why === "studies" || why === "study") return "STUDIES";
  if (why === "visa") return "VISA";
  if (why === "naturalization" || why === "naturalisation") return "NATURALIZATION";
  if (why === "tourism" || why === "tourisme") return "TOURISM";

  return "GENERAL";
}

export function resolveCourseUnitForPathway(
  unit: CourseUnit,
  pathway: MondePathwayVariant,
): CourseUnit {
  if (pathway === "GENERAL") return unit;
  const variant = unit.pathwayVariants?.[pathway];
  if (!variant) return unit;

  return {
    ...unit,
    situation: variant.situation ?? unit.situation,
    hero: variant.heroDescription
      ? { ...unit.hero, description: variant.heroDescription }
      : unit.hero,
  };
}

export function resolveCourseLessonForPathway(
  lesson: CourseLesson,
  pathway: MondePathwayVariant,
): CourseLesson {
  if (pathway === "GENERAL") return lesson;
  const variant = lesson.pathwayVariants?.[pathway];
  if (!variant) return lesson;

  const contextBlocks = [...(variant.contextBlocks ?? [])];
  if (variant.context) {
    contextBlocks.unshift({
      type: "pathwayContext",
      title: variant.label ?? pathwayLabel(pathway),
      text: variant.context,
    });
  }

  const promptOverrides = variant.exercisePromptOverrides ?? {};
  return {
    ...lesson,
    blocks: contextBlocks.length > 0 ? [...lesson.blocks, ...contextBlocks] : lesson.blocks,
    exercises: lesson.exercises.map((exercise) => {
      const prompt = promptOverrides[exercise.id];
      return prompt ? { ...exercise, prompt } : exercise;
    }),
  };
}

export function assertPathwayPersonalizationIntegrity(course: {
  course: {
    id: string;
    track: "monde" | "racines";
    pathwayPersonalization?: {
      coreShareTarget: number;
      supportedVariants: PersonalizedMondePathwayVariant[];
    };
  };
  units: CourseUnit[];
}): void {
  const config = course.course.pathwayPersonalization;
  const hasUnitVariants = course.units.some((unit) => unit.pathwayVariants && Object.keys(unit.pathwayVariants).length > 0);
  const hasLessonVariants = course.units.some((unit) =>
    unit.lessons.some((lesson) => lesson.pathwayVariants && Object.keys(lesson.pathwayVariants).length > 0),
  );

  if (course.course.track !== "monde" && (config || hasUnitVariants || hasLessonVariants)) {
    throw new Error(`COURSE_PATHWAY_VARIANTS_FORBIDDEN:${course.course.id}`);
  }

  if (config) {
    if (!Number.isFinite(config.coreShareTarget) || config.coreShareTarget < 0.7 || config.coreShareTarget > 1) {
      throw new Error(`COURSE_PATHWAY_CORE_SHARE_INVALID:${course.course.id}`);
    }
    const unique = new Set(config.supportedVariants);
    if (unique.size !== config.supportedVariants.length) {
      throw new Error(`COURSE_PATHWAY_VARIANT_DUPLICATE:${course.course.id}`);
    }
    for (const variant of config.supportedVariants) {
      if (!PERSONALIZED_VARIANTS.includes(variant)) {
        throw new Error(`COURSE_PATHWAY_VARIANT_INVALID:${course.course.id}:${variant}`);
      }
    }
  }

  for (const unit of course.units) {
    for (const [pathway, variant] of Object.entries(unit.pathwayVariants ?? {})) {
      if (!PERSONALIZED_VARIANTS.includes(pathway as PersonalizedMondePathwayVariant)) {
        throw new Error(`COURSE_UNIT_PATHWAY_INVALID:${unit.id}:${pathway}`);
      }
      if (!isRecord(variant)) throw new Error(`COURSE_UNIT_PATHWAY_SHAPE:${unit.id}:${pathway}`);
      const allowed = new Set(["label", "situation", "heroDescription"]);
      for (const key of Object.keys(variant)) {
        if (!allowed.has(key)) throw new Error(`COURSE_UNIT_PATHWAY_FIELD_FORBIDDEN:${unit.id}:${pathway}:${key}`);
      }
    }

    for (const lesson of unit.lessons) {
      const exerciseIds = new Set(lesson.exercises.map((exercise) => exercise.id));
      for (const [pathway, variant] of Object.entries(lesson.pathwayVariants ?? {})) {
        if (!PERSONALIZED_VARIANTS.includes(pathway as PersonalizedMondePathwayVariant)) {
          throw new Error(`COURSE_LESSON_PATHWAY_INVALID:${lesson.id}:${pathway}`);
        }
        if (!isRecord(variant)) throw new Error(`COURSE_LESSON_PATHWAY_SHAPE:${lesson.id}:${pathway}`);
        const allowed = new Set(["label", "context", "contextBlocks", "exercisePromptOverrides"]);
        for (const key of Object.keys(variant)) {
          if (!allowed.has(key)) throw new Error(`COURSE_LESSON_PATHWAY_FIELD_FORBIDDEN:${lesson.id}:${pathway}:${key}`);
        }

        const overrides = variant.exercisePromptOverrides;
        if (overrides !== undefined) {
          if (!isRecord(overrides)) {
            throw new Error(`COURSE_LESSON_PATHWAY_PROMPTS_SHAPE:${lesson.id}:${pathway}`);
          }
          for (const [exerciseId, prompt] of Object.entries(overrides)) {
            if (!exerciseIds.has(exerciseId)) {
              throw new Error(`COURSE_LESSON_PATHWAY_EXERCISE_UNKNOWN:${lesson.id}:${pathway}:${exerciseId}`);
            }
            if (typeof prompt !== "string" || prompt.trim().length === 0) {
              throw new Error(`COURSE_LESSON_PATHWAY_PROMPT_INVALID:${lesson.id}:${pathway}:${exerciseId}`);
            }
          }
        }

        if (variant.contextBlocks !== undefined && !Array.isArray(variant.contextBlocks)) {
          throw new Error(`COURSE_LESSON_PATHWAY_BLOCKS_SHAPE:${lesson.id}:${pathway}`);
        }
      }
    }
  }
}
