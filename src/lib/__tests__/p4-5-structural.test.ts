// P4.5-A · verrous structurels sur les fondations · enums, flags, codes
// stables, migrations SQL, absence de leak Prisma.

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ConcurrentUpdateError } from "../db/retry";
import { P4_5_STABLE_ERROR_CODES } from "../assignments/errors";
import {
  isAssignmentsActive,
  isAudioFeedbackActive,
} from "../flags";

const REPO = join(__dirname, "..", "..", "..");
function read(rel: string): string {
  return readFileSync(join(REPO, rel), "utf-8");
}

describe("P4.5-A · migrations SQL présentes et additives", () => {
  const monde = "prisma/migrations/20260723000009_p4_5_assignments_submissions/migration.sql";
  const racines = "prisma/migrations/20260723000010_p4_5_racines_productions_rls/migration.sql";

  it("both migrations exist", () => {
    expect(existsSync(join(REPO, monde))).toBe(true);
    expect(existsSync(join(REPO, racines))).toBe(true);
  });

  it("Monde migration is additive · adds columns without dropping any", () => {
    const sql = read(monde);
    expect(sql).toMatch(/ALTER TABLE "assignments"\s+ADD COLUMN/);
    expect(sql).toMatch(/ALTER TABLE "assignment_submissions"\s+ADD COLUMN/);
    expect(sql).toMatch(/CREATE TABLE "assignment_feedbacks"/);
    expect(sql).not.toMatch(/DROP TABLE|DROP COLUMN|TRUNCATE/i);
    // Enums P4.5.
    expect(sql).toMatch(/CREATE TYPE "AssignmentType"/);
    expect(sql).toMatch(/CREATE TYPE "AssignmentStatus"/);
    expect(sql).toMatch(/CREATE TYPE "SubmissionStatus"/);
    expect(sql).toMatch(/CREATE TYPE "FeedbackStatus"/);
    // AuditAction additifs.
    expect(sql).toMatch(/ALTER TYPE "AuditAction" ADD VALUE 'ASSIGNMENT_CREATED'/);
    expect(sql).toMatch(/ALTER TYPE "AuditAction" ADD VALUE 'SUBMISSION_SUBMITTED'/);
    expect(sql).toMatch(/ALTER TYPE "AuditAction" ADD VALUE 'FEEDBACK_PUBLISHED'/);
    expect(sql).toMatch(/ALTER TYPE "AuditAction" ADD VALUE 'STORAGE_UPLOAD_DENIED'/);
  });

  it("Racines migration creates 5 new tables + immutability triggers", () => {
    const sql = read(racines);
    expect(sql).toMatch(/CREATE TABLE "circle_assignments"/);
    expect(sql).toMatch(/CREATE TABLE "circle_assignment_targets"/);
    expect(sql).toMatch(/CREATE TABLE "circle_submissions"/);
    expect(sql).toMatch(/CREATE TABLE "circle_feedbacks"/);
    expect(sql).toMatch(/CREATE TABLE "circle_submission_replies"/);
    // Triggers immutabilité.
    expect(sql).toMatch(/FUNCTION "p4_5_enforce_feedback_immutability"/);
    expect(sql).toMatch(/FUNCTION "p4_5_enforce_submission_immutability"/);
    expect(sql).toMatch(/circle_feedbacks_immutable_publish/);
    expect(sql).toMatch(/circle_submissions_immutable_submit/);
    expect(sql).toMatch(/assignment_feedbacks_immutable_publish/);
    expect(sql).toMatch(/assignment_submissions_immutable_submit/);
    // Contrainte body length 1000 chars.
    expect(sql).toMatch(/circle_submission_replies_body_length_chk/);
    // RLS activée sur toutes les nouvelles tables.
    expect(sql).toMatch(/ALTER TABLE "circle_assignments" ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/ALTER TABLE "circle_submissions" ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/ALTER TABLE "circle_feedbacks" ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/ALTER TABLE "assignment_feedbacks" ENABLE ROW LEVEL SECURITY/);
    // AuditAction additifs Racines.
    expect(sql).toMatch(/CIRCLE_ASSIGNMENT_CREATED/);
    expect(sql).toMatch(/CIRCLE_SUBMISSION_SUBMITTED/);
    expect(sql).toMatch(/CIRCLE_FEEDBACK_PUBLISHED/);
    expect(sql).toMatch(/PRODUCTION_LIMIT_REACHED/);
    expect(sql).toMatch(/PARENT_REPLY_CREATED/);
    // Aucun DROP.
    expect(sql).not.toMatch(/DROP TABLE|DROP COLUMN|TRUNCATE/i);
  });

  it("triggers use SECURITY DEFINER + search_path pin (P4 doctrine)", () => {
    const sql = read("prisma/migrations/20260723000010_p4_5_racines_productions_rls/migration.sql");
    expect(sql).toMatch(/SECURITY DEFINER\s+SET search_path = public, pg_temp/);
  });
});

