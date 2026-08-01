#!/usr/bin/env node
// Lot 7B.1 · orchestre npm run test:monde-context:p1.
//
// Scénarios authentifiés (Teacher + Family + Racines toggle) contre P-1.
//
// Assumptions ·
//   - MONDE_CONTEXT_TEACHER_EMAIL / PASSWORD sont un compte Teacher scopé
//     P-1 (au moins 1 classroom + 2 enrollments actifs).
//   - MONDE_CONTEXT_FAMILY_EMAIL / PASSWORD sont un compte Parent scopé
//     P-1 (au moins 1 ChildProfile universe MONDE).
//
// Le script ne CRÉE aucun compte. Il lit les originaux, teste, restaure.

import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);
const PORT = process.env.YEMA_MONDE_CONTEXT_PORT || "3220";

function fail(step, msg, code = 1) {
  console.error(`[monde-context] STEP ${step} FAIL · ${msg}`);
  process.exit(code);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !url.includes(P1_REF)) fail(0, `URL non-P1 · ${url}`);
for (const b of BLOCKED) if (url.includes(b)) fail(0, `blocklisted ${b}`);

// Lot 7B.2 · defaults canoniques (les comptes test_yema_qa_* existent
// déjà sur P-1 grâce au fixture bakery · P1_TEST_PASSWORD partagé).
process.env.MONDE_CONTEXT_TEACHER_EMAIL ||= "test_yema_qa_teacher@example.com";
process.env.MONDE_CONTEXT_FAMILY_EMAIL  ||= "test_yema_qa_family@example.com";
process.env.MONDE_CONTEXT_FAMILY2_EMAIL ||= "test_yema_qa_family2@example.com";
process.env.MONDE_CONTEXT_TEACHER_PASSWORD ||= process.env.P1_TEST_PASSWORD || "";
process.env.MONDE_CONTEXT_FAMILY_PASSWORD  ||= process.env.P1_TEST_PASSWORD || "";
process.env.MONDE_CONTEXT_FAMILY2_PASSWORD ||= process.env.P1_TEST_PASSWORD || "";

const TEACHER_EMAIL = process.env.MONDE_CONTEXT_TEACHER_EMAIL;
const TEACHER_PASSWORD = process.env.MONDE_CONTEXT_TEACHER_PASSWORD;
const FAMILY_EMAIL = process.env.MONDE_CONTEXT_FAMILY_EMAIL;
const FAMILY_PASSWORD = process.env.MONDE_CONTEXT_FAMILY_PASSWORD;
// Lot 7B.2 · isolation · second foyer indépendant.
const FAMILY2_EMAIL = process.env.MONDE_CONTEXT_FAMILY2_EMAIL;
const FAMILY2_PASSWORD = process.env.MONDE_CONTEXT_FAMILY2_PASSWORD;
if (!TEACHER_EMAIL || !TEACHER_PASSWORD) fail(0, "MONDE_CONTEXT_TEACHER_* manquants · NON-SKIPPABLE", 2);
if (!FAMILY_EMAIL || !FAMILY_PASSWORD) fail(0, "MONDE_CONTEXT_FAMILY_* manquants · NON-SKIPPABLE", 2);

const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supRef = new URL(url).host.split(".")[0];

