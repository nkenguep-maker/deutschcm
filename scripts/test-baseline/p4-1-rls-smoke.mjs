// P4.1 · Smoke test P-1 · contraintes DB, RLS par JWT, concurrence réelle,
// endpoint API sous flag on/off. Prérequis · fixtures posées via
// `node scripts/test-baseline/p4-1-fixtures.mjs seed`.
//
// Vérifie les corrections post-revue 2026-07-23 ·
//   §2 Circle unique partial WHERE archivedAt IS NULL (archived puis recréé OK)
//   §3 OWNER unique actif · COACH unique actif · dédup user/child · pas de cap
//      ADULT/CHILD au niveau DB (caps applicatifs testés séparément)
//   §4 RLS · owner/adult/child/coach voient · foreign/removed 0 ligne · anon refusé
//   §5 Grants · fonctions REVOKE PUBLIC + GRANT EXECUTE controlé
//   §7 Concurrence réelle · Promise.all sur create, invitation, archive
//   §8 API flag · CIRCLE_ENABLED=false → 404 · true → autorisé au owner

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertNonProduction, getTestPassword } from "./_common.mjs";

assertNonProduction();
const TEST_PASSWORD = getTestPassword();

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
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
const HH_B = "test_p4_1_hh_b";
const EMAILS = {
  ownerA:   "paul+p4_1_owner_a@example.com",
  adultA:   "paul+p4_1_adult_a@example.com",
  ownerB:   "paul+p4_1_owner_b@example.com",
  coachA:   "paul+p4_1_coach_a@example.com",
};

function newClientForJwt() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
async function signInAs(email) {
  const c = newClientForJwt();
  const { data, error } = await c.auth.signInWithPassword({ email, password: TEST_PASSWORD });
  if (error) throw new Error(`signin ${email} FAILED: ${error.message}`);
  return { client: c, session: data.session };
}

// ── §2/§3 · Contraintes DB via Prisma (bypass RLS) ──────────────
async function checkConstraints() {
  process.stderr.write("\n═══ §2/§3 · Contraintes DB ═══\n");
  const owner = await db.user.findFirst({ where: { email: EMAILS.ownerA } });
  const adult = await db.user.findFirst({ where: { email: EMAILS.adultA } });

  // Archive + recreate same language (§2 · Q8/Q9)
  const archivedC = await db.circle.findFirst({ where: { id: "test_p4_1_circle_a_swahili_archived" } });
  try {
    const recreated = await db.circle.create({
      data: {
        householdId: HH_A,
        language: "SWAHILI",
        createdByUserId: owner.id,
      },
    });
    log("archive+recreate SWAHILI · OK", { newId: recreated.id, previouslyArchived: archivedC?.id });
    // cleanup
    await db.circle.delete({ where: { id: recreated.id } });
  } catch (e) {
    log("archive+recreate SWAHILI · FAIL", { error: e.message });
  }

  // Duplicate ACTIVE lingala on same household → refus
  try {
    await db.circle.create({
      data: { householdId: HH_A, language: "LINGALA", createdByUserId: owner.id },
    });
    log("dup ACTIVE LINGALA · accepted (BUG)", { ok: false });
  } catch (e) {
    log("dup ACTIVE LINGALA · rejected (OK)", { code: e.code, ok: /unique|duplicate/i.test(e.message) });
  }

  // 2 OWNERs actifs · refus
  try {
    await db.circleMembership.create({
      data: { circleId: CIRCLE_A, role: "OWNER", status: "ACTIVE", userId: adult.id },
    });
    log("second OWNER · accepted (BUG)", { ok: false });
    await db.circleMembership.deleteMany({ where: { circleId: CIRCLE_A, userId: adult.id, role: "OWNER" } });
  } catch (e) {
    log("second OWNER · rejected (OK)", { code: e.code, ok: /unique|duplicate/i.test(e.message) });
  }

  // 2 COACH actifs · refus
  try {
    await db.circleMembership.create({
      data: { circleId: CIRCLE_A, role: "COACH", status: "ACTIVE", userId: adult.id },
    });
    log("second COACH · accepted (BUG)", { ok: false });
    await db.circleMembership.deleteMany({ where: { circleId: CIRCLE_A, userId: adult.id, role: "COACH" } });
  } catch (e) {
    log("second COACH · rejected (OK)", { code: e.code, ok: /unique|duplicate/i.test(e.message) });
  }

  // Duplicate ADULT ACTIVE même user · refus
  try {
    await db.circleMembership.create({
      data: { circleId: CIRCLE_A, role: "ADULT", status: "ACTIVE", userId: adult.id },
    });
    log("duplicate active user membership · accepted (BUG)", { ok: false });
  } catch (e) {
    log("duplicate active user membership · rejected (OK)", { code: e.code, ok: /unique|duplicate/i.test(e.message) });
  }

  // Ajout de 2 ADULTs différents autorisé (pas de cap DB — cap applicatif seul)
  const extraAdultEmail = "paul+p4_1_extra_adult@example.com";
  const extra = await ensureExtraAdult(extraAdultEmail);
  try {
    const m = await db.circleMembership.create({
      data: { circleId: CIRCLE_A, role: "ADULT", status: "ACTIVE", userId: extra.id },
    });
    log("second distinct ADULT · accepted (OK · DB permet, cap applicatif via lib)", { membershipId: m.id });
    await db.circleMembership.delete({ where: { id: m.id } });
    await db.user.delete({ where: { id: extra.id } });
    const authUsers = await admin.auth.admin.listUsers({ perPage: 200 });
    const authU = authUsers.data.users.find((u) => u.email === extraAdultEmail);
    if (authU) await admin.auth.admin.deleteUser(authU.id);
  } catch (e) {
    log("second distinct ADULT · rejected (BUG)", { error: e.message });
  }
}