describe("P4.5-A · schema Prisma miroir", () => {
  const schema = read("prisma/schema.prisma");

  it("declares Racines models + enums", () => {
    expect(schema).toMatch(/^model CircleAssignment /m);
    expect(schema).toMatch(/^model CircleAssignmentTarget /m);
    expect(schema).toMatch(/^model CircleSubmission /m);
    expect(schema).toMatch(/^model CircleFeedback /m);
    expect(schema).toMatch(/^model CircleSubmissionReply /m);
    expect(schema).toMatch(/^enum CircleAssignmentType /m);
    expect(schema).toMatch(/^enum CircleAssignmentStatus /m);
    expect(schema).toMatch(/^enum CircleSubmissionStatus /m);
    expect(schema).toMatch(/^enum CircleFeedbackStatus /m);
    expect(schema).toMatch(/^enum CircleSubmissionReplyRole /m);
  });

  it("extends Monde Assignment/AssignmentSubmission with P4.5 columns", () => {
    expect(schema).toMatch(/model Assignment \{[\s\S]*status\s+AssignmentStatus/);
    expect(schema).toMatch(/model AssignmentSubmission \{[\s\S]*status\s+SubmissionStatus/);
    expect(schema).toMatch(/model AssignmentSubmission \{[\s\S]*storageObjectId/);
    expect(schema).toMatch(/^model AssignmentFeedback /m);
  });

  it("adds AuditAction P4.5 enum values", () => {
    for (const v of [
      "ASSIGNMENT_CREATED", "ASSIGNMENT_PUBLISHED", "ASSIGNMENT_CLOSED",
      "SUBMISSION_CREATED", "SUBMISSION_SUBMITTED", "SUBMISSION_WITHDRAWN",
      "FEEDBACK_DRAFTED", "FEEDBACK_PUBLISHED", "FEEDBACK_ADDENDUM_CREATED",
      "CIRCLE_ASSIGNMENT_CREATED", "CIRCLE_SUBMISSION_SUBMITTED",
      "CIRCLE_FEEDBACK_PUBLISHED", "PRODUCTION_LIMIT_REACHED",
      "PARENT_REPLY_CREATED", "STORAGE_UPLOAD_DENIED",
    ]) {
      expect(schema).toMatch(new RegExp(`^  ${v}$`, "m"));
    }
  });
});

describe("P4.5-A · flags", () => {
  it("isAssignmentsActive reads ASSIGNMENTS_ENABLED", () => {
    const prev = process.env.YEMA_ASSIGNMENTS_ENABLED;
    process.env.YEMA_ASSIGNMENTS_ENABLED = "true";
    expect(isAssignmentsActive()).toBe(true);
    process.env.YEMA_ASSIGNMENTS_ENABLED = "false";
    expect(isAssignmentsActive()).toBe(false);
    if (prev === undefined) delete process.env.YEMA_ASSIGNMENTS_ENABLED;
    else process.env.YEMA_ASSIGNMENTS_ENABLED = prev;
  });

  it("isAudioFeedbackActive requires both flags", () => {
    const prevA = process.env.YEMA_ASSIGNMENTS_ENABLED;
    const prevB = process.env.YEMA_AUDIO_FEEDBACK_ENABLED;
    process.env.YEMA_ASSIGNMENTS_ENABLED = "false";
    process.env.YEMA_AUDIO_FEEDBACK_ENABLED = "true";
    expect(isAudioFeedbackActive()).toBe(false);
    process.env.YEMA_ASSIGNMENTS_ENABLED = "true";
    process.env.YEMA_AUDIO_FEEDBACK_ENABLED = "false";
    expect(isAudioFeedbackActive()).toBe(false);
    process.env.YEMA_ASSIGNMENTS_ENABLED = "true";
    process.env.YEMA_AUDIO_FEEDBACK_ENABLED = "true";
    expect(isAudioFeedbackActive()).toBe(true);
    if (prevA === undefined) delete process.env.YEMA_ASSIGNMENTS_ENABLED;
    else process.env.YEMA_ASSIGNMENTS_ENABLED = prevA;
    if (prevB === undefined) delete process.env.YEMA_AUDIO_FEEDBACK_ENABLED;
    else process.env.YEMA_AUDIO_FEEDBACK_ENABLED = prevB;
  });
});

describe("P4.5-A · codes d'erreur stables (§17)", () => {
  it("stable codes list is complete (30 codes minimum)", () => {
    expect(P4_5_STABLE_ERROR_CODES.length).toBeGreaterThanOrEqual(30);
  });

  it("stable codes contain all §17 required codes", () => {
    const required = [
      "assignment_not_found", "assignment_not_owned", "assignment_not_published", "assignment_closed",
      "submission_not_found", "submission_already_submitted", "submission_content_required",
      "feedback_not_found", "feedback_already_published", "feedback_immutable", "feedback_addendum_required",
      "roots_weekly_production_limit_reached", "roots_monthly_production_limit_reached",
      "written_production_too_long", "audio_production_too_long",
      "storage_object_not_owned", "storage_object_invalid",
      "student_not_enrolled", "child_not_in_circle", "parent_not_authorized",
      "teacher_access_required", "roots_coach_access_required",
      "concurrent_assignment_update", "concurrent_submission_update",
    ];
    for (const code of required) {
      expect(P4_5_STABLE_ERROR_CODES).toContain(code);
    }
  });

  it("ConcurrentUpdateError accepts the two new P4.5 codes", () => {
    for (const code of ["concurrent_assignment_update", "concurrent_submission_update"] as const) {
      const e = new ConcurrentUpdateError(code, "msg");
      expect(e.code).toBe(code);
      // Aucun leak Prisma dans le message par défaut.
      expect(e.message).not.toMatch(/P2034|TransactionWriteConflict|40001/);
    }
  });
});
