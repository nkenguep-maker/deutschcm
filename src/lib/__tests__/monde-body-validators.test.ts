// P4.5-B2a · validation body allowlist stricte (§5 brief).

import { describe, it, expect } from "vitest";
import {
  validateCreateAssignmentBody,
  validateUpdateAssignmentBody,
  validateSubmissionBody,
  validateFeedbackBody,
  ASSIGNMENT_CREATE_ALLOWED_KEYS,
  ASSIGNMENT_UPDATE_ALLOWED_KEYS,
  SUBMISSION_ALLOWED_KEYS,
  FEEDBACK_ALLOWED_KEYS,
} from "../assignments/bodyValidators";
import {
  AssignmentError,
  SubmissionError,
  FeedbackError,
} from "../assignments/errors";

describe("Assignment create · allowlist stricte", () => {
  it("accepts allowed minimal body", () => {
    const out = validateCreateAssignmentBody({ title: "Devoir 1" });
    expect(out).toEqual({
      title: "Devoir 1",
      instructions: null,
      dueAt: null,
      productionType: "WRITTEN",
    });
  });

  it("rejette title vide", () => {
    expect(() => validateCreateAssignmentBody({ title: "  " })).toThrow(AssignmentError);
  });

  it("rejette title trop long", () => {
    expect(() => validateCreateAssignmentBody({ title: "x".repeat(201) })).toThrow(AssignmentError);
  });

  it.each([
    "status", "version", "publishedAt", "classroomId", "teacherId", "createdBy", "id",
  ])("rejette clé forbidden `%s`", (key) => {
    try {
      validateCreateAssignmentBody({ title: "T", [key]: "leak" });
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(AssignmentError);
      expect((e as AssignmentError).detail).toMatchObject({ forbiddenKey: key });
    }
  });

  it("rejette clé inconnue arbitraire", () => {
    expect(() => validateCreateAssignmentBody({ title: "T", nefarious: true }))
      .toThrow(AssignmentError);
  });

  it("rejette submissionFormat non-WRITTEN (audio_feedback_disabled)", () => {
    try {
      validateCreateAssignmentBody({ title: "T", submissionFormat: "AUDIO" });
      throw new Error("expected throw");
    } catch (e) {
      expect((e as AssignmentError).code).toBe("audio_feedback_disabled");
    }
  });

  it("rejette dueAt invalide", () => {
    expect(() => validateCreateAssignmentBody({ title: "T", dueAt: "not-a-date" }))
      .toThrow(AssignmentError);
  });
});

describe("Assignment update · allowlist stricte", () => {
  it("empty patch OK", () => {
    expect(validateUpdateAssignmentBody({})).toEqual({});
  });

  it.each(ASSIGNMENT_UPDATE_ALLOWED_KEYS)("accepte clé allowed `%s`", (key) => {
    // Ne throw pas pour la clé allowed (avec un type valide).
    const payload: Record<string, unknown> =
      key === "dueAt" ? { dueAt: "2026-08-01T00:00:00Z" } :
      key === "instructions" ? { instructions: "ins" } :
      { title: "T" };
    expect(() => validateUpdateAssignmentBody(payload)).not.toThrow();
  });

  it.each(["status", "publishedAt", "classroomId"])("rejette forbidden `%s`", (key) => {
    expect(() => validateUpdateAssignmentBody({ [key]: "x" })).toThrow(AssignmentError);
  });
});

describe("Submission body · writtenContent only", () => {
  it("accepts writtenContent", () => {
    expect(validateSubmissionBody({ writtenContent: "hello" })).toEqual({ writtenContent: "hello" });
  });

  it.each([
    "status", "version", "storageObjectId", "assignmentId", "userId", "submittedAt",
    "supersedesSubmissionId", "id",
  ])("rejette forbidden `%s`", (key) => {
    try {
      validateSubmissionBody({ writtenContent: "x", [key]: "leak" });
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(SubmissionError);
      expect((e as SubmissionError).detail).toMatchObject({ forbiddenKey: key });
    }
  });

  it("rejette writtenContent non-string", () => {
    expect(() => validateSubmissionBody({ writtenContent: 42 })).toThrow(SubmissionError);
  });

  it("ALLOWED_KEYS list = ['writtenContent']", () => {
    expect(SUBMISSION_ALLOWED_KEYS).toEqual(["writtenContent"]);
  });
});

describe("Feedback body · writtenContent only", () => {
  it("accepts writtenContent", () => {
    expect(validateFeedbackBody({ writtenContent: "bien" })).toEqual({ writtenContent: "bien" });
  });

  it.each([
    "status", "version", "storageObjectId", "submissionId", "authorId",
    "publishedAt", "supersedesFeedbackId", "authorTeacherId", "id",
  ])("rejette forbidden `%s`", (key) => {
    try {
      validateFeedbackBody({ writtenContent: "x", [key]: "leak" });
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(FeedbackError);
      expect((e as FeedbackError).detail).toMatchObject({ forbiddenKey: key });
    }
  });

  it("ALLOWED_KEYS list = ['writtenContent']", () => {
    expect(FEEDBACK_ALLOWED_KEYS).toEqual(["writtenContent"]);
  });
});

describe("Allowlist canonical lists", () => {
  it("ASSIGNMENT_CREATE_ALLOWED_KEYS contient 4 clés attendues", () => {
    expect([...ASSIGNMENT_CREATE_ALLOWED_KEYS].sort()).toEqual(
      ["dueAt", "instructions", "submissionFormat", "title"],
    );
  });

  it("ASSIGNMENT_UPDATE_ALLOWED_KEYS contient 3 clés (pas submissionFormat)", () => {
    expect([...ASSIGNMENT_UPDATE_ALLOWED_KEYS].sort()).toEqual(
      ["dueAt", "instructions", "title"],
    );
  });
});
