// P4.5-B1 · transitions Monde (Assignment, Submission, Feedback) + word limit.

import { describe, it, expect } from "vitest";
import {
  assertAssignmentTransition,
  assertSubmissionTransition,
  assertFeedbackTransition,
  assertMondeTextOnlyProductionType,
  assertMondeTextOnlyFeedback,
  assertMondeSubmissionWordLimit,
  countMondeSubmissionWords,
  MAX_MONDE_SUBMISSION_WORDS,
} from "../assignments/transitions";
import { AssignmentError, SubmissionError, FeedbackError } from "../assignments/errors";

describe("Assignment transitions · graphe autorisé", () => {
  it.each([
    ["DRAFT", "PUBLISHED"],
    ["DRAFT", "ARCHIVED"],
    ["PUBLISHED", "CLOSED"],
    ["PUBLISHED", "ARCHIVED"],
    ["CLOSED", "ARCHIVED"],
  ] as const)("allow %s → %s", (from, to) => {
    expect(() => assertAssignmentTransition(from, to)).not.toThrow();
  });

  it.each([
    ["DRAFT", "CLOSED"],
    ["PUBLISHED", "DRAFT"],
    ["CLOSED", "PUBLISHED"],
    ["CLOSED", "DRAFT"],
    ["ARCHIVED", "PUBLISHED"],
    ["ARCHIVED", "DRAFT"],
  ] as const)("refuse %s → %s", (from, to) => {
    expect(() => assertAssignmentTransition(from, to)).toThrow(AssignmentError);
    try {
      assertAssignmentTransition(from, to);
    } catch (e) {
      expect((e as AssignmentError).code).toBe("invalid_assignment_transition");
      expect((e as AssignmentError).detail).toMatchObject({ from, to });
    }
  });
});

describe("Submission transitions · graphe autorisé", () => {
  it.each([
    ["DRAFT", "SUBMITTED"],
    ["DRAFT", "WITHDRAWN"],
    ["SUBMITTED", "WITHDRAWN"],
    ["SUBMITTED", "SUPERSEDED"],
  ] as const)("allow %s → %s", (from, to) => {
    expect(() => assertSubmissionTransition(from, to)).not.toThrow();
  });

  it.each([
    ["SUBMITTED", "DRAFT"],
    ["WITHDRAWN", "SUBMITTED"],
    ["WITHDRAWN", "DRAFT"],
    ["SUPERSEDED", "SUBMITTED"],
    ["SUPERSEDED", "DRAFT"],
  ] as const)("refuse %s → %s", (from, to) => {
    expect(() => assertSubmissionTransition(from, to)).toThrow(SubmissionError);
    try {
      assertSubmissionTransition(from, to);
    } catch (e) {
      expect((e as SubmissionError).code).toBe("invalid_submission_transition");
    }
  });
});

describe("Feedback transitions · graphe autorisé", () => {
  it.each([
    ["DRAFT", "PUBLISHED"],
    ["PUBLISHED", "RETRACTED_BY_ADMIN"],
    ["ADDENDUM", "RETRACTED_BY_ADMIN"],
  ] as const)("allow %s → %s", (from, to) => {
    expect(() => assertFeedbackTransition(from, to)).not.toThrow();
  });

  it.each([
    ["PUBLISHED", "DRAFT"],
    ["PUBLISHED", "ADDENDUM"],
    ["ADDENDUM", "PUBLISHED"],
    ["ADDENDUM", "DRAFT"],
    ["RETRACTED_BY_ADMIN", "PUBLISHED"],
    ["RETRACTED_BY_ADMIN", "DRAFT"],
  ] as const)("refuse %s → %s", (from, to) => {
    expect(() => assertFeedbackTransition(from, to)).toThrow(FeedbackError);
    try {
      assertFeedbackTransition(from, to);
    } catch (e) {
      expect((e as FeedbackError).code).toBe("invalid_feedback_transition");
    }
  });
});

describe("assertMondeTextOnlyProductionType · texte uniquement en P4.5-B", () => {
  it("accepts WRITTEN", () => {
    expect(() => assertMondeTextOnlyProductionType("WRITTEN")).not.toThrow();
  });
  it.each(["AUDIO", "MIXED"] as const)("refuses %s", (t) => {
    expect(() => assertMondeTextOnlyProductionType(t)).toThrow(AssignmentError);
    try {
      assertMondeTextOnlyProductionType(t);
    } catch (e) {
      expect((e as AssignmentError).code).toBe("audio_feedback_disabled");
    }
  });
});

describe("assertMondeTextOnlyFeedback · storageObjectId interdit en B", () => {
  it("accepts null/undefined", () => {
    expect(() => assertMondeTextOnlyFeedback(null)).not.toThrow();
    expect(() => assertMondeTextOnlyFeedback(undefined)).not.toThrow();
  });
  it("refuses any string storageObjectId", () => {
    expect(() => assertMondeTextOnlyFeedback("test_sto_1")).toThrow(FeedbackError);
    try {
      assertMondeTextOnlyFeedback("test_sto_1");
    } catch (e) {
      expect((e as FeedbackError).detail).toMatchObject({ reason: "audio_feedback_disabled" });
    }
  });
});

describe("countMondeSubmissionWords · convention split(/\\s+/) trimmed", () => {
  it.each([
    ["", 0],
    ["   ", 0],
    ["un", 1],
    ["deux mots", 2],
    ["  espaces   multiples  ", 2],
    ["ligne\navec\nsauts", 3],
  ])("count(%o) = %i", (text, expected) => {
    expect(countMondeSubmissionWords(text)).toBe(expected);
  });
});

describe("assertMondeSubmissionWordLimit · 1000 mots max", () => {
  it("throws submission_content_required on empty", () => {
    try {
      assertMondeSubmissionWordLimit("");
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(SubmissionError);
      expect((e as SubmissionError).code).toBe("submission_content_required");
    }
  });

  it("accepts under 1000 words", () => {
    const text = "mot ".repeat(500).trim();
    expect(() => assertMondeSubmissionWordLimit(text)).not.toThrow();
  });

  it("accepts exactly 1000 words", () => {
    const text = "mot ".repeat(MAX_MONDE_SUBMISSION_WORDS).trim();
    expect(() => assertMondeSubmissionWordLimit(text)).not.toThrow();
  });

  it("throws submission_too_long over 1000 words", () => {
    const text = "mot ".repeat(MAX_MONDE_SUBMISSION_WORDS + 1).trim();
    try {
      assertMondeSubmissionWordLimit(text);
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(SubmissionError);
      expect((e as SubmissionError).code).toBe("submission_too_long");
      expect((e as SubmissionError).detail).toMatchObject({
        limit: MAX_MONDE_SUBMISSION_WORDS,
        attemptedCount: MAX_MONDE_SUBMISSION_WORDS + 1,
      });
    }
  });
});

describe("Monde limit != Racines limit", () => {
  it("MAX_MONDE_SUBMISSION_WORDS = 1000 (distinct de Racines 250)", () => {
    expect(MAX_MONDE_SUBMISSION_WORDS).toBe(1000);
  });
});
