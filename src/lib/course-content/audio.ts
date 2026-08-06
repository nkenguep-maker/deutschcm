import type { CourseBlock, CourseLesson, CourseUnit } from "@/data/courses/types";

export type CourseAudioKind = "dialogue" | "phrase" | "pronunciation" | "vocabulary";

export type CourseAudioItem = {
  id: string;
  label: string;
  text: string;
  translation?: string;
  kind: CourseAudioKind;
  voiceSlot: 0 | 1;
};

export type LessonAudioContent = {
  dialogue: CourseAudioItem[];
  phrases: CourseAudioItem[];
  pronunciation: CourseAudioItem[];
  all: CourseAudioItem[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addUnique(target: CourseAudioItem[], seen: Set<string>, item: CourseAudioItem) {
  const normalized = item.text.trim().replace(/\s+/g, " ");
  if (!normalized || seen.has(normalized.toLocaleLowerCase("de-DE"))) return;
  seen.add(normalized.toLocaleLowerCase("de-DE"));
  target.push({ ...item, text: normalized });
}

function collectGermanStrings(
  value: unknown,
  path: string,
  label: string,
  target: CourseAudioItem[],
  seen: Set<string>,
) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectGermanStrings(item, `${path}-${index}`, label, target, seen));
    return;
  }
  if (!isRecord(value)) return;

  for (const [key, nested] of Object.entries(value)) {
    const nestedPath = `${path}-${key}`;
    if (typeof nested === "string") {
      const isGermanField = key === "de" || key === "textDe" || key === "openingDe";
      if (isGermanField) {
        addUnique(target, seen, {
          id: nestedPath,
          label,
          text: nested,
          kind: "phrase",
          voiceSlot: 0,
        });
      }
      continue;
    }

    if (Array.isArray(nested) && key.endsWith("De")) {
      nested.forEach((text, index) => {
        if (typeof text !== "string") return;
        addUnique(target, seen, {
          id: `${nestedPath}-${index}`,
          label,
          text,
          kind: "phrase",
          voiceSlot: index % 2 === 0 ? 0 : 1,
        });
      });
      continue;
    }

    collectGermanStrings(nested, nestedPath, label, target, seen);
  }
}

function blockLabel(block: CourseBlock): string {
  if (typeof block.title === "string" && block.title.trim()) return block.title;
  const labels: Record<string, string> = {
    model: "Modèle",
    audioDrill: "Répétition",
    roleplay: "Jeu de rôle",
    scenario: "Situation",
    productionGuide: "Production",
  };
  return labels[block.type] ?? "Phrase de la leçon";
}

export function buildLessonAudioContent(unit: CourseUnit, lesson: CourseLesson): LessonAudioContent {
  const dialogue: CourseAudioItem[] = [];
  const phrases: CourseAudioItem[] = [];
  const pronunciation: CourseAudioItem[] = [];
  const seenDialogue = new Set<string>();
  const seenPhrases = new Set<string>();
  const seenPronunciation = new Set<string>();

  const hasDialogue = lesson.blocks.some((block) => block.type === "dialogueRef");
  if (hasDialogue) {
    const speakers = new Map<string, 0 | 1>();
    unit.coreDialogue.audioScript.forEach((line, index) => {
      if (!speakers.has(line.speaker)) speakers.set(line.speaker, speakers.size % 2 === 0 ? 0 : 1);
      addUnique(dialogue, seenDialogue, {
        id: `${unit.id}-dialogue-${index}`,
        label: line.speaker,
        text: line.de,
        translation: line.fr,
        kind: "dialogue",
        voiceSlot: speakers.get(line.speaker) ?? 0,
      });
    });
  }

  for (const [blockIndex, block] of lesson.blocks.entries()) {
    if (block.type === "vocabularyRef") {
      unit.vocabulary.forEach((item, index) => {
        addUnique(phrases, seenPhrases, {
          id: `${lesson.id}-vocabulary-${index}`,
          label: item.de,
          text: item.exampleDe || item.de,
          translation: item.exampleFr || item.fr,
          kind: "vocabulary",
          voiceSlot: 0,
        });
      });
    }

    if (block.type === "grammarRef") {
      unit.grammar.forEach((grammar, grammarIndex) => {
        if (grammar.formula) {
          addUnique(phrases, seenPhrases, {
            id: `${lesson.id}-grammar-${grammarIndex}-formula`,
            label: grammar.title,
            text: grammar.formula,
            kind: "phrase",
            voiceSlot: 0,
          });
        }
        grammar.examples.forEach((example, exampleIndex) => {
          addUnique(phrases, seenPhrases, {
            id: `${lesson.id}-grammar-${grammarIndex}-${exampleIndex}`,
            label: grammar.title,
            text: example.de,
            translation: example.fr,
            kind: "phrase",
            voiceSlot: exampleIndex % 2 === 0 ? 0 : 1,
          });
        });
      });
    }

    if (block.type === "pronunciationRef") {
      unit.pronunciation.drills.forEach((drill, index) => {
        addUnique(pronunciation, seenPronunciation, {
          id: `${lesson.id}-pronunciation-${index}`,
          label: unit.pronunciation.focus,
          text: drill,
          kind: "pronunciation",
          voiceSlot: index % 2 === 0 ? 0 : 1,
        });
      });
    }

    if (!["dialogueRef", "vocabularyRef", "grammarRef", "pronunciationRef"].includes(block.type)) {
      collectGermanStrings(block, `${lesson.id}-block-${blockIndex}`, blockLabel(block), phrases, seenPhrases);
    }
  }

  const all = [...dialogue, ...phrases, ...pronunciation];
  return { dialogue, phrases, pronunciation, all };
}

export function buildA1AudioCoverage(units: CourseUnit[]) {
  return units.map((unit) => {
    const lessons = unit.lessons.map((lesson) => {
      const audio = buildLessonAudioContent(unit, lesson);
      return {
        lessonId: lesson.id,
        total: audio.all.length,
        dialogue: audio.dialogue.length,
        phrases: audio.phrases.length,
        pronunciation: audio.pronunciation.length,
      };
    });
    return {
      unitId: unit.id,
      lessons,
      total: lessons.reduce((sum, lesson) => sum + lesson.total, 0),
      fullyCovered: lessons.every((lesson) => lesson.total > 0),
    };
  });
}
