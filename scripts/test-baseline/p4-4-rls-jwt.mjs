// P4.4 · Test JWT/RLS · barrière ChildProfile + fonction projection.
//
// 1. Avec JWT authenticated Coach A · `SELECT * FROM child_profiles` = 0 rows
//    (policy `child_profiles_service_only` posée en 20260719).
// 2. Avec JWT Coach A · `SELECT * FROM get_roots_coach_assigned_profiles()`
//    = A1 + A2 uniquement · colonnes minimales (id, display_name,
//    avatar_animal, age_band, active_langue, circle_id, circle_language,
//    joined_at).
// 3. Cross-coach · Coach B → uniquement B1.
// 4. Coach retiré, Career, Teacher, Center, Student, Admin sans membership
//    → 0 lignes de projection.

import { createClient } from "@supabase/supabase-js";
import { assertNonProduction, getTestPassword } from "./_common.mjs";

assertNonProduction();
const PW = getTestPassword();
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const EMAILS = {
  coachA:              "paul+p4_4_coach_a@example.com",
  coachB:              "paul+p4_4_coach_b@example.com",
  coachRemoved:        "paul+p4_4_coach_removed@example.com",
  careerCoach:         "paul+p4_4_career_coach@example.com",
  yemaAdminNoBinding:  "paul+p4_4_admin_no_bind@example.com",
  teacher:             "paul+p4_4_teacher_hostile@example.com",
  centerAdmin:         "paul+p4_4_center_admin_hostile@example.com",
  student:             "paul+p4_4_student_hostile@example.com",
};

async function login(email) {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password: PW });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return c;
}

const results = [];
function log(label, obj) {
  results.push({ label, ...obj });
  process.stderr.write(`  ${label} · ${JSON.stringify(obj)}\n`);
}

async function main() {
  process.stderr.write("═══ P4.4 · JWT/RLS test ═══\n\n");
  const clients = {};
  for (const [k, email] of Object.entries(EMAILS)) {
    try { clients[k] = await login(email); process.stderr.write(`  ✓ login ${k}\n`); }
    catch (e) { process.stderr.write(`  ✗ login ${k}: ${e.message}\n`); }
  }

  // ═══ 1. SELECT direct child_profiles ═══
  process.stderr.write("\n─── direct SELECT public.child_profiles (attendu 0 rows partout) ───\n");
  for (const [k, c] of Object.entries(clients)) {
    const r = await c.from("child_profiles").select("id, prenom, age", { count: "exact", head: false }).limit(10);
    log(`child_profiles · ${k}`, {
      count: r.count, rows: r.data?.length ?? 0, err: r.error?.message,
    });
  }

  // ═══ 2. get_roots_coach_assigned_profiles() via RPC ═══
  process.stderr.write("\n─── RPC get_roots_coach_assigned_profiles ───\n");
  for (const [k, c] of Object.entries(clients)) {
    const r = await c.rpc("get_roots_coach_assigned_profiles");
    const cols = (r.data ?? [])[0] ? Object.keys((r.data ?? [])[0]).sort() : [];
    log(`projection · ${k}`, {
      rows: r.data?.length ?? 0,
      ids: (r.data ?? []).map(p => p.id).sort(),
      firstItemColumns: cols,
      err: r.error?.message,
    });
  }

  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p4-4-captures", { recursive: true });
  await writeFile("/tmp/p4-4-captures/rls-jwt.json", JSON.stringify(results, null, 2));
  process.stderr.write(`\nWritten /tmp/p4-4-captures/rls-jwt.json (${results.length} events)\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
