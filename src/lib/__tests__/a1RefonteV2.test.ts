import { describe, expect, it } from "vitest";
import {
  A1_V2_SYLLABUS,
  A1_V2_SYLLABUS_TOTALS,
  A1_V2_UNIT_1,
  A1_V2_UNIT_2,
  A1_V2_UNIT_3,
  A1_V2_UNIT_6,
  A1_V2_UNITS,
  MONDE_A1_V2_MANIFEST,
  getA1V2Card,
  getA1V2CardsAvailableForLesson,
  getA1V2Exercise,
  getA1V2Lesson,
  getA1V2LessonContext,
  getA1V2Remediation,
} from "@/content/monde-a1-v2";
import { resolveA1V2AudioText } from "@/content/monde-a1-v2/audio";
import { evaluateA1Exercise } from "@/lib/course-content/a1-v2/evaluation";
import {
  nextCardMemory,
  selectWakeCards,
  shouldTriggerRemediation,
} from "@/lib/course-content/a1-v2/memory";
import { normalizeA1Answer } from "@/lib/course-content/a1-v2/normalization";

describe("A1 refonte v2 · source contract", () => {
  it("keeps the received U1 reference exact and refuses to pretend the full A1 is ready", () => {
    expect(A1_V2_UNIT_1.id).toBe("de-a1-u1");
    expect(A1_V2_UNIT_1.order).toBe(1);
    expect(A1_V2_UNIT_1.title).toBe("Saluer et se présenter");
    expect(A1_V2_UNIT_1.schemaVersion).toBe("2.0");
    expect(A1_V2_UNIT_1.contentVersion).toBe("2026.09.20-u1-refonte-r3");
    expect(A1_V2_UNIT_1.status).toBe("gabarit-a-valider");
    expect(A1_V2_UNIT_1.cards).toHaveLength(40);
    expect(A1_V2_UNIT_1.objectives).toHaveLength(6);
    expect(A1_V2_UNIT_1.remediations).toHaveLength(5);
    expect(A1_V2_UNIT_1.lessons).toHaveLength(5);
    expect(A1_V2_UNIT_1.lessons.flatMap((lesson) => lesson.exercises)).toHaveLength(25);

    expect(MONDE_A1_V2_MANIFEST.courseId).toBe("monde-solo-de-a1");
    expect(MONDE_A1_V2_MANIFEST.target).toMatchObject({
      units: 12,
      lessons: 60,
      exercises: 180,
      guidedHoursMin: 35,
      guidedHoursMax: 40,
      lexicalItemsMin: 450,
      lexicalItemsMax: 600,
    });
    expect(MONDE_A1_V2_MANIFEST.status).toBe("REFONTE_IN_PROGRESS");
    expect(MONDE_A1_V2_MANIFEST.status).toBe("REFONTE_IN_PROGRESS");
    expect(MONDE_A1_V2_MANIFEST.readiness.criticalNativeAudioReady).toBe(false);
    expect(MONDE_A1_V2_MANIFEST.readiness.mockExamsReady).toBe(false);
  });

  it("locks a transparent 12-unit / 60-lesson reconstruction plan without pretending it is integrated", () => {
    expect(A1_V2_SYLLABUS_TOTALS).toMatchObject({
      units: 12,
      lessons: 60,
      guidedMinutes: 2160,
      lexicalItems: 480,
      exerciseFloor: 180,
    });
    expect(A1_V2_SYLLABUS_TOTALS.guidedMinutes / 60).toBe(36);
    expect(new Set(A1_V2_SYLLABUS.map((unit) => unit.id)).size).toBe(12);
    expect(A1_V2_SYLLABUS.every((unit) => unit.lessons.length === 5)).toBe(true);
    expect(A1_V2_SYLLABUS.slice(0, 6).every((unit) => unit.origin === "LEGACY_EDITORIAL_REFONTE")).toBe(true);
    expect(A1_V2_SYLLABUS.slice(6).every((unit) => unit.origin === "NEW_RECONSTRUCTION")).toBe(true);
    expect(MONDE_A1_V2_MANIFEST.integratedUnits).toEqual(A1_V2_UNITS.map((unit) => unit.id));
  });

  it("makes U1 a full five-lesson template before U2", () => {
    expect(A1_V2_UNIT_1.lessons.map((lesson) => lesson.id)).toEqual([
      "de-a1-u1-l1",
      "de-a1-u1-l2",
      "de-a1-u1-l3",
      "de-a1-u1-l4",
      "de-a1-u1-l5",
    ]);
    expect(A1_V2_UNIT_1.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0)).toBe(180);
    for (const lesson of A1_V2_UNIT_1.lessons.slice(1)) {
      expect(lesson.reveil.itemCount ?? lesson.reveil.cardIds.length, lesson.id).toBeGreaterThanOrEqual(3);
      expect(lesson.reveil.itemCount ?? lesson.reveil.cardIds.length, lesson.id).toBeLessThanOrEqual(5);
    }
  });

  it("integrates U2 as a five-lesson refonte without opening the full-level READY gate", () => {
    expect(A1_V2_UNIT_2).toMatchObject({
      id: "de-a1-u2",
      order: 2,
      title: "Parler de sa famille",
      contentVersion: "2026.09.20-u2-refonte-r1",
      status: "refonte-a-valider",
    });
    expect(A1_V2_UNIT_2.cards).toHaveLength(40);
    expect(A1_V2_UNIT_2.objectives).toHaveLength(6);
    expect(A1_V2_UNIT_2.remediations).toHaveLength(5);
    expect(A1_V2_UNIT_2.lessons).toHaveLength(5);
    expect(A1_V2_UNIT_2.lessons.flatMap((lesson) => lesson.exercises)).toHaveLength(25);
    expect(A1_V2_UNIT_2.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0)).toBe(180);
    expect(MONDE_A1_V2_MANIFEST.status).toBe("REFONTE_IN_PROGRESS");
    expect(MONDE_A1_V2_MANIFEST.status).toBe("REFONTE_IN_PROGRESS");
  });

  it("resolves U2 stable references, including deliberate cross-unit recall", () => {
    const lessonIds = new Set(A1_V2_UNIT_2.lessons.map((lesson) => lesson.id));
    const allCardIds = new Set(A1_V2_UNITS.flatMap((unit) => unit.cards).map((card) => card.id));
    const objectiveIds = new Set(A1_V2_UNIT_2.objectives.map((objective) => objective.id));
    const remediationIds = new Set(A1_V2_UNIT_2.remediations.map((item) => item.id));

    for (const card of A1_V2_UNIT_2.cards) {
      expect(lessonIds.has(card.introducedIn), card.id).toBe(true);
    }
    for (const lesson of A1_V2_UNIT_2.lessons) {
      expect(lesson.reveil.cardIds.length, lesson.id).toBeGreaterThanOrEqual(3);
      for (const wakeId of lesson.reveil.cardIds) expect(allCardIds.has(wakeId), `${lesson.id}:${wakeId}`).toBe(true);
      for (const objectiveId of lesson.objectiveIds) expect(objectiveIds.has(objectiveId), objectiveId).toBe(true);
      for (const exercise of lesson.exercises) {
        expect(exercise.id.startsWith(`${lesson.id}-e`), exercise.id).toBe(true);
        if (exercise.objectiveId) expect(objectiveIds.has(exercise.objectiveId), exercise.id).toBe(true);
        for (const cardId of exercise.cardIds ?? []) expect(allCardIds.has(cardId), `${exercise.id}:${cardId}`).toBe(true);
        if (exercise.remediationRef) expect(remediationIds.has(exercise.remediationRef), exercise.id).toBe(true);
      }
    }

    expect(getA1V2LessonContext("de-a1-u2-l4")?.unit.id).toBe("de-a1-u2");
    expect(getA1V2Exercise("de-a1-u2-l3-e2")?.unit.id).toBe("de-a1-u2");
    expect(getA1V2Card("card.u2.mutter")?.de).toBe("die Mutter");
    expect(getA1V2Remediation("rem.u2.mein-meine")?.objectiveId).toBe("obj.u2.possessif");
  });

  it("integrates U3 as a five-lesson café refonte without opening READY", () => {
    expect(A1_V2_UNIT_3).toMatchObject({
      id: "de-a1-u3",
      order: 3,
      title: "Commander au café",
      contentVersion: "2026.09.20-u3-refonte-r1",
      status: "refonte-a-valider",
    });
    expect(A1_V2_UNIT_3.cards).toHaveLength(40);
    expect(A1_V2_UNIT_3.objectives).toHaveLength(6);
    expect(A1_V2_UNIT_3.remediations).toHaveLength(5);
    expect(A1_V2_UNIT_3.lessons).toHaveLength(5);
    expect(A1_V2_UNIT_3.lessons.flatMap((lesson) => lesson.exercises)).toHaveLength(25);
    expect(A1_V2_UNIT_3.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0)).toBe(180);
    expect(MONDE_A1_V2_MANIFEST.status).toBe("REFONTE_IN_PROGRESS");
    expect(MONDE_A1_V2_MANIFEST.status).toBe("REFONTE_IN_PROGRESS");
  });

  it("integrates U6 as the sixth of twelve units and removes the legacy A1-finished claim", () => {
    expect(A1_V2_UNIT_6).toMatchObject({
      id: "de-a1-u6",
      order: 6,
      title: "Faire des achats et organiser une sortie",
      contentVersion: "2026.09.20-u6-refonte-r1",
      status: "refonte-a-valider",
    });
    expect(A1_V2_UNIT_6.cards).toHaveLength(40);
    expect(A1_V2_UNIT_6.lessons).toHaveLength(5);
    expect(A1_V2_UNIT_6.lessons.flatMap((lesson) => lesson.exercises)).toHaveLength(25);
    expect(A1_V2_UNIT_6.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0)).toBe(180);
    expect(A1_V2_UNIT_6.lessons.flatMap((lesson) => lesson.exercises).every((exercise) => exercise.promptLang === "de")).toBe(true);
    expect(A1_V2_UNIT_6.note).toContain("moitié");
    expect(A1_V2_UNIT_6.lessons.at(-1)?.completionMessage).toContain("U7");
    expect(MONDE_A1_V2_MANIFEST.integratedUnits).toContain("de-a1-u6");
    expect(MONDE_A1_V2_MANIFEST.status).toBe("REFONTE_IN_PROGRESS");
    expect(MONDE_A1_V2_MANIFEST.status).toBe("REFONTE_IN_PROGRESS");
  });

  it("integrates U7 as explicit NEW_RECONSTRUCTION housing content", () => {
    const unit = A1_V2_UNITS.find((item) => item.id === "de-a1-u7");
    expect(unit).toBeTruthy();
    expect(unit).toMatchObject({
      order: 7,
      title: "Habiter et décrire son logement",
      contentVersion: "2026.09.20-u7-reconstruction-r1",
      status: "reconstruction-a-valider",
    });
    expect(unit!.note).toContain("reconstruction nouvelle");
    expect(unit!.cards).toHaveLength(40);
    expect(unit!.lessons).toHaveLength(5);
    expect(unit!.lessons.flatMap((lesson) => lesson.exercises)).toHaveLength(25);
    expect(unit!.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0)).toBe(180);
    expect(unit!.lessons.flatMap((lesson) => lesson.exercises).every((exercise) => exercise.promptLang === "de")).toBe(true);
    expect(MONDE_A1_V2_MANIFEST.integratedUnits).toContain("de-a1-u7");
    expect(MONDE_A1_V2_MANIFEST.status).toBe("REFONTE_IN_PROGRESS");
  });

  it("integrates U8 as explicit NEW_RECONSTRUCTION work-and-study content", () => {
    const unit = A1_V2_UNITS.find((item) => item.id === "de-a1-u8");
    expect(unit).toBeTruthy();
    expect(unit).toMatchObject({
      order: 8,
      title: "Travail, études et compétences",
      contentVersion: "2026.09.20-u8-reconstruction-r1",
      status: "reconstruction-a-valider",
    });
    expect(unit!.note).toContain("reconstruction nouvelle");
    expect(unit!.cards).toHaveLength(40);
    expect(unit!.lessons).toHaveLength(5);
    expect(unit!.lessons.flatMap((lesson) => lesson.exercises)).toHaveLength(25);
    expect(unit!.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0)).toBe(180);
    expect(unit!.lessons.flatMap((lesson) => lesson.exercises).every((exercise) => exercise.promptLang === "de")).toBe(true);
    expect(MONDE_A1_V2_MANIFEST.integratedUnits).toContain("de-a1-u8");
    expect(MONDE_A1_V2_MANIFEST.status).toBe("REFONTE_IN_PROGRESS");
  });

  it("integrates U9 as explicit NEW_RECONSTRUCTION language-only health content", () => {
    const unit = A1_V2_UNITS.find((item) => item.id === "de-a1-u9");
    expect(unit).toBeTruthy();
    expect(unit).toMatchObject({
      order: 9,
      title: "Santé et rendez-vous",
      contentVersion: "2026.09.20-u9-reconstruction-r1",
      status: "reconstruction-a-valider",
    });
    expect(unit!.note).toContain("strictement linguistique");
    expect(unit!.cards).toHaveLength(40);
    expect(unit!.lessons).toHaveLength(5);
    expect(unit!.lessons.flatMap((lesson) => lesson.exercises)).toHaveLength(25);
    expect(unit!.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0)).toBe(180);
    expect(unit!.lessons.flatMap((lesson) => lesson.exercises).every((exercise) => exercise.promptLang === "de")).toBe(true);
    expect(MONDE_A1_V2_MANIFEST.integratedUnits).toContain("de-a1-u9");
    expect(MONDE_A1_V2_MANIFEST.status).toBe("REFONTE_IN_PROGRESS");
  });

  it("integrates U10 as explicit NEW_RECONSTRUCTION generic service content", () => {
    const unit = A1_V2_UNITS.find((item) => item.id === "de-a1-u10");
    expect(unit).toBeTruthy();
    expect(unit).toMatchObject({
      order: 10,
      title: "Services et démarches du quotidien",
      contentVersion: "2026.09.20-u10-reconstruction-r1",
      status: "reconstruction-a-valider",
    });
    expect(unit!.note).toContain("Aucune procédure administrative réelle");
    expect(unit!.cards).toHaveLength(40);
    expect(unit!.lessons).toHaveLength(5);
    expect(unit!.lessons.flatMap((lesson) => lesson.exercises)).toHaveLength(25);
    expect(unit!.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0)).toBe(180);
    expect(unit!.lessons.flatMap((lesson) => lesson.exercises).every((exercise) => exercise.promptLang === "de")).toBe(true);
    expect(MONDE_A1_V2_MANIFEST.integratedUnits).toContain("de-a1-u10");
    expect(MONDE_A1_V2_MANIFEST.status).toBe("REFONTE_IN_PROGRESS");
  });

  it("integrates U11 as explicit NEW_RECONSTRUCTION travel content", () => {
    const unit = A1_V2_UNITS.find((item) => item.id === "de-a1-u11");
    expect(unit).toBeTruthy();
    expect(unit).toMatchObject({
      order: 11,
      title: "Voyager, météo et projets proches",
      contentVersion: "2026.09.20-u11-reconstruction-r1",
      status: "reconstruction-a-valider",
    });
    expect(unit!.note).toContain("sans introduire artificiellement");
    expect(unit!.cards).toHaveLength(40);
    expect(unit!.lessons).toHaveLength(5);
    expect(unit!.lessons.flatMap((lesson) => lesson.exercises)).toHaveLength(25);
    expect(unit!.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0)).toBe(180);
    expect(unit!.lessons.flatMap((lesson) => lesson.exercises).every((exercise) => exercise.promptLang === "de")).toBe(true);
    expect(MONDE_A1_V2_MANIFEST.integratedUnits).toContain("de-a1-u11");
    expect(MONDE_A1_V2_MANIFEST.status).toBe("REFONTE_IN_PROGRESS");
  });

  it("integrates U12 and closes only the full-level source gate, not public READY", () => {
    const unit = A1_V2_UNITS.find((item) => item.id === "de-a1-u12");
    expect(unit).toBeTruthy();
    expect(unit).toMatchObject({ order: 12, title: "Consolider son autonomie A1", contentVersion: "2026.09.20-u12-reconstruction-r1", status: "reconstruction-a-valider" });
    expect(unit!.cards).toHaveLength(40);
    expect(unit!.lessons).toHaveLength(5);
    expect(unit!.lessons.flatMap((lesson) => lesson.exercises)).toHaveLength(25);
    expect(unit!.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0)).toBe(180);

    const allLessons = A1_V2_UNITS.flatMap((item) => item.lessons);
    const allExercises = allLessons.flatMap((lesson) => lesson.exercises);
    const allCards = A1_V2_UNITS.flatMap((item) => item.cards);
    expect(A1_V2_UNITS).toHaveLength(12);
    expect(allLessons).toHaveLength(60);
    expect(allExercises).toHaveLength(300);
    expect(allCards).toHaveLength(480);
    expect(allLessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0)).toBe(2160);
    expect(MONDE_A1_V2_MANIFEST.integratedUnits).toEqual(A1_V2_UNITS.map((item) => item.id));
    expect(MONDE_A1_V2_MANIFEST.readiness.fullLevelIntegrated).toBe(true);
    expect(MONDE_A1_V2_MANIFEST.readiness.criticalNativeAudioReady).toBe(false);
    expect(MONDE_A1_V2_MANIFEST.readiness.mockExamsReady).toBe(false);
    expect(MONDE_A1_V2_MANIFEST.status).toBe("REFONTE_IN_PROGRESS");
  });

  it("enforces the core doctrine contract on every integrated unit", () => {
    const allCardIds = new Set(A1_V2_UNITS.flatMap((unit) => unit.cards).map((card) => card.id));
    for (const unit of A1_V2_UNITS) {
      const lessonIds = new Set(unit.lessons.map((lesson) => lesson.id));
      const objectiveIds = new Set(unit.objectives.map((objective) => objective.id));
      const remediationIds = new Set(unit.remediations.map((remediation) => remediation.id));
      const exercises = unit.lessons.flatMap((lesson) => lesson.exercises);
      const ratio = (types: string[]) => exercises.filter((exercise) => types.includes(exercise.type)).length / exercises.length;

      expect(unit.lessons, unit.id).toHaveLength(5);
      expect(unit.cards, unit.id).toHaveLength(40);
      expect(exercises, unit.id).toHaveLength(25);
      expect(unit.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0), unit.id).toBe(180);
      expect(ratio(["multipleChoice"]), unit.id).toBeLessThanOrEqual(unit.qualityGates.exerciseMix.recognitionMax);
      expect(ratio(["dictation", "productiveRecall", "transformation", "guidedProduction"]), unit.id).toBeGreaterThanOrEqual(unit.qualityGates.exerciseMix.productiveWrittenMin);
      expect(ratio(["audioCloze", "reorder"]), unit.id).toBeGreaterThanOrEqual(unit.qualityGates.exerciseMix.structureMin);
      expect(ratio(["listeningDiscrimination", "shadowing"]), unit.id).toBeGreaterThanOrEqual(unit.qualityGates.exerciseMix.oralMin);
      expect(exercises.filter((exercise) => exercise.promptLang === "de").length / exercises.length, unit.id).toBeGreaterThanOrEqual(unit.qualityGates.promptLang.deMin);

      for (const card of unit.cards) {
        expect(lessonIds.has(card.introducedIn), card.id).toBe(true);
        expect(card.id).not.toMatch(/\\[[0-9]+\\]/);
      }
      for (const lesson of unit.lessons) {
        for (const objectiveId of lesson.objectiveIds) expect(objectiveIds.has(objectiveId), `${lesson.id}:${objectiveId}`).toBe(true);
        for (const wakeId of lesson.reveil.cardIds) expect(allCardIds.has(wakeId), `${lesson.id}:${wakeId}`).toBe(true);
        for (const exercise of lesson.exercises) {
          expect(exercise.id.startsWith(`${lesson.id}-e`), exercise.id).toBe(true);
          if (exercise.objectiveId) expect(objectiveIds.has(exercise.objectiveId), exercise.id).toBe(true);
          for (const cardId of exercise.cardIds ?? []) expect(allCardIds.has(cardId), `${exercise.id}:${cardId}`).toBe(true);
          if (exercise.remediationRef) expect(remediationIds.has(exercise.remediationRef), exercise.id).toBe(true);
          if (exercise.choices?.length) {
            const feedbacks = exercise.choices.map((choice) => choice.feedback.trim());
            expect(new Set(feedbacks).size, exercise.id).toBe(feedbacks.length);
            expect(exercise.choices.filter((choice) => choice.correct), exercise.id).toHaveLength(1);
          }
          if (unit.qualityGates.normalization.requiredOn.includes(exercise.type)) {
            expect(exercise.normalization?.length ?? 0, exercise.id).toBeGreaterThan(0);
          }
        }
      }
      for (const remediation of unit.remediations) {
        for (const item of remediation.items) {
          if (unit.qualityGates.normalization.requiredOn.includes(item.type)) {
            expect(item.normalization?.length ?? 0, item.id).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("uses only stable references and resolves every objective/card/remediation id", () => {
    const lessonIds = new Set(A1_V2_UNIT_1.lessons.map((lesson) => lesson.id));
    const objectiveIds = new Set(A1_V2_UNIT_1.objectives.map((objective) => objective.id));
    const cardIds = new Set(A1_V2_UNIT_1.cards.map((card) => card.id));
    const remediationIds = new Set(A1_V2_UNIT_1.remediations.map((item) => item.id));

    for (const card of A1_V2_UNIT_1.cards) {
      expect(lessonIds.has(card.introducedIn), card.id).toBe(true);
      expect(card.id).not.toMatch(/\[[0-9]+\]/);
    }

    for (const lesson of A1_V2_UNIT_1.lessons) {
      for (const objectiveId of lesson.objectiveIds) {
        expect(objectiveIds.has(objectiveId), `${lesson.id}:${objectiveId}`).toBe(true);
      }
      for (const block of lesson.blocks) {
        expect(block.id, lesson.id).toBeTruthy();
        expect(JSON.stringify(block)).not.toMatch(/units\[[0-9]+\]|blocks\[[0-9]+\]/);
      }
      for (const exercise of lesson.exercises) {
        expect(exercise.id.startsWith(`${lesson.id}-e`), exercise.id).toBe(true);
        if (exercise.objectiveId) expect(objectiveIds.has(exercise.objectiveId), exercise.id).toBe(true);
        for (const cardId of exercise.cardIds ?? []) {
          expect(cardIds.has(cardId), `${exercise.id}:${cardId}`).toBe(true);
        }
        if (exercise.remediationRef) {
          expect(remediationIds.has(exercise.remediationRef), exercise.id).toBe(true);
        }
      }
    }

    expect(getA1V2Lesson("de-a1-u1-l1")?.title).toBe("Comprendre une première rencontre");
    expect(getA1V2Exercise("de-a1-u1-l2-e2")?.exercise.type).toBe("transformation");
    expect(getA1V2Card("card.u1.v2")?.kind).toBe("structure");
    expect(getA1V2Remediation("rem.u1.v2")?.objectiveId).toBe("obj.u1.question");
  });

  it("resolves every integrated exercise audio reference used by the QA preview", () => {
    const audioRefs = A1_V2_UNITS.flatMap((unit) => unit.lessons).flatMap((lesson) =>
      lesson.exercises.flatMap((exercise) => [
        ...(exercise.audioRef ? [exercise.audioRef] : []),
        ...(exercise.targets ?? []).map((target) => target.audioRef),
      ]),
    );

    for (const ref of audioRefs) {
      expect(resolveA1V2AudioText(ref), ref).toBeTruthy();
    }
  });

  it("meets the received exercise-mix and German-prompt quality gates on U1", () => {
    const exercises = A1_V2_UNIT_1.lessons.flatMap((lesson) => lesson.exercises);
    const ratio = (types: string[]) => exercises.filter((exercise) => types.includes(exercise.type)).length / exercises.length;

    const recognition = ratio(["multipleChoice"]);
    const productiveWritten = ratio(["dictation", "productiveRecall", "transformation", "guidedProduction"]);
    const structure = ratio(["audioCloze", "reorder"]);
    const oral = ratio(["listeningDiscrimination", "shadowing"]);
    const dePrompt = exercises.filter((exercise) => exercise.promptLang === "de").length / exercises.length;

    expect(recognition).toBeLessThanOrEqual(A1_V2_UNIT_1.qualityGates.exerciseMix.recognitionMax);
    expect(productiveWritten).toBeGreaterThanOrEqual(A1_V2_UNIT_1.qualityGates.exerciseMix.productiveWrittenMin);
    expect(structure).toBeGreaterThanOrEqual(A1_V2_UNIT_1.qualityGates.exerciseMix.structureMin);
    expect(oral).toBeGreaterThanOrEqual(A1_V2_UNIT_1.qualityGates.exerciseMix.oralMin);
    expect(dePrompt).toBeGreaterThanOrEqual(A1_V2_UNIT_1.qualityGates.promptLang.deMin);
  });

  it("meets the doctrine ratios and German-prompt gate on U2", () => {
    const exercises = A1_V2_UNIT_2.lessons.flatMap((lesson) => lesson.exercises);
    const ratio = (types: string[]) => exercises.filter((exercise) => types.includes(exercise.type)).length / exercises.length;
    expect(ratio(["multipleChoice"])).toBeLessThanOrEqual(A1_V2_UNIT_2.qualityGates.exerciseMix.recognitionMax);
    expect(ratio(["dictation", "productiveRecall", "transformation", "guidedProduction"])).toBeGreaterThanOrEqual(A1_V2_UNIT_2.qualityGates.exerciseMix.productiveWrittenMin);
    expect(ratio(["audioCloze", "reorder"])).toBeGreaterThanOrEqual(A1_V2_UNIT_2.qualityGates.exerciseMix.structureMin);
    expect(ratio(["listeningDiscrimination", "shadowing"])).toBeGreaterThanOrEqual(A1_V2_UNIT_2.qualityGates.exerciseMix.oralMin);
    expect(exercises.filter((exercise) => exercise.promptLang === "de").length / exercises.length).toBeGreaterThanOrEqual(A1_V2_UNIT_2.qualityGates.promptLang.deMin);
  });

  it("keeps U2 distractor feedback distinct and normalization present", () => {
    const exercises = A1_V2_UNIT_2.lessons.flatMap((lesson) => lesson.exercises);
    for (const exercise of exercises) {
      if (exercise.choices?.length) {
        const feedbacks = exercise.choices.map((choice) => choice.feedback.trim());
        expect(new Set(feedbacks).size, exercise.id).toBe(feedbacks.length);
        expect(exercise.choices.filter((choice) => choice.correct), exercise.id).toHaveLength(1);
      }
      if (A1_V2_UNIT_2.qualityGates.normalization.requiredOn.includes(exercise.type)) {
        expect(exercise.normalization?.length ?? 0, exercise.id).toBeGreaterThan(0);
      }
    }
  });

  it("has distractor-specific feedback and required normalization", () => {
    const exercises = A1_V2_UNIT_1.lessons.flatMap((lesson) => lesson.exercises);
    for (const exercise of exercises) {
      if (exercise.choices?.length) {
        const feedbacks = exercise.choices.map((choice) => choice.feedback.trim());
        expect(new Set(feedbacks).size, exercise.id).toBe(feedbacks.length);
        expect(exercise.choices.filter((choice) => choice.correct), exercise.id).toHaveLength(1);
      }
      if (A1_V2_UNIT_1.qualityGates.normalization.requiredOn.includes(exercise.type)) {
        expect(exercise.normalization?.length ?? 0, exercise.id).toBeGreaterThan(0);
      }
    }

    for (const remediation of A1_V2_UNIT_1.remediations) {
      for (const item of remediation.items) {
        if (A1_V2_UNIT_1.qualityGates.normalization.requiredOn.includes(item.type)) {
          expect(item.normalization?.length ?? 0, item.id).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("A1 refonte v2 · evaluation", () => {
  it("accepts keyboard-safe German variants", () => {
    expect(
      normalizeA1Answer(" Ich HEISSE Anna! ", ["case", "space", "punct", "eszett", "umlaut"]),
    ).toBe("ich heisse anna");
    expect(
      normalizeA1Answer("Grüße", ["case", "space", "punct", "eszett", "umlaut"]),
    ).toBe("gruesse");

    const dictation = getA1V2Exercise("de-a1-u1-l1-e5")!.exercise;
    const result = evaluateA1Exercise(dictation, "ich heisse anna");
    expect(result.correct).toBe(true);
  });

  it("returns the feedback attached to the chosen distractor", () => {
    const qcm = getA1V2Exercise("de-a1-u1-l1-e1")!.exercise;
    const result = evaluateA1Exercise(qcm, "b");
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("Anna");
  });

  it("names known near-miss errors and points to remediation", () => {
    const cloze = getA1V2Exercise("de-a1-u1-l1-e2")!.exercise;
    const result = evaluateA1Exercise(cloze, "von");
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("pays d'origine");
    expect(result.remediationRef).toBe("rem.u1.aus-von");
  });

  it("uses a targeted wo/woher remediation for the comprehension distractor", () => {
    const exercise = getA1V2Exercise("de-a1-u1-l1-e3")!.exercise;
    const result = evaluateA1Exercise(exercise, "b");
    expect(result.correct).toBe(false);
    expect(result.remediationRef).toBe("rem.u1.wo-woher");
    expect(getA1V2Remediation(result.remediationRef!)?.objectiveId).toBe("obj.u1.reperer");
  });

  it("checks guided production for the four required chunks without grading free quality", () => {
    const exercise = getA1V2Exercise("de-a1-u1-l2-e5")!.exercise;
    const good = evaluateA1Exercise(
      exercise,
      "Hallo ich heiße Paul und ich komme aus Kamerun. Ich wohne jetzt in Berlin und ich spreche Französisch und Deutsch.",
    );
    expect(good.correct).toBe(true);

    const incomplete = evaluateA1Exercise(
      exercise,
      "Hallo ich heiße Paul. Ich komme aus Kamerun und ich wohne in Berlin. Heute lerne ich jeden Tag weiter mit meiner Familie und übe sehr viel Deutsch am Abend.",
    );
    expect(incomplete.correct).toBe(false);
    expect(incomplete.feedback).toContain("spreche");
  });

  it("never pretends constrained shadowing was machine-scored when no transcription exists", () => {
    const exercise = getA1V2Exercise("de-a1-u1-l2-e4")!.exercise;
    const result = evaluateA1Exercise(exercise, "");
    expect(result.status).toBe("MANUAL");
    expect(result.correct).toBeNull();
  });
});

describe("A1 refonte v2 · spaced recall and remediation", () => {
  it("schedules successful card recall on J+1 then J+3", () => {
    const card = getA1V2Card("card.u1.heissen")!;
    const now = new Date("2026-09-20T08:00:00.000Z");

    const first = nextCardMemory(card, null, true, now);
    expect(first.intervalIndex).toBe(1);
    expect(first.nextDueAt.toISOString()).toBe("2026-09-21T08:00:00.000Z");

    const second = nextCardMemory(card, {
      itemId: card.id,
      itemKind: "CARD",
      intervalIndex: first.intervalIndex,
      nextDueAt: first.nextDueAt,
      failureStreak: 0,
      lastResult: true,
    }, true, now);
    expect(second.intervalIndex).toBe(2);
    expect(second.nextDueAt.toISOString()).toBe("2026-09-23T08:00:00.000Z");
  });

  it("resets failed cards to immediate review and triggers remediation at two failures", () => {
    const card = getA1V2Card("card.u1.heissen")!;
    const now = new Date("2026-09-20T08:00:00.000Z");
    const failed = nextCardMemory(card, null, false, now);
    expect(failed.intervalIndex).toBe(0);
    expect(failed.nextDueAt.toISOString()).toBe(now.toISOString());
    expect(failed.failureStreak).toBe(1);

    expect(shouldTriggerRemediation(1, "rem.u1.v2")).toBe(false);
    expect(shouldTriggerRemediation(2, "rem.u1.v2")).toBe(true);
  });

  it("exposes all cards up to the lesson's unit for cross-unit Réveil", () => {
    const cards = getA1V2CardsAvailableForLesson("de-a1-u1-l5");
    expect(cards).toHaveLength(A1_V2_UNIT_1.cards.length);
    expect(cards.some((card) => card.id === "card.u1.heissen")).toBe(true);
  });

  it("makes U1 cards available in U2 Réveil without exposing future units", () => {
    const cards = getA1V2CardsAvailableForLesson("de-a1-u2-l1");
    expect(cards).toHaveLength(80);
    expect(cards.some((card) => card.id === "card.u1.heissen")).toBe(true);
    expect(cards.some((card) => card.id === "card.u2.mutter")).toBe(true);
  });

  it("makes U1–U3 cards available in the U3 Réveil boundary", () => {
    const cards = getA1V2CardsAvailableForLesson("de-a1-u3-l1");
    expect(cards).toHaveLength(120);
    expect(cards.some((card) => card.id === "card.u1.heissen")).toBe(true);
    expect(cards.some((card) => card.id === "card.u2.mutter")).toBe(true);
    expect(cards.some((card) => card.id === "card.u3.kaffee")).toBe(true);
  });

  it("makes U1–U4 cards available in the U4 Réveil boundary", () => {
    const cards = getA1V2CardsAvailableForLesson("de-a1-u4-l1");
    expect(cards).toHaveLength(160);
    expect(cards.some((card) => card.id === "card.u4.aufstehen")).toBe(true);
  });

  it("makes U1–U5 cards available in the U5 Réveil boundary", () => {
    const cards = getA1V2CardsAvailableForLesson("de-a1-u5-l1");
    expect(cards).toHaveLength(200);
    expect(cards.some((card) => card.id === "card.u5.entschuldigung")).toBe(true);
  });

  it("makes U1–U6 cards available at the U6 Réveil boundary", () => {
    const cards = getA1V2CardsAvailableForLesson("de-a1-u6-l1");
    expect(cards).toHaveLength(240);
    expect(cards.some((card) => card.id === "card.u6.jacke")).toBe(true);
  });

  it("makes U1–U7 cards available at the U7 Réveil boundary", () => {
    const cards = getA1V2CardsAvailableForLesson("de-a1-u7-l1");
    expect(cards).toHaveLength(280);
    expect(cards.some((card) => card.id === "card.u7.wohnung")).toBe(true);
  });

  it("makes U1–U8 cards available at the U8 Réveil boundary", () => {
    const cards = getA1V2CardsAvailableForLesson("de-a1-u8-l1");
    expect(cards).toHaveLength(320);
    expect(cards.some((card) => card.id === "card.u8.beruf")).toBe(true);
  });

  it("makes U1–U9 cards available at the U9 Réveil boundary", () => {
    const cards = getA1V2CardsAvailableForLesson("de-a1-u9-l1");
    expect(cards).toHaveLength(360);
    expect(cards.some((card) => card.id === "card.u9.termin")).toBe(true);
  });

  it("makes U1–U10 cards available at the U10 Réveil boundary", () => {
    const cards = getA1V2CardsAvailableForLesson("de-a1-u10-l1");
    expect(cards).toHaveLength(400);
    expect(cards.some((card) => card.id === "card.u10.formular")).toBe(true);
  });

  it("makes U1–U11 cards available at the U11 Réveil boundary", () => {
    const cards = getA1V2CardsAvailableForLesson("de-a1-u11-l1");
    expect(cards).toHaveLength(440);
    expect(cards.some((card) => card.id === "card.u11.reise")).toBe(true);
  });

  it("makes all 480 A1 cards available at the U12 Réveil boundary", () => {
    const cards = getA1V2CardsAvailableForLesson("de-a1-u12-l1");
    expect(cards).toHaveLength(480);
    expect(cards.some((card) => card.id === "card.u1.heissen")).toBe(true);
    expect(cards.some((card) => card.id === "card.u12.ich-verstehe-nicht")).toBe(true);
  });

  it("prioritizes missed/due cards in the Réveil", () => {
    const lesson = getA1V2Lesson("de-a1-u1-l2")!;
    const now = new Date("2026-09-20T08:00:00.000Z");
    const cards = selectWakeCards({
      lesson,
      cards: A1_V2_UNIT_1.cards,
      states: [
        {
          itemId: "card.u1.woher",
          itemKind: "CARD",
          intervalIndex: 0,
          nextDueAt: new Date("2026-09-19T08:00:00.000Z"),
          failureStreak: 2,
          lastResult: false,
        },
      ],
      now,
    });

    expect(cards).toHaveLength(3);
    expect(cards[0].id).toBe("card.u1.woher");
  });
});
