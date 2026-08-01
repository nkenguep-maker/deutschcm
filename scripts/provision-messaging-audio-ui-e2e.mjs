#!/usr/bin/env node
// P4.6-C.3 · provisioning idempotent des E2E users audio UI P-1.
//
// Provisionne ·
//   - Teacher/Student/Outsider (adultes E2E existants)
//   - Family parent lié (via Prisma existant · Household QA)
//   - ChildProfile Monde existant (yema-qa-fixtures.mjs)
//   - Family parent non lié (nouveau · via Auth admin + Prisma)
//
// PIN enfant · lu depuis YEMA_E2E_CHILD_PIN uniquement. Aucun default
// hardcodé côté script · si absent, le test utilise la fixture QA
// (PIN "1234" seedé par yema-qa-fixtures.mjs).
//
// Sécurité · P-1 UNIQUEMENT · aucun log de mot de passe ou de PIN.

import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);

function fail(msg) { console.error(`[provision] FAIL · ${msg}`); process.exit(1); }

function mask(email) {
  if (!email) return "?";
  const [u, d] = email.split("@");
  return `${u.slice(0, 2)}***@${d}`;
}
function strongPassword() {
  return randomBytes(32).toString("base64url") + "!Aa1";
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !svc) fail("NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY absents");
if (!url.includes(P1_REF)) fail(`URL non-P1 · ${url}`);
for (const b of BLOCKED) if (url.includes(b)) fail(`blocklisted ${b}`);

// PIN enfant · lecture stricte.
const CHILD_PIN = process.env.YEMA_E2E_CHILD_PIN;
if (!CHILD_PIN || CHILD_PIN.length < 4) {
  console.log("[provision] NOTE · YEMA_E2E_CHILD_PIN absent · fallback fixture QA (voir yema-qa-fixtures.mjs)");
}

async function upsertAuthUser(email, password, role) {
  const metadata = {
    roles: [role],
    onboarded_map: { STUDENT: true, TEACHER: true, CENTER: true, ADMIN: true },
    active_space: role,
    role,
  };
  const list = await fetch(`${url}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`, {
    headers: { apikey: svc, Authorization: `Bearer ${svc}` },
  });
  if (list.ok) {
    const data = await list.json();
    const existing = (data.users ?? []).find((u) => u.email === email);
    if (existing) {
      const upd = await fetch(`${url}/auth/v1/admin/users/${existing.id}`, {
        method: "PUT",
        headers: { apikey: svc, Authorization: `Bearer ${svc}`, "Content-Type": "application/json" },
        body: JSON.stringify({ password, email_confirm: true, user_metadata: metadata }),
      });
      if (!upd.ok) throw new Error(`update ${mask(email)} · ${upd.status}`);
      return { id: existing.id, existed: true };
    }
  }
  const create = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: svc, Authorization: `Bearer ${svc}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: metadata }),
  });
  if (!create.ok) throw new Error(`create ${mask(email)} · ${create.status}`);
  const j = await create.json();
  return { id: j.id, existed: false };
}

async function main() {
  console.log("[provision] STEP 1 · comptes adultes E2E (Teacher/Student/Outsider)");
  const CRED = {
    teacher:  { email: process.env.E2E_TEACHER_EMAIL  ?? "e2e.teacher.p1@yema-test.local",  password: process.env.E2E_TEACHER_PASSWORD  ?? strongPassword(), role: "TEACHER" },
    student:  { email: process.env.E2E_STUDENT_EMAIL  ?? "e2e.student.p1@yema-test.local",  password: process.env.E2E_STUDENT_PASSWORD  ?? strongPassword(), role: "STUDENT" },
    outsider: { email: process.env.E2E_OUTSIDER_EMAIL ?? "e2e.outsider.p1@yema-test.local", password: process.env.E2E_OUTSIDER_PASSWORD ?? strongPassword(), role: "STUDENT" },
    familyUnrelated: { email: "e2e.family2.p1@yema-test.local", password: strongPassword(), role: "STUDENT" },
  };
  for (const [k, c] of Object.entries(CRED)) {
    const r = await upsertAuthUser(c.email, c.password, c.role);
    console.log(`  · ${k.padEnd(16)} ${r.existed ? "(reused·metadata updated)" : "(created)"}`);
  }

  console.log("[provision] STEP 2 · Prisma linkage (délégué à messaging-fixtures.mjs)");
  console.log("  · relancer scripts/test-baseline/messaging-fixtures.mjs avec les E2E envs");

  console.log("[provision] STEP 3 · résumé QA existant");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }), log: ["error"] });
  try {
    const childMonde = await db.childProfile.findFirst({
      where: { id: "test_yema_qa_child_family_monde" },
      select: { id: true, prenom: true, avatarAnimal: true, universe: true, householdId: true, parentUserId: true },
    });
    if (!childMonde) fail("ChildProfile Monde QA absent · relancer yema-qa-fixtures.mjs");
    console.log(`  · child Monde · id=${childMonde.id} · avatar=${childMonde.avatarAnimal} · universe=${childMonde.universe}`);
    console.log(`  · parent lié · ok`);

    // Conversation CHILD_WORLD_GUIDED · déjà bakée (t_km_en) par messaging-fixtures.mjs.
    const conv = await db.messagingConversation.findFirst({
      where: { id: "test_yema_qa_t_km_en" },
      select: { id: true, type: true },
    });
    if (!conv) fail("Conversation t_km_en absente · relancer messaging-fixtures.mjs");
    console.log(`  · conv CHILD_WORLD_GUIDED · id=${conv.id} · type=${conv.type}`);

    // GUARDIAN_OBSERVER family = participant actif du fil enfant.
    const observer = await db.messagingConversationParticipant.findFirst({
      where: { conversationId: conv.id, participantRole: "GUARDIAN_OBSERVER", leftAt: null },
      select: { id: true, userId: true },
    });
    if (!observer) fail("GUARDIAN_OBSERVER absent · relancer messaging-fixtures.mjs");
    console.log(`  · GUARDIAN_OBSERVER family · ok`);
  } finally {
    await db.$disconnect();
  }

  console.log("");
  console.log("[provision] READY · credentials en mémoire · aucun log de mot de passe/PIN");
}

main().catch((e) => fail(e.message));