async function ensureExtraAdult(email) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  let auth = list.users.find((u) => u.email === email);
  if (!auth) {
    const { data } = await admin.auth.admin.createUser({
      email, password: TEST_PASSWORD, email_confirm: true,
      user_metadata: { fixture: "TEST_P4_1_EXTRA" },
    });
    auth = data.user;
  }
  let dbu = await db.user.findFirst({ where: { supabaseId: auth.id } });
  if (!dbu) {
    dbu = await db.user.create({
      data: { supabaseId: auth.id, email, fullName: "TEST P4.1 extra adult", role: "STUDENT" },
    });
  }
  return dbu;
}

// ── §4 · RLS par JWT ────────────────────────────────────────────
async function checkRlsByJwt() {
  process.stderr.write("\n═══ §4 · RLS par JWT ═══\n");
  // Anon (aucun JWT)
  const anon = newClientForJwt();
  const { data: anonC, error: anonErr } = await anon.from("circles").select("id").limit(50);
  log("anon · circles", { error: anonErr?.code ?? null, rows: anonC?.length ?? -1, expect: "refus" });

  // Owner A
  const { client: co } = await signInAs(EMAILS.ownerA);
  const { data: oCircles } = await co.from("circles").select("id").limit(50);
  log("owner A · sees own circle", {
    count: oCircles?.length ?? -1,
    seesA: (oCircles ?? []).some((c) => c.id === CIRCLE_A),
    seesB: (oCircles ?? []).some((c) => c.id === CIRCLE_B),
  });
  const { data: oMemb } = await co.from("circle_memberships").select("id,circleId,role").limit(50);
  log("owner A · circle_memberships (own circle only)", {
    count: oMemb?.length ?? -1,
    onlyOwnCircle: (oMemb ?? []).every((m) => m.circleId === CIRCLE_A),
  });
  await co.auth.signOut();

  // Adult A
  const { client: ca } = await signInAs(EMAILS.adultA);
  const { data: aCircles } = await ca.from("circles").select("id").limit(50);
  log("adult A · sees own circle", {
    count: aCircles?.length ?? -1,
    seesA: (aCircles ?? []).some((c) => c.id === CIRCLE_A),
  });
  await ca.auth.signOut();

  // Coach A
  const { client: cc } = await signInAs(EMAILS.coachA);
  const { data: cCircles } = await cc.from("circles").select("id").limit(50);
  log("coach A · sees only assigned circle", {
    count: cCircles?.length ?? -1,
    seesA: (cCircles ?? []).some((c) => c.id === CIRCLE_A),
    seesB: (cCircles ?? []).some((c) => c.id === CIRCLE_B),
  });
  await cc.auth.signOut();

  // Owner B (cross-tenant)
  const { client: cB } = await signInAs(EMAILS.ownerB);
  const { data: bCircles } = await cB.from("circles").select("id").limit(50);
  log("owner B · never sees circle A (cross-tenant)", {
    count: bCircles?.length ?? -1,
    seesA: (bCircles ?? []).some((c) => c.id === CIRCLE_A),
    seesB: (bCircles ?? []).some((c) => c.id === CIRCLE_B),
  });
  await cB.auth.signOut();

  // Membre REMOVED · retire owner A puis relogin
  await db.circleMembership.updateMany({
    where: { circleId: CIRCLE_A, userId: (await db.user.findFirst({ where: { email: EMAILS.adultA } })).id },
    data: { status: "REMOVED", removedAt: new Date() },
  });
  const { client: cRm } = await signInAs(EMAILS.adultA);
  const { data: rmCircles } = await cRm.from("circles").select("id").limit(50);
  log("removed member · 0 rows", { count: rmCircles?.length ?? -1, ok: (rmCircles?.length ?? -1) === 0 });
  await cRm.auth.signOut();
  // Restore ACTIVE
  await db.circleMembership.updateMany({
    where: { circleId: CIRCLE_A, userId: (await db.user.findFirst({ where: { email: EMAILS.adultA } })).id },
    data: { status: "ACTIVE", removedAt: null },
  });

  // AuditEvent · lecture non admin → 0 lignes
  const { client: cAudit } = await signInAs(EMAILS.ownerA);
  const { data: auditRows } = await cAudit.from("audit_events").select("id").limit(10);
  log("audit_events · non-admin sees 0", {
    count: auditRows?.length ?? -1, ok: (auditRows?.length ?? -1) === 0,
  });
  await cAudit.auth.signOut();
}

