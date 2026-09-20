import type { A1Exercise } from "@/content/monde-a1-v2/types";
import { a1AnswersEqual, normalizeA1Answer } from "./normalization";

export type A1ExerciseEvaluation = {
  status: "CORRECT" | "INCORRECT" | "MANUAL";
  correct: boolean | null;
  feedback: string;
  acceptedWithNote?: boolean;
  remediationRef?: string;
};

function safeNearMiss(pattern: string, value: string) {
  try {
    return new RegExp(pattern, "i").test(value);
  } catch {
    return false;
  }
}

function evaluateText(exercise: A1Exercise, value: string): A1ExerciseEvaluation {
  const rules = exercise.normalization ?? [];
  const answers = [
    ...(typeof exercise.answer === "string" ? [exercise.answer] : []),
    ...(exercise.acceptedAnswers ?? []),
  ];

  if (answers.some((answer) => a1AnswersEqual(value, answer, rules))) {
    return {
      status: "CORRECT",
      correct: true,
      feedback: "Réponse correcte.",
    };
  }

  const normalized = normalizeA1Answer(value, rules);
  for (const nearMiss of exercise.nearMisses ?? []) {
    const patternTarget = rules.includes("case") ? normalized : value;
    if (!safeNearMiss(nearMiss.pattern, patternTarget)) continue;
    return {
      status: nearMiss.accept ? "CORRECT" : "INCORRECT",
      correct: nearMiss.accept,
      feedback: nearMiss.note,
      acceptedWithNote: nearMiss.accept || undefined,
      remediationRef: nearMiss.accept ? undefined : exercise.remediationRef,
    };
  }

  return {
    status: "INCORRECT",
    correct: false,
    feedback: exercise.feedbackIncorrect ?? "Réessaie en t'appuyant sur le modèle de la leçon.",
    remediationRef: exercise.remediationRef,
  };
}

function evaluateGuidedProduction(exercise: A1Exercise, value: string): A1ExerciseEvaluation {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length < (exercise.minimumWords ?? 1)) {
    return {
      status: "INCORRECT",
      correct: false,
      feedback: `Ta production est encore trop courte : ${exercise.minimumWords ?? 1} mots minimum.`,
      remediationRef: exercise.remediationRef,
    };
  }

  const normalized = normalizeA1Answer(value, ["case", "space", "punct", "eszett", "umlaut"]);
  const checks = (exercise.autoCheck ?? [])
    .map((rule) => rule.match(/^contient\s+(.+)$/i)?.[1]?.trim())
    .filter((item): item is string => Boolean(item));

  const missing = checks.filter((needle) =>
    !normalized.includes(
      normalizeA1Answer(needle, ["case", "space", "punct", "eszett", "umlaut"]),
    ),
  );

  if (missing.length > 0) {
    return {
      status: "INCORRECT",
      correct: false,
      feedback: `Il manque encore : ${missing.join(", ")}.`,
      remediationRef: exercise.remediationRef,
    };
  }

  return {
    status: "CORRECT",
    correct: true,
    feedback: "Les blocs attendus sont présents. Relis maintenant ta production à voix haute.",
  };
}

export function evaluateA1Exercise(
  exercise: A1Exercise,
  response: string | string[],
): A1ExerciseEvaluation {
  if (exercise.choices?.length) {
    const choiceId = Array.isArray(response) ? response[0] ?? "" : response;
    const choice = exercise.choices.find((item) => item.id === choiceId);
    if (!choice) {
      return { status: "INCORRECT", correct: false, feedback: "Choisis une réponse." };
    }
    return {
      status: choice.correct ? "CORRECT" : "INCORRECT",
      correct: choice.correct,
      feedback: choice.feedback,
      remediationRef: choice.correct ? undefined : exercise.remediationRef,
    };
  }

  if (Array.isArray(exercise.answer)) {
    const tokens = Array.isArray(response)
      ? response
      : response.trim().split(/\s+/).filter(Boolean);
    const correct = tokens.length === exercise.answer.length
      && tokens.every((token, index) => token === exercise.answer?.[index]);
    return {
      status: correct ? "CORRECT" : "INCORRECT",
      correct,
      feedback: correct
        ? "Ordre correct."
        : exercise.feedbackIncorrect ?? "Regarde la place du verbe et reconstruis la phrase.",
      remediationRef: correct ? undefined : exercise.remediationRef,
    };
  }

  if (exercise.type === "guidedProduction") {
    return evaluateGuidedProduction(exercise, Array.isArray(response) ? response.join(" ") : response);
  }

  if (exercise.type === "shadowing") {
    return {
      status: "MANUAL",
      correct: null,
      feedback: "Le shadowing se valide sur une transcription contrainte, jamais sur une production libre.",
    };
  }

  if (typeof response === "string") return evaluateText(exercise, response);

  return {
    status: "MANUAL",
    correct: null,
    feedback: "Cette activité nécessite une validation guidée.",
  };
}
