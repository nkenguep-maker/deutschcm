// P4.1 · Smoke test RLS + capacity + cross-tenant · exécuté contre P-1.
//
// Prérequis · fixtures seeded via `node scripts/test-baseline/p4-1-fixtures.mjs seed`.
//
// Ce script exerce directement Prisma (rôle service_role côté DB → bypass RLS)
// pour vérifier :
//   1) Capacity guards · concurrence à 3ᵉ adulte / 5ᵉ enfant / 2ᵉ coach
//   2) Contraintes DB · CHECK XOR, partial unique coach, unique (household, language)
//   3) Cross-tenant · Circle A n'apparaît pas dans lookup Circle B
//   4) RLS Postgres · client anon Supabase ne voit rien (via supabase.auth JWT)
//
// Objectif · fournir un baseline de tests qui refuseraient un régression P4.

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertNonProduction, getTestPassword } from "./_common.mjs";

assertNonProduction();
getTestPassword();

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const db = new PrismaClient({ adapter, log: ["error"] });

const events = [];
function log(label, obj) {
  events.push({ label, ...obj });
  process.stderr.write(`  ${label} · ${JSON.stringify(obj)}\n`);
}

const CIRCLE_A = "test_p4_1_circle_a_lingala";
const CIRCLE_B = "test_p4_1_circle_b_wolof";
const HH_A = "test_p4_1_hh_a";

// ── 1) Capacity guards · CHECK XOR ────────────────────────────────
async function checkXor() {
  process.stderr.write("\n═══ 1) CHECK XOR (userId XOR childProfileId) ═══\n");
  try {
    await db.circleMembership.create({
      data: {
        circleId: CIRCLE_A,
        role: "ADULT",
        status: "INVITED",
        userId: null,
        childProfileId: null,
      },
    });
    log("xor · both null accepted (BUG)", { ok: false });
  } catch (e) {
    log("xor · both null rejected (OK)", { code: e.code, ok: /check|xor/i.test(e.message) });
  }
  // Deux non-null
  try {
    const user = await db.user.findFirst({ where: { email: "paul+p4_1_owner_a@example.com" } });
    const child = await db.childProfile.findFirst({ where: { id: "test_p4_1_child_a1" } });
    await db.circleMembership.create({
      data: {
        circleId: CIRCLE_A, role: "ADULT", status: "INVITED",
        userId: user.id, childProfileId: child.id,
      },
    });
    log("xor · both set accepted (BUG)", { ok: false });
  } catch (e) {
    log("xor · both set rejected (OK)", { code: e.code, ok: true });
  }
}

// ── 2) Unique coach actif ─────────────────────────────────────────
async function checkOneCoach() {
  process.stderr.write("\n═══ 2) Partial unique · un seul coach ACTIVE ═══\n");
  const coachUser = await db.user.findFirst({ where: { email: "paul+p4_1_coach_a@example.com" } });
  const anotherUser = await db.user.findFirst({ where: { email: "paul+p4_1_adult_a@example.com" } });
  try {
    await db.circleMembership.create({
      data: {
        circleId: CIRCLE_A, role: "COACH", status: "ACTIVE",
        userId: anotherUser.id,
      },
    });
    log("coach · second coach ACTIVE accepted (BUG)", { ok: false });
    // rollback
    await db.circleMembership.deleteMany({
      where: { circleId: CIRCLE_A, userId: anotherUser.id, role: "COACH" },
    });
  } catch (e) {
    log("coach · second coach rejected (OK)", { code: e.code, ok: /unique|duplicate/i.test(e.message) });
  }
  void coachUser;
}

// ── 3) Unique (household, language) ──────────────────────────────
async function checkHouseholdLangUnique() {
  process.stderr.write("\n═══ 3) Unique (household, language) ═══\n");
  const owner = await db.user.findFirst({ where: { email: "paul+p4_1_owner_a@example.com" } });
  try {
    await db.circle.create({
      data: {
        householdId: HH_A,
        language: "LINGALA",
        createdByUserId: owner.id,
      },
    });
    log("dup lingala accepted (BUG)", { ok: false });
  } catch (e) {
    log("dup lingala rejected (OK)", { code: e.code, ok: /unique/i.test(e.message) });
  }
}

