import { describe, expect, it } from "vitest";
import { DE_A1_COURSE } from "@/data/courses/registry";
import { buildA1AudioCoverage, buildLessonAudioContent } from "@/lib/course-content/audio";

describe("German A1 audio coverage", () => {
  it("provides playable German audio material for all 36 lessons", () => {
    const coverage = buildA1AudioCoverage(DE_A1_COURSE.units);

    expect(coverage).toHaveLength(6);
    expect(coverage.every((unit) => unit.fullyCovered)).toBe(true);
    expect(coverage.flatMap((unit) => unit.lessons)).toHaveLength(36);
    expect(coverage.flatMap((unit) => unit.lessons).every((lesson) => lesson.total > 0)).toBe(true);
  });

  it("keeps the complete two-speaker dialogue in every unit comprehension lesson", () => {
    for (const unit of DE_A1_COURSE.units) {
      const comprehensionLesson = unit.lessons.find((lesson) => lesson.blocks.some((block) => block.type === "dialogueRef"));
      expect(comprehensionLesson, unit.id).toBeDefined();
      const audio = buildLessonAudioContent(unit, comprehensionLesson!);
      expect(audio.dialogue).toHaveLength(unit.coreDialogue.audioScript.length);
      expect(new Set(audio.dialogue.map((item) => item.voiceSlot)).size).toBeGreaterThanOrEqual(2);
      expect(audio.dialogue.every((item) => item.text.trim().length > 0)).toBe(true);
    }
  });

  it("provides pronunciation drills and spoken production prompts where the course requests them", () => {
    for (const unit of DE_A1_COURSE.units) {
      const pronunciationLesson = unit.lessons.find((lesson) => lesson.blocks.some((block) => block.type === "pronunciationRef"));
      expect(pronunciationLesson, unit.id).toBeDefined();
      const pronunciationAudio = buildLessonAudioContent(unit, pronunciationLesson!);
      expect(pronunciationAudio.pronunciation.length).toBe(unit.pronunciation.drills.length);

      const oralLessons = unit.lessons.filter((lesson) => lesson.exercises.some((exercise) => exercise.type === "oralRecording" || exercise.type === "oralAssessment"));
      expect(oralLessons.length).toBeGreaterThan(0);
    }
  });
});
