// P4.5-B2b3b-b1 Student UI · compteur canonique 1000 mots.
// Utilise EXACTEMENT la même fonction de comptage que le validator
// serveur (`countMondeSubmissionWords`) · évite tout écart client/serveur.
// Accessible via aria-live pour SR.

"use client";

import {
  MAX_MONDE_SUBMISSION_WORDS,
  countMondeSubmissionWords,
} from "@/lib/assignments/transitions";

interface Props {
  locale: string;
  text: string;
  /** Fraction du max déclenchant l'alerte visuelle (défaut 0.9). */
  warningRatio?: number;
}

const COPY = {
  fr: {
    label: "Nombre de mots",
    of: "sur",
    remaining: "mots restants",
    overLimit: "Limite dépassée. Réduisez le texte pour continuer.",
    approaching: "Vous approchez de la limite.",
  },
  en: {
    label: "Word count",
    of: "of",
    remaining: "words remaining",
    overLimit: "Limit exceeded. Please shorten the text to continue.",
    approaching: "You are approaching the limit.",
  },
} as const;

export function isOverLimit(text: string): boolean {
  return countMondeSubmissionWords(text) > MAX_MONDE_SUBMISSION_WORDS;
}

export default function WordCounter({ locale, text, warningRatio = 0.9 }: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  const count = countMondeSubmissionWords(text);
  const remaining = MAX_MONDE_SUBMISSION_WORDS - count;
  const over = count > MAX_MONDE_SUBMISSION_WORDS;
  const warn = !over && count / MAX_MONDE_SUBMISSION_WORDS >= warningRatio;
  const color = over ? "var(--oxblood)" : warn ? "var(--brass)" : "var(--creme-mute)";
  return (
    <div className="flex flex-col gap-1 text-xs" role="group" aria-label={c.label}>
      <div className="flex items-center justify-between">
        <span style={{ color: "var(--creme-mute)" }}>
          {c.label}
        </span>
        <span
          style={{ color, fontVariantNumeric: "tabular-nums" }}
          data-testid="word-count"
        >
          {count} {c.of} {MAX_MONDE_SUBMISSION_WORDS}
        </span>
      </div>
      <p
        role="status"
        aria-live="polite"
        className="text-xs"
        style={{ color, minHeight: "1em" }}
      >
        {over
          ? c.overLimit
          : warn
            ? c.approaching
            : `${remaining} ${c.remaining}`}
      </p>
    </div>
  );
}