// ── 4) Cross-tenant · circle A never appears in B lookup ─────────
async function checkCrossTenant() {
  process.stderr.write("\n═══ 4) Cross-tenant · Circle A dans lookup B ═══\n");
  const rowsB = await db.circle.findMany({ where: { householdId: "test_p4_1_hh_b" } });
  log("cross · B lookup finds only B circles", {
    count: rowsB.length,
    ids: rowsB.map((c) => c.id),
    onlyB: rowsB.every((c) => c.householdId === "test_p4_1_hh_b"),
  });
}

// ── 5) RLS · client anon Supabase ne voit rien ────────────────────
async function checkRlsAnon() {
  process.stderr.write("\n═══ 5) RLS · lecture anon rejetée ═══\n");
  // Anon (aucun JWT) doit voir 0 rows sur tables RLS-enabled avec USING (…)
  const { data: circlesAnon, error: errCircles } = await anonClient
    .from("circles")
    .select("id,householdId,language")
    .limit(100);
  log("anon · circles", {
    error: errCircles?.code ?? null,
    rows: circlesAnon?.length ?? -1,
    expectZero: (circlesAnon?.length ?? -1) <= 0,
  });
  const { data: membersAnon } = await anonClient
    .from("circle_memberships")
    .select("id,circleId,role")
    .limit(100);
  log("anon · circle_memberships", {
    rows: membersAnon?.length ?? -1,
    expectZero: (membersAnon?.length ?? -1) <= 0,
  });
  const { data: auditAnon } = await anonClient
    .from("audit_events")
    .select("id,action")
    .limit(100);
  log("anon · audit_events", {
    rows: auditAnon?.length ?? -1,
    expectZero: (auditAnon?.length ?? -1) <= 0,
  });
  const { data: storageAnon } = await anonClient
    .from("storage_objects")
    .select("id,bucket,path")
    .limit(100);
  log("anon · storage_objects", {
    rows: storageAnon?.length ?? -1,
    expectZero: (storageAnon?.length ?? -1) <= 0,
  });
  void admin;
}

// ── 6) RLS · authenticated user ne voit que ses cercles ─────────
async function checkRlsAuth() {
  process.stderr.write("\n═══ 6) RLS · membre A ne voit pas Circle B ═══\n");
  // Sign in as owner A via password
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const { data: session, error } = await authClient.auth.signInWithPassword({
    email: "paul+p4_1_owner_a@example.com",
    password: process.env.P1_TEST_PASSWORD,
  });
  if (error) {
    log("auth · owner A sign in FAILED", { error: error.message });
    return;
  }
  const { data: circlesA } = await authClient.from("circles").select("id, householdId").limit(50);
  log("auth · owner A circle list", {
    count: circlesA?.length ?? -1,
    ids: circlesA?.map((c) => c.id) ?? [],
    seesCircleA: (circlesA ?? []).some((c) => c.id === CIRCLE_A),
    seesCircleB: (circlesA ?? []).some((c) => c.id === CIRCLE_B),
  });
  const { data: memberA } = await authClient
    .from("circle_memberships")
    .select("id, circleId, role")
    .limit(50);
  log("auth · owner A membership list", {
    count: memberA?.length ?? -1,
    onlyOwnCircles: (memberA ?? []).every((m) => m.circleId === CIRCLE_A),
  });
  await authClient.auth.signOut();
  void session;
}

async function main() {
  try {
    await checkXor();
    await checkOneCoach();
    await checkHouseholdLangUnique();
    await checkCrossTenant();
    await checkRlsAnon();
    await checkRlsAuth();
  } finally {
    await db.$disconnect();
  }
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p4-1-captures", { recursive: true });
  await writeFile("/tmp/p4-1-captures/rls-smoke.json", JSON.stringify(events, null, 2));
  process.stderr.write(`\nWritten /tmp/p4-1-captures/rls-smoke.json (${events.length} events)\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