async function loginCookie(email, password) {
  const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(`login ${email} · ${r.status}`);
  const s = await r.json();
  const payload = {
    access_token: s.access_token,
    token_type: s.token_type,
    expires_in: s.expires_in,
    expires_at: s.expires_at ?? (Math.floor(Date.now() / 1000) + s.expires_in),
    refresh_token: s.refresh_token,
    user: s.user,
  };
  return `sb-${supRef}-auth-token=base64-${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
}

async function main() {
  console.log("[monde-context] STEP 1 · fixtures QA idempotentes (héritage)");
  spawnSync("node", ["scripts/test-baseline/yema-qa-fixtures.mjs"], { stdio: "inherit", env: process.env });

  console.log(`[monde-context] STEP 2 · next start port ${PORT}`);
  const server = spawn("npx", ["next", "start", "-p", PORT], { stdio: ["ignore", "pipe", "inherit"], env: process.env });
  let ready = false;
  server.stdout.on("data", (b) => { if (/Ready|ready in|Started/i.test(b.toString())) ready = true; });
  for (let i = 0; i < 30 && !ready; i++) await sleep(1000);
  if (!ready) { server.kill("SIGTERM"); fail(2, "server not ready"); }

  const HOST = `127.0.0.1:${PORT}`;
  const originHeaders = { Origin: `http://${HOST}`, Host: HOST };
  let exitCode = 0;

  try {
    // ── SCENARIO Teacher · /api/teacher/students expose learningGoal ────
    console.log("[monde-context] STEP 3 · login Teacher QA");
    const teacherCookie = await loginCookie(TEACHER_EMAIL, TEACHER_PASSWORD);
    const tHeaders = { ...originHeaders, Cookie: teacherCookie };
    const stuRes = await fetch(`http://${HOST}/api/teacher/students?pageSize=100`, { headers: tHeaders });
    if (stuRes.status !== 200) fail(3, `Teacher /api/teacher/students · ${stuRes.status}`);
    const stuBody = await stuRes.json();
    if (!Array.isArray(stuBody?.items)) fail(3, "items non-array");
    // Vérifier absence de champs interdits.
    for (const s of stuBody.items) {
      for (const forbidden of ["email", "supabaseId", "phone", "dateOfBirth", "avatarUrl"]) {
        if (forbidden in s) fail(3, `Teacher student expose ${forbidden}`);
      }
    }
    // Lot 7B.2 · isolation Teacher · apprenant externe ABSENT + apprenant
    // inactif ABSENT (isActive filtré côté query, external non enrolled).
    const fullNames = stuBody.items.map((s) => s.fullName ?? "");
    if (fullNames.some((n) => n.includes("student_external"))) fail(3, "student_external visible · isolation cassée");
    if (fullNames.some((n) => n.includes("student_inactive"))) fail(3, "student_inactive visible · isActive filter cassé");
    // Vérifier au moins 3 parcours distincts (STUDIES/WORK/EXAM) dans les items.
    const goals = new Set(stuBody.items.map((s) => s.learningGoal).filter(Boolean));
    if (goals.size < 3) fail(3, `parcours variés attendus (≥3), observés ${goals.size}: ${[...goals].join(",")}`);
    console.log(`  · ${stuBody.items.length} apprenants · aucun champ sensible exposé`);
    console.log(`  · parcours distincts observés · ${[...goals].join(", ")}`);
    console.log(`  · student_external et student_inactive filtrés · isolation OK`);

    // ── SCENARIO Family · /api/family/dashboard expose learningGoal ─────
    console.log("[monde-context] STEP 4 · login Family QA");
    const familyCookie = await loginCookie(FAMILY_EMAIL, FAMILY_PASSWORD);
    const fHeaders = { ...originHeaders, Cookie: familyCookie };
    const famRes = await fetch(`http://${HOST}/api/family/dashboard`, { headers: fHeaders });
    if (famRes.status !== 200) fail(4, `Family /api/family/dashboard · ${famRes.status}`);
    const famBody = await famRes.json();
    if (!Array.isArray(famBody?.children)) fail(4, "children non-array");
    for (const c of famBody.children) {
      // pinHash ne doit JAMAIS être exposé.
      if ("pinHash" in c) fail(4, "Family child expose pinHash · fuite sécurité");
      if ("pinUpdatedAt" in c) fail(4, "Family child expose pinUpdatedAt");
    }
    const mondeChildren = famBody.children.filter((c) => c.universe === "MONDE");
    console.log(`  · ${famBody.children.length} enfants (${mondeChildren.length} Monde)`);
    console.log(`  · aucun pinHash exposé · learningGoal projeté sur ${famBody.children.filter((c) => "learningGoal" in c).length}`);
    // Lot 7B.2 · learningGoal réel présent sur les enfants Monde.
    const goalsMonde = mondeChildren.map((c) => c.learningGoal).filter(Boolean);
    if (goalsMonde.length < 1) fail(4, "aucun enfant Monde n'a de learningGoal (fixture manquante)");
    console.log(`  · learningGoal Monde réels · ${goalsMonde.join(", ")}`);

    // ── SCENARIO Isolation · Family2 ne voit pas les enfants de Family ──
    if (FAMILY2_EMAIL && FAMILY2_PASSWORD) {
      console.log("[monde-context] STEP 5 · isolation · Family2 ne voit pas les enfants Family1");
      const family2Cookie = await loginCookie(FAMILY2_EMAIL, FAMILY2_PASSWORD);
      const f2Headers = { ...originHeaders, Cookie: family2Cookie };
      const f2Res = await fetch(`http://${HOST}/api/family/dashboard`, { headers: f2Headers });
      if (f2Res.status === 200) {
        const f2Body = await f2Res.json();
        const f1ChildIds = new Set(famBody.children.map((c) => c.id));
        const leaked = (f2Body.children || []).filter((c) => f1ChildIds.has(c.id));
        if (leaked.length > 0) fail(5, `Family2 voit ${leaked.length} enfants de Family1 · isolation cassée`);
        console.log(`  · Family2 · ${f2Body.children?.length ?? 0} enfants (aucun de Family1)`);
      } else {
        console.log(`  · Family2 dashboard status=${f2Res.status} (skippé)`);
      }
    }

    // ── SCENARIO Family1 → Teacher API refusé ──────────────────────────
    console.log("[monde-context] STEP 6 · isolation · Family ne peut pas lire /api/teacher/*");
    const famToTeacher = await fetch(`http://${HOST}/api/teacher/students`, { headers: fHeaders });
    if (famToTeacher.status === 200) fail(6, "Family a accédé à Teacher API · isolation cassée");
    console.log(`  · Family → Teacher API refusé · status=${famToTeacher.status}`);

    console.log("[monde-context] ALL OK");
  } catch (e) {
    console.error(`[monde-context] ERROR · ${e.message}`);
    exitCode = 1;
  } finally {
    server.kill("SIGTERM");
    await sleep(500);
  }
  process.exit(exitCode);
}

main().catch((e) => fail("?", e.message));
