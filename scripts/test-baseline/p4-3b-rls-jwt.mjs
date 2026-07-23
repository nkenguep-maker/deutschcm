// P4.3b hardening · Tests RLS runtime avec JWT authenticated Supabase.
// Interroge directement les tables via PostgREST (client Supabase avec cookie
// auth) · chaque acteur voit ce que la policy autorise, rien de plus.
//
// Chaque persona login → obtient un JWT authenticated Supabase → interroge
// `from("teachers")`, `from("classrooms")`, `from("classroom_enrollments")`,
// `from("class_join_requests")`. La comparaison entre acteurs vérifie
// l'absence de leak cross-teacher/cross-center.

import { createClient } from "@supabase/supabase-js";
import { assertNonProduction, getTestPassword } from "./_common.mjs";

assertNonProduction();
const PW = getTestPassword();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const EMAILS = {
  teacherA:            "paul+p4_3b_teacher_a@example.com",
  teacherB:            "paul+p4_3b_teacher_b@example.com",
  teacherAmbig:        "paul+p4_3b_teacher_ambig@example.com",
  teacherZero:         "paul+p4_3b_teacher_zero@example.com",
  centerAdmin:         "paul+p4_3b_center_admin@example.com",
  studentA1:           "paul+p4_3b_student_a1@example.com",
  racinesCoach:        "paul+p4_3b_racines_coach@example.com",
  yemaAdminNoBinding:  "paul+p4_3b_yema_admin_no_bind@example.com",
  yemaAdminWithBinding:"paul+p4_3b_yema_admin_with_bind@example.com",
};

const CENTER_A = "test_p4_3b_center_a";
const CENTER_B = "test_p4_3b_center_b";
const CLASS_A1 = "test_p4_3b_class_a1";
const CLASS_A2 = "test_p4_3b_class_a2";
const CLASS_B1 = "test_p4_3b_class_b1";

async function login(email) {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password: PW });
  if (error) throw new Error(`login ${email} failed: ${error.message}`);
  return { client: c, session: data.session };
}

async function query(client, table, opts = {}) {
  let q = client.from(table).select(opts.select ?? "id, teacherId, centerId, userId, classroomId, fromUserId, toClassroomId", { count: "exact", head: false });
  if (opts.eq) for (const [k, v] of Object.entries(opts.eq)) q = q.eq(k, v);
  const { data, count, error } = await q.limit(200);
  return { data: data ?? [], count: count ?? 0, error: error?.message ?? null };
}

const results = [];
function log(label, obj) {
  results.push({ label, ...obj });
  process.stderr.write(`  ${label} · ${JSON.stringify(obj)}\n`);
}

async function main() {
  process.stderr.write("═══ P4.3b · RLS JWT runtime tests ═══\n\n");

  const personas = {};
  for (const [key, email] of Object.entries(EMAILS)) {
    try {
      personas[key] = await login(email);
      process.stderr.write(`  ✓ login ${key}\n`);
    } catch (e) {
      process.stderr.write(`  ✗ login ${key}: ${e.message}\n`);
    }
  }

  // ═══ teachers table ═══
  process.stderr.write("\n═══ teachers (RLS = teachers_select_self) ═══\n");
  for (const [key, actor] of Object.entries(personas)) {
    const r = await query(actor.client, "teachers", { select: "id, userId, centerId" });
    const targetB = r.data.filter((t) => t.centerId === CENTER_B).length;
    log(`teachers · ${key}`, {
      count: r.count, rowCount: r.data.length,
      centerB_visible: targetB,
      err: r.error,
    });
  }

  // ═══ classrooms table ═══
  process.stderr.write("\n═══ classrooms (RLS = classrooms_select_teacher_scope) ═══\n");
  for (const [key, actor] of Object.entries(personas)) {
    const r = await query(actor.client, "classrooms", { select: "id, teacherId, centerId" });
    const visibleTestOnly = r.data.filter((c) => c.id?.startsWith("test_p4_3b_"));
    const classBVisible = visibleTestOnly.some((c) => c.id === CLASS_B1);
    const classA1Visible = visibleTestOnly.some((c) => c.id === CLASS_A1);
    const classA2Visible = visibleTestOnly.some((c) => c.id === CLASS_A2);
    log(`classrooms · ${key}`, {
      test_p4_3b_visible: visibleTestOnly.length,
      A1_visible: classA1Visible, A2_visible: classA2Visible, B1_visible: classBVisible,
      err: r.error,
    });
  }

  // ═══ classroom_enrollments table ═══
  process.stderr.write("\n═══ classroom_enrollments (RLS = enrollments_select_owner_or_teacher) ═══\n");
  for (const [key, actor] of Object.entries(personas)) {
    const r = await query(actor.client, "classroom_enrollments", { select: "id, classroomId, userId, isActive" });
    const testOnly = r.data.filter((e) => e.classroomId?.startsWith("test_p4_3b_"));
    const enrollA = testOnly.filter((e) => e.classroomId === CLASS_A1 || e.classroomId === CLASS_A2).length;
    const enrollB = testOnly.filter((e) => e.classroomId === CLASS_B1).length;
    log(`enrollments · ${key}`, {
      test_p4_3b_visible: testOnly.length,
      A_visible: enrollA, B_visible: enrollB,
      err: r.error,
    });
  }

  // ═══ class_join_requests table ═══
  process.stderr.write("\n═══ class_join_requests (RLS = class_join_requests_select_scope) ═══\n");
  for (const [key, actor] of Object.entries(personas)) {
    const r = await query(actor.client, "class_join_requests", { select: "id, fromUserId, toClassroomId" });
    const testOnly = r.data.filter((x) => x.toClassroomId?.startsWith("test_p4_3b_"));
    log(`join_requests · ${key}`, {
      test_p4_3b_visible: testOnly.length,
      err: r.error,
    });
  }

  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p4-3b-captures", { recursive: true });
  await writeFile("/tmp/p4-3b-captures/rls-jwt.json", JSON.stringify(results, null, 2));
  process.stderr.write(`\nWritten /tmp/p4-3b-captures/rls-jwt.json (${results.length} events)\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
