// P4.5-B2a · validation des bodies API Monde · allowlist stricte + rejet
// des clés inconnues. Aucun `status`, `version`, `publishedAt`,
// `classroomId`, `assignmentId`, `submissionId`, `feedbackId`, `userId`,
// `authorId`, `teacherId`, `storageObjectId`, `supersedesFeedbackId`,
// `supersedesSubmissionId`, `submittedAt`, `withdrawnAt` etc. n'est
// accepté depuis le body (§5 brief). Les IDs de ressources proviennent
// uniquement du path canonique.

import { AssignmentError, SubmissionError, FeedbackError } from "@/lib/assignments/errors";

// ── helpers génériques ─────────────────────────────────────────────────

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function pickKeys<T extends string>(
  body: unknown,
  allowedKeys: readonly T[],
  onUnknownKey: (key: string) => never,
): Partial<Record<T, unknown>> {
  if (!isRecord(body)) return {};
  const allowed = new Set<string>(allowedKeys);
  const out: Partial<Record<T, unknown>> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!allowed.has(k)) onUnknownKey(k);
    (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

// ── Assignment · create/update DRAFT (§5.1) ────────────────────────────

export const ASSIGNMENT_CREATE_ALLOWED_KEYS = [
  "title",
  "instructions",
  "dueAt",
  "submissionFormat",
] as const;

export const ASSIGNMENT_UPDATE_ALLOWED_KEYS = [
  "title",
  "instructions",
  "dueAt",
] as const;

const ASSIGNMENT_FORBIDDEN_KEYS = new Set([
  "status", "version", "publishedAt", "closedAt", "archivedAt",
  "classroomId", "teacherId", "createdBy", "createdByTeacherId",
  "createdAt", "updatedAt", "id",
]);

export interface CreateAssignmentBody {
  title: string;
  instructions?: string | null;
  dueAt?: Date | null;
  productionType: "WRITTEN"; // B2 texte uniquement
}

export function validateCreateAssignmentBody(body: unknown): CreateAssignmentBody {
  const picked = pickKeys(body, ASSIGNMENT_CREATE_ALLOWED_KEYS, (k) => {
    if (ASSIGNMENT_FORBIDDEN_KEYS.has(k)) {
      throw new AssignmentError(
        "assignment_invalid_transition",
        `forbidden body field: ${k}`,
        { forbiddenKey: k },
      );
    }
    throw new AssignmentError(
      "assignment_invalid_transition",
      `unknown body field: ${k}`,
      { unknownKey: k },
    );
  });
  const title = typeof picked.title === "string" ? picked.title.trim() : "";
  if (!title || title.length > 200) {
    throw new AssignmentError(
      "assignment_invalid_transition",
      "title required (1..200 chars)",
    );
  }
  const instructions =
    typeof picked.instructions === "string"
      ? picked.instructions.slice(0, 5000)
      : null;
  const dueAt =
    typeof picked.dueAt === "string" && picked.dueAt.length > 0
      ? new Date(picked.dueAt)
      : null;
  if (dueAt !== null && Number.isNaN(dueAt.getTime())) {
    throw new AssignmentError(
      "assignment_invalid_transition",
      "dueAt must be a valid ISO date",
    );
  }
  if (picked.submissionFormat !== undefined && picked.submissionFormat !== "WRITTEN") {
    throw new AssignmentError(
      "audio_feedback_disabled",
      "only WRITTEN production type accepted in P4.5-B",
      { submissionFormat: picked.submissionFormat },
    );
  }
  return { title, instructions, dueAt, productionType: "WRITTEN" };
}

export interface UpdateAssignmentBody {
  title?: string;
  instructions?: string | null;
  dueAt?: Date | null;
}

export function validateUpdateAssignmentBody(body: unknown): UpdateAssignmentBody {
  const picked = pickKeys(body, ASSIGNMENT_UPDATE_ALLOWED_KEYS, (k) => {
    if (ASSIGNMENT_FORBIDDEN_KEYS.has(k)) {
      throw new AssignmentError(
        "assignment_invalid_transition",
        `forbidden body field: ${k}`,
        { forbiddenKey: k },
      );
    }
    throw new AssignmentError(
      "assignment_invalid_transition",
      `unknown body field: ${k}`,
      { unknownKey: k },
    );
  });
  const out: UpdateAssignmentBody = {};
  if (picked.title !== undefined) {
    if (typeof picked.title !== "string") {
      throw new AssignmentError("assignment_invalid_transition", "title must be string");
    }
    const t = picked.title.trim();
    if (!t || t.length > 200) {
      throw new AssignmentError(
        "assignment_invalid_transition",
        "title must be 1..200 chars",
      );
    }
    out.title = t;
  }
  if (picked.instructions !== undefined) {
    if (picked.instructions !== null && typeof picked.instructions !== "string") {
      throw new AssignmentError(
        "assignment_invalid_transition",
        "instructions must be string or null",
      );
    }
    out.instructions =
      typeof picked.instructions === "string"
        ? picked.instructions.slice(0, 5000)
        : null;
  }
  if (picked.dueAt !== undefined) {
    if (picked.dueAt === null) out.dueAt = null;
    else if (typeof picked.dueAt === "string") {
      const d = new Date(picked.dueAt);
      if (Number.isNaN(d.getTime())) {
        throw new AssignmentError(
          "assignment_invalid_transition",
          "dueAt must be a valid ISO date",
        );
      }
      out.dueAt = d;
    } else {
      throw new AssignmentError(
        "assignment_invalid_transition",
        "dueAt must be ISO string or null",
      );
    }
  }
  return out;
}

// ── Submission · create/update DRAFT · texte uniquement (§5.2) ────────

export const SUBMISSION_ALLOWED_KEYS = ["writtenContent"] as const;

const SUBMISSION_FORBIDDEN_KEYS = new Set([
  "status", "version", "storageObjectId", "assignmentId", "userId",
  "submittedAt", "withdrawnAt", "supersedesSubmissionId",
  "createdAt", "updatedAt", "id",
]);

export interface SubmissionContentBody {
  writtenContent: string;
}

export function validateSubmissionBody(body: unknown): SubmissionContentBody {
  const picked = pickKeys(body, SUBMISSION_ALLOWED_KEYS, (k) => {
    if (SUBMISSION_FORBIDDEN_KEYS.has(k)) {
      throw new SubmissionError(
        "submission_invalid_transition",
        `forbidden body field: ${k}`,
        { forbiddenKey: k },
      );
    }
    throw new SubmissionError(
      "submission_invalid_transition",
      `unknown body field: ${k}`,
      { unknownKey: k },
    );
  });
  if (typeof picked.writtenContent !== "string") {
    throw new SubmissionError(
      "submission_content_required",
      "writtenContent must be a string",
    );
  }
  return { writtenContent: picked.writtenContent };
}

// ── Feedback · create/update DRAFT · texte uniquement (§5.3) ──────────

export const FEEDBACK_ALLOWED_KEYS = ["writtenContent"] as const;

const FEEDBACK_FORBIDDEN_KEYS = new Set([
  "status", "version", "storageObjectId", "submissionId", "authorId",
  "authorTeacherId", "publishedAt", "supersedesFeedbackId",
  "createdAt", "updatedAt", "id",
]);

export interface FeedbackContentBody {
  writtenContent: string;
}

export function validateFeedbackBody(body: unknown): FeedbackContentBody {
  const picked = pickKeys(body, FEEDBACK_ALLOWED_KEYS, (k) => {
    if (FEEDBACK_FORBIDDEN_KEYS.has(k)) {
      throw new FeedbackError(
        "feedback_invalid_transition",
        `forbidden body field: ${k}`,
        { forbiddenKey: k },
      );
    }
    throw new FeedbackError(
      "feedback_invalid_transition",
      `unknown body field: ${k}`,
      { unknownKey: k },
    );
  });
  if (typeof picked.writtenContent !== "string") {
    throw new FeedbackError(
      "feedback_addendum_required",
      "writtenContent must be a string",
    );
  }
  return { writtenContent: picked.writtenContent };
}