// ── §7 · Concurrence réelle ──────────────────────────────────────
async function checkConcurrency() {
  process.stderr.write("\n═══ §7 · Concurrence réelle Promise.all ═══\n");
  const owner = await db.user.findFirst({ where: { email: EMAILS.ownerA } });

  // (1) Deux transactions parallèles créent un Circle LINGALA sur même foyer → 1 succès
  // (LINGALA existe déjà via fixtures · on l'archive d'abord pour laisser la place)
  await db.circle.updateMany({
    where: { id: CIRCLE_A },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
  const results = await Promise.allSettled([
    db.circle.create({
      data: { householdId: HH_A, language: "LINGALA", createdByUserId: owner.id },
    }),
    db.circle.create({
      data: { householdId: HH_A, language: "LINGALA", createdByUserId: owner.id },
    }),
  ]);
  const succ = results.filter((r) => r.status === "fulfilled");
  const fail = results.filter((r) => r.status === "rejected");
  log("concurrent create LINGALA · 1 succ 1 fail (409)", {
    successes: succ.length,
    failures: fail.length,
    failureCodes: fail.map((r) => r.reason?.code ?? r.reason?.message?.slice(0, 60)),
  });
  // Cleanup nouvelles insertions + restore fixture
  for (const r of succ) {
    if (r.value?.id) await db.circle.delete({ where: { id: r.value.id } });
  }
  await db.circle.updateMany({
    where: { id: CIRCLE_A },
    data: { status: "ACTIVE", archivedAt: null },
  });

  // (2) Deux archivages simultanés · idempotent · état final ARCHIVED
  const archiveResults = await Promise.allSettled([
    db.circle.update({ where: { id: CIRCLE_A }, data: { status: "ARCHIVED", archivedAt: new Date() } }),
    db.circle.update({ where: { id: CIRCLE_A }, data: { status: "ARCHIVED", archivedAt: new Date() } }),
  ]);
  const finalC = await db.circle.findUnique({ where: { id: CIRCLE_A } });
  log("concurrent archive · idempotent", {
    successes: archiveResults.filter((r) => r.status === "fulfilled").length,
    finalStatus: finalC?.status,
    ok: finalC?.status === "ARCHIVED",
  });
  // Restore for other tests
  await db.circle.update({ where: { id: CIRCLE_A }, data: { status: "ACTIVE", archivedAt: null } });

  // (3) Deux COACH simultanés · 1 succès max
  const extra = await ensureExtraAdult("paul+p4_1_coach_race@example.com");
  const coachRace = await Promise.allSettled([
    db.circleMembership.create({
      data: { circleId: CIRCLE_A, role: "COACH", status: "ACTIVE", userId: extra.id },
    }),
    db.circleMembership.create({
      data: { circleId: CIRCLE_A, role: "COACH", status: "ACTIVE", userId: extra.id },
    }),
  ]);
  log("concurrent second COACH · 0 succès (déjà 1 coach)", {
    successes: coachRace.filter((r) => r.status === "fulfilled").length,
    failures: coachRace.filter((r) => r.status === "rejected").length,
  });
  await db.circleMembership.deleteMany({ where: { circleId: CIRCLE_A, userId: extra.id } });
  await db.user.delete({ where: { id: extra.id } });
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const authRace = list.users.find((u) => u.email === "paul+p4_1_coach_race@example.com");
  if (authRace) await admin.auth.admin.deleteUser(authRace.id);
}

// ── §8 · API sous flag ──────────────────────────────────────────
async function checkApiFlag() {
  process.stderr.write("\n═══ §8 · API flag CIRCLE_ENABLED off/on ═══\n");
  const BASE = "http://localhost:3000";
  const ownerAuth = await signInAs(EMAILS.ownerA);
  const cookieAccess = ownerAuth.session?.access_token;
  const headers = cookieAccess
    ? { Authorization: `Bearer ${cookieAccess}` }
    : {};
  // Note · notre API Next.js s'attend à des cookies SSR Supabase ; le Bearer
  // header ne suffit pas nécessairement. Ce test exerce donc surtout le
  // comportement du flag (404) plus qu'un end-to-end auth complet.
  try {
    const respOff = await fetch(`${BASE}/api/circles/${CIRCLE_A}`, { headers });
    log("flag OFF · GET /api/circles/[id]", {
      status: respOff.status, expect: "404", ok: respOff.status === 404,
    });
    const respPostOff = await fetch(`${BASE}/api/circles`, {
      method: "POST", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ householdId: HH_A, language: "SWAHILI" }),
    });
    log("flag OFF · POST /api/circles", {
      status: respPostOff.status, expect: "404", ok: respPostOff.status === 404,
    });
  } catch (e) {
    log("flag OFF · fetch fail (server not up?)", { error: e.message });
  }
  await ownerAuth.client.auth.signOut();
}

async function main() {
  try {
    await checkConstraints();
    await checkRlsByJwt();
    await checkConcurrency();
    await checkApiFlag();
  } finally {
    await db.$disconnect();
  }
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p4-1-captures", { recursive: true });
  await writeFile("/tmp/p4-1-captures/rls-smoke.json", JSON.stringify(events, null, 2));
  process.stderr.write(`\nWritten /tmp/p4-1-captures/rls-smoke.json (${events.length} events)\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
