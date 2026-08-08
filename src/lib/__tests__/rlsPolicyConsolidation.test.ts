import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const migration = readFileSync(
  resolve(
    REPO,
    "prisma/migrations/20260808095727_p4_5_select_policy_consolidation/migration.sql",
  ),
  "utf8",
);

const pairs = [
  ["p4_5_assignments_select_teacher", "p4_5_assignments_select_student_published", "p4_5_assignments_select_authorized"],
  ["p4_5_assignment_submissions_select_teacher", "p4_5_assignment_submissions_select_student_own", "p4_5_assignment_submissions_select_authorized"],
  ["p4_5_assignment_feedbacks_select_teacher_author", "p4_5_assignment_feedbacks_select_student_own_published", "p4_5_assignment_feedbacks_select_authorized"],
  ["p4_5_circle_assignments_select_coach", "p4_5_circle_assignments_select_parent_published", "p4_5_circle_assignments_select_authorized"],
  ["p4_5_circle_assignment_targets_select_coach", "p4_5_circle_assignment_targets_select_parent", "p4_5_circle_assignment_targets_select_authorized"],
  ["p4_5_circle_feedbacks_select_coach_author", "p4_5_circle_feedbacks_select_parent_published", "p4_5_circle_feedbacks_select_authorized"],
] as const;

describe("P4.5 · permissive SELECT policy consolidation", () => {
  it("drops both legacy permissive policies before creating one authorized policy", () => {
    for (const [first, second, combined] of pairs) {
      expect(migration).toContain(`DROP POLICY IF EXISTS "${first}"`);
      expect(migration).toContain(`DROP POLICY IF EXISTS "${second}"`);
      expect(migration).toContain(`CREATE POLICY "${combined}"`);
    }
  });

  it("keeps the same actor predicates joined only by OR", () => {
    expect(migration).toContain("private.is_teacher_for_assignment(id, private.current_app_user_id())");
    expect(migration).toContain("private.is_student_for_assignment(id, private.current_app_user_id())");
    expect(migration).toContain('"userId" = private.current_app_user_id()');
    expect(migration).toContain("private.is_active_circle_coach(\"circleId\", private.current_app_user_id())");
    expect(migration).toContain("private.is_child_parent(\"childProfileId\", private.current_app_user_id())");
    expect(migration).toContain('"authorCoachUserId" = private.current_app_user_id()');
    expect(migration).toContain("private.can_view_circle_submission(\"submissionId\", private.current_app_user_id())");
    expect(migration.match(/\n\s+OR /g)?.length).toBeGreaterThanOrEqual(6);
  });

  it("preserves published-only restrictions for student and parent branches", () => {
    expect(migration.match(/status = 'PUBLISHED'/g)?.length).toBe(3);
    expect(migration).toContain("FOR SELECT TO authenticated");
  });
});
