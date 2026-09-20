import { describe, expect, it } from "vitest";
import refonte from "@/data/courses/monde/adulte/de-a1-refonte/u1.json";
import type { GermanA1RefonteUnit } from "@/data/courses/monde/adulte/de-a1-refonte/types";
import { evaluateRefonteExercise, normalizeRefonteAnswer } from "@/lib/course-content/refonteScoring";

const data = refonte as unknown as GermanA1RefonteUnit;

describe("German A1 refonte U1", () => {
  it("locks the supplied reference contract", () => {
    expect(data.schemaVersion).toBe("2.0");
    expect(data.contentVersion).toBe("2026.09.20-u1-refonte-reference");
    expect(data.status).toBe("gabarit-a-valider");
    expect(data.cards).toHaveLength(7);
    expect(data.objectives).toHaveLength(3);
    expect(data.remediations).toHaveLength(2);
    expect(data.lessons).toHaveLength(2);
  });

  it("keeps references stable and resolvable", () => {
    const objectiveIds = new Set(data.objectives.map((item) => item.id));
    const cardIds = new Set(data.cards.map((item) => item.id));
    const remediationIds = new Set(data.remediations.map((item) => item.id));
    for (const lesson of data.lessons) {
      for (const objectiveId of lesson.objectiveIds) expect(objectiveIds.has(objectiveId), objectiveId).toBe(true);
      for (const cardId of lesson.reveil.cardIds) expect(cardIds.has(cardId), cardId).toBe(true);
      for (const exercise of lesson.exercises) {
        expect(objectiveIds.has(exercise.objectiveId), exercise.id).toBe(true);
        for (const cardId of exercise.cardIds ?? []) expect(cardIds.has(cardId), exercise.id + ":" + cardId).toBe(true);
        if (exercise.remediationRef) expect(remediationIds.has(exercise.remediationRef), exercise.id).toBe(true);
      }
    }
  });

  it("accepts keyboard-safe German variants", () => {
    const rules = ["case", "space", "punct", "eszett", "umlaut"] as const;
    expect(normalizeRefonteAnswer(" Ich heiße Anna. ", [...rules]))
      .toBe(normalizeRefonteAnswer("ich heisse anna", [...rules]));
  });

  it("returns distractor-specific feedback", () => {
    const e = data.lessons[0].exercises.find((item) => item.id === "de-a1-u1-l1-e1")!;
    expect(evaluateRefonteExercise(e, "a")).toMatchObject({ correct: true });
    expect(evaluateRefonteExercise(e, "b")).toMatchObject({ correct: false, feedback: expect.stringContaining("Anna") });
  });

  it("uses near misses instead of treating every typo the same", () => {
    const e = data.lessons[0].exercises.find((item) => item.id === "de-a1-u1-l1-e5")!;
    expect(evaluateRefonteExercise(e, "ich heise anna")).toMatchObject({ correct: true, acceptedWithNote: true });
  });

  it("keeps the doctrine quality gates explicit", () => {
    expect(data.qualityGates.exerciseMix.recognitionMax).toBe(0.25);
    expect(data.qualityGates.exerciseMix.productiveWrittenMin).toBe(0.35);
    expect(data.qualityGates.exerciseMix.structureMin).toBe(0.2);
    expect(data.qualityGates.exerciseMix.oralMin).toBe(0.2);
    expect(data.qualityGates.feedback.distinctPerDistractor).toBe(true);
  });
});
