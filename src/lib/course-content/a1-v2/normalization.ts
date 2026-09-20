import type { A1NormalizationRule } from "@/content/monde-a1-v2/types";

const PUNCT = /[.!?;,:"“”„«»]+/g;

export function normalizeA1Answer(
  value: string,
  rules: A1NormalizationRule[] = [],
): string {
  let result = value.normalize("NFC");

  if (rules.includes("space")) {
    result = result.trim().replace(/\s+/g, " ");
  }
  if (rules.includes("punct")) {
    result = result.replace(PUNCT, "").trim();
  }
  if (rules.includes("eszett")) {
    result = result.replace(/ß/g, "ss").replace(/ẞ/g, "SS");
  }
  if (rules.includes("umlaut")) {
    result = result
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/Ä/g, "Ae")
      .replace(/Ö/g, "Oe")
      .replace(/Ü/g, "Ue");
  }
  if (rules.includes("case")) {
    result = result.toLocaleLowerCase("de-DE");
  }

  return result;
}

export function a1AnswersEqual(
  actual: string,
  expected: string,
  rules: A1NormalizationRule[] = [],
): boolean {
  return normalizeA1Answer(actual, rules) === normalizeA1Answer(expected, rules);
}
