import type {
  RefonteExercise,
  RefonteNearMiss,
  RefonteNormalizationRule,
} from "@/data/courses/monde/adulte/de-a1-refonte/types";

export type RefonteEvaluation = {
  correct: boolean;
  acceptedWithNote: boolean;
  feedback: string;
};

function stripPunctuation(value: string): string {
  return value.replace(/[.!?,;:…"'«»“”‘’()[\]{}]/g, "");
}

function normalizeUmlautFallback(value: string): string {
  return value
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("Ä", "Ae")
    .replaceAll("Ö", "Oe")
    .replaceAll("Ü", "Ue");
}

function normalizeEszett(value: string): string {
  return value.replaceAll("ß", "ss").replaceAll("ẞ", "SS");
}

export function normalizeRefonteAnswer(
  raw: string,
  rules: RefonteNormalizationRule[] = [],
): string {
  let value = raw.normalize("NFC");
  if (rules.includes("space")) value = value.trim().replace(/\s+/g, " ");
  if (rules.includes("punct")) value = stripPunctuation(value);
  if (rules.includes("eszett")) value = normalizeEszett(value);
  if (rules.includes("umlaut")) value = normalizeUmlautFallback(value);
  if (rules.includes("case")) value = value.toLocaleLowerCase("de-DE");
  return value.trim();
}

function matchingNearMiss(
  nearMisses: RefonteNearMiss[] | undefined,
  normalized: string,
): RefonteNearMiss | null {
  for (const nearMiss of nearMisses ?? []) {
    try {
      if (new RegExp(nearMiss.pattern, "iu").test(normalized)) return nearMiss;
    } catch {
      continue;
    }
  }
  return null;
}

function evaluateText(exercise: RefonteExercise, value: string): RefonteEvaluation {
  const rules = exercise.normalization ?? [];
  const normalized = normalizeRefonteAnswer(value, rules);
  const candidates = [
    ...(typeof exercise.answer === "string" ? [exercise.answer] : []),
    ...(exercise.acceptedAnswers ?? []),
  ].map((answer) => normalizeRefonteAnswer(answer, rules));

  if (candidates.includes(normalized)) {
    return { correct: true, acceptedWithNote: false, feedback: "Réponse correcte." };
  }

  const nearMiss = matchingNearMiss(exercise.nearMisses, normalized);
  if (nearMiss) {
    return {
      correct: nearMiss.accept,
      acceptedWithNote: nearMiss.accept,
      feedback: nearMiss.note,
    };
  }

  return {
    correct: false,
    acceptedWithNote: false,
    feedback: exercise.feedbackIncorrect ?? "Réessaie en observant la structure demandée.",
  };
}

export function evaluateRefonteExercise(
  exercise: RefonteExercise,
  value: string | string[] | boolean | undefined,
): RefonteEvaluation {
  if (exercise.type === "multipleChoice" || exercise.type === "listeningDiscrimination") {
    if (typeof value !== "string") {
      return { correct: false, acceptedWithNote: false, feedback: "Choisis une réponse." };
    }
    const choice = exercise.choices?.find((item) => item.id === value) ?? null;
    return {
      correct: Boolean(choice?.correct),
      acceptedWithNote: false,
      feedback: choice?.feedback ?? "Choisis une réponse.",
    };
  }

  if (exercise.type === "reorder") {
    const answer = Array.isArray(exercise.answer) ? exercise.answer : [];
    const current = Array.isArray(value) ? value : [];
    const correct = current.length === answer.length && current.every((item, index) => item === answer[index]);
    return {
      correct,
      acceptedWithNote: false,
      feedback: correct ? "Bonne structure." : exercise.feedbackIncorrect ?? "Regarde la position du verbe et réessaie.",
    };
  }

  if (
    exercise.type === "audioCloze" ||
    exercise.type === "dictation" ||
    exercise.type === "productiveRecall" ||
    exercise.type === "transformation"
  ) {
    return evaluateText(exercise, typeof value === "string" ? value : "");
  }

  if (exercise.type === "guidedProduction") {
    const text = typeof value === "string" ? value.trim() : "";
    const enoughWords = text.split(/\s+/).filter(Boolean).length >= (exercise.minimumWords ?? 1);
    const checks = (exercise.autoCheck ?? []).map((rule) => {
      const token = rule.replace(/^contient\s+/i, "").trim().toLocaleLowerCase("de-DE");
      return token.length === 0 || text.toLocaleLowerCase("de-DE").includes(token);
    });
    const correct = enoughWords && checks.every(Boolean);
    return {
      correct,
      acceptedWithNote: false,
      feedback: correct
        ? "Tes blocs essentiels sont présents."
        : "Complète les blocs demandés avant de valider.",
    };
  }

  if (exercise.type === "shadowing") {
    return {
      correct: value === true,
      acceptedWithNote: false,
      feedback: value === true
        ? "Répétition terminée. La mesure automatique d’intelligibilité sera branchée sur l’énoncé contraint."
        : "Écoute puis répète chaque bloc.",
    };
  }

  return {
    correct: value === true,
    acceptedWithNote: false,
    feedback: value === true ? "Activité terminée." : "Termine l’activité.",
  };
}
