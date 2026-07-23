// P4.2 · Smoke test P-1 · endpoints + concurrence + RLS + security.
// Prérequis · fixtures posées + dev server avec YEMA_CIRCLE_ENABLED=true
// et YEMA_ALLOW_TEST_TOKENS=true (test uniquement).

import { chromium } from "playwright";
import pg from "pg";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }

const EMAILS = {
  ownerA:       "paul+p4_2_owner_a@example.com",
  adultA:       "paul+p4_2_adult_a@example.com",
  invitedAdult: "paul+p4_2_invited_adult@example.com",
  coachA:       "paul+p4_2_coach_a@example.com",
  ownerB:       "paul+p4_2_owner_b@example.com",
  yemaAdmin:    "paul+p4_2_yema_admin@example.com",
};
const CIRCLE_A = "test_p4_2_circle_a_lingala";
const CIRCLE_B = "test_p4_2_circle_b_wolof";
const HH_A = "test_p4_2_hh_a";

const events = [];
function log(label, obj) {
  const safe = { ...obj };
  if (safe.token) safe.token = "[REDACTED]";
  events.push({ label, ...safe });
  process.stderr.write(`  ${label} · ${JSON.stringify(safe)}\n`);
}

async function login(page, email) {
  await page.goto(`${BASE}/fr/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PW);
  await Promise.all([
    page.waitForResponse((r) => /supabase\.co\/auth\/v1\/token/.test(r.url()), { timeout: 20000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(1500);
}

async function ctxFor(browser, email) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, email);
  const cookies = await ctx.cookies();
  return { ctx, page, cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; ") };
}

async function req(cookie, method, path, body, extraHeaders = {}) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const rBody = await r.json().catch(() => null);
  return { status: r.status, body: rBody, headers: r.headers };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const dbClient = new pg.Client({ connectionString: process.env.DIRECT_URL });
  await dbClient.connect();
  try {
    const owner = await ctxFor(browser, EMAILS.ownerA);
    const adult = await ctxFor(browser, EMAILS.adultA);
    const coach = await ctxFor(browser, EMAILS.coachA);
    const ownerB = await ctxFor(browser, EMAILS.ownerB);
    const admin = await ctxFor(browser, EMAILS.yemaAdmin);
    const invited = await ctxFor(browser, EMAILS.invitedAdult);

    // === GET /members ===
    process.stderr.write("\n═══ GET /api/circles/[cid]/members ═══\n");
    const oM = await req(owner.cookie, "GET", `/api/circles/${CIRCLE_A}/members`);
    log("owner A · members list", {
      status: oM.status, count: oM.body?.memberships?.length,
      hasChildProfile: !!oM.body?.memberships?.find((m) => m.role === "CHILD")?.childProfile,
    });
    const cM = await req(coach.cookie, "GET", `/api/circles/${CIRCLE_A}/members`);
    log("coach A · members (redacted)", {
      status: cM.status, count: cM.body?.memberships?.length,
      // COACH sees displayName + avatarAnimal + age · no user.id
      firstChildProjection: cM.body?.memberships?.find((m) => m.role === "CHILD"),
    });
    const bM = await req(ownerB.cookie, "GET", `/api/circles/${CIRCLE_A}/members`);
    log("owner B cross-tenant · members", { status: bM.status, expect: 403 });
    const anon = await req(null, "GET", `/api/circles/${CIRCLE_A}/members`);
    log("anon · members", { status: anon.status, expect: 401 });

    // === Adult invitation flow ===
    process.stderr.write("\n═══ Adult invitation flow ═══\n");
    // OWNER B doit avoir un ADULT actif d'abord (le fixtures pose OWNER seul)
    // Test · owner A tente d'inviter un adulte SUPPLÉMENTAIRE alors qu'il y a
    // déjà OWNER + ADULT (2 adultes). Doit être refusé max_adults_reached.
    const invAtCap = await req(owner.cookie, "POST", `/api/circles/${CIRCLE_A}/invitations/adult`, {
      email: "someone-new@example.com",
    });
    log("owner A · invite adult when cap reached", { status: invAtCap.status, code: invAtCap.body?.code });

    // Retire l'adulte pour libérer la place (via DELETE membershipId).
    const adultMembership = await dbClient.query(
      "SELECT id FROM circle_memberships WHERE \"circleId\" = $1 AND role = 'ADULT' AND status = 'ACTIVE'",
      [CIRCLE_A],
    );
    const adultMembershipId = adultMembership.rows[0]?.id;
    if (adultMembershipId) {
      const del = await req(owner.cookie, "DELETE", `/api/circles/${CIRCLE_A}/members/${adultMembershipId}`);
      log("owner A · remove ADULT (make room)", { status: del.status });
    }

    // Adult non-owner tente d'inviter · 403
    const invByAdult = await req(adult.cookie, "POST", `/api/circles/${CIRCLE_A}/invitations/adult`, {
      email: EMAILS.invitedAdult,
    });
    log("adult A · invite (expect 403)", { status: invByAdult.status, code: invByAdult.body?.code });

    // Nettoie l'invitation PENDING existante des fixtures pour ce mail
    await dbClient.query(
      "DELETE FROM circle_invitations WHERE \"circleId\" = $1 AND \"invitedEmailHash\" = encode(sha256(lower($2)::bytea), 'hex') AND status = 'PENDING'",
      [CIRCLE_A, EMAILS.invitedAdult],
    );
    // Owner A invite legit · reçoit le token via header X-P4-Test-Token
    const inv = await req(owner.cookie, "POST", `/api/circles/${CIRCLE_A}/invitations/adult`, {
      email: EMAILS.invitedAdult,
    });
    const testToken = inv.headers?.get("x-p4-test-token");
    log("owner A · invite invited adult", {
      status: inv.status, code: inv.body?.code,
      hasInvitationId: !!inv.body?.invitation?.id,
      hasTestToken: !!testToken,
    });

    // Doublon PENDING sur même email · 409
    const dup = await req(owner.cookie, "POST", `/api/circles/${CIRCLE_A}/invitations/adult`, {
      email: EMAILS.invitedAdult,
    });
    log("duplicate invitation same email", { status: dup.status, code: dup.body?.code });

    // Accept avec token invalide · 404
    const badAccept = await req(invited.cookie, "POST", `/api/circle-invitations/${"z".repeat(43)}/accept`);
    log("accept · fake token", { status: badAccept.status, code: badAccept.body?.code });

    // Accept avec le vrai token (invited adult)
    let acceptedMembershipId = null;
    if (testToken) {
      const acc = await req(invited.cookie, "POST", `/api/circle-invitations/${encodeURIComponent(testToken)}/accept`);
      acceptedMembershipId = acc.body?.membership?.id ?? null;
      log("invited adult · accept invitation", { status: acc.status, hasMembership: !!acceptedMembershipId });

      // Replay · déjà utilisée
      const replay = await req(invited.cookie, "POST", `/api/circle-invitations/${encodeURIComponent(testToken)}/accept`);
      log("accept replay · already used", { status: replay.status, code: replay.body?.code });
    }

    // === Adult leave ===
    if (acceptedMembershipId) {
      process.stderr.write("\n═══ Adult leave ═══\n");
      const leave = await req(invited.cookie, "POST", `/api/circles/${CIRCLE_A}/leave`);
      log("invited adult · leave own circle", { status: leave.status });
    }

    // Owner tente de quitter · owner_cannot_leave
    const ownerLeave = await req(owner.cookie, "POST", `/api/circles/${CIRCLE_A}/leave`);
    log("owner · leave (expect 403)", { status: ownerLeave.status, code: ownerLeave.body?.code });

    // === Children ===
    process.stderr.write("\n═══ Children ═══\n");
    // 4 enfants déjà dans le cercle · ajouter un 5ᵉ enfant du même foyer → cap
    const child5 = await dbClient.query(
      "INSERT INTO child_profiles(id, \"parentUserId\", \"householdId\", prenom, \"avatarAnimal\", age, langues, \"updatedAt\") VALUES ($1, (SELECT id FROM users WHERE email=$2), $3, 'TEST_5th', 'renard', 3, '[]', NOW()) ON CONFLICT (id) DO NOTHING RETURNING id",
      ["test_p4_2_child_5th", EMAILS.ownerA, HH_A],
    );
    const child5Id = "test_p4_2_child_5th";
    const add5 = await req(owner.cookie, "POST", `/api/circles/${CIRCLE_A}/children`, {
      childProfileId: child5Id,
    });
    log("owner · add 5th child (expect 409)", { status: add5.status, code: add5.body?.code });

    // Retirer enfant A4 pour tester ajout légitime
    const childA4Membership = await dbClient.query(
      "SELECT id FROM circle_memberships WHERE \"circleId\" = $1 AND \"childProfileId\" = 'test_p4_2_child_a4' AND status = 'ACTIVE'",
      [CIRCLE_A],
    );
    const removeA4 = await req(owner.cookie, "DELETE", `/api/circles/${CIRCLE_A}/children/test_p4_2_child_a4`);
    log("owner · remove child A4", { status: removeA4.status });
    // Ré-ajouter A4 · 200
    const readd = await req(owner.cookie, "POST", `/api/circles/${CIRCLE_A}/children`, {
      childProfileId: "test_p4_2_child_a4",
    });
    log("owner · re-add child A4", { status: readd.status });

    // Enfant étranger (foyer B) · child_not_in_household
    const foreignChildId = "test_p4_2_foreign_child";
    await dbClient.query(
      "INSERT INTO child_profiles(id, \"parentUserId\", \"householdId\", prenom, \"avatarAnimal\", age, langues, \"updatedAt\") VALUES ($1, (SELECT id FROM users WHERE email=$2), (SELECT id FROM households WHERE \"ownerUserId\" = (SELECT id FROM users WHERE email=$2)), 'TEST_ForeignKid', 'renard', 3, '[]', NOW()) ON CONFLICT (id) DO NOTHING",
      [foreignChildId, EMAILS.ownerB],
    );
    // A4 retiré · owner A a de la place · tente d'ajouter enfant foyer B
    await req(owner.cookie, "DELETE", `/api/circles/${CIRCLE_A}/children/test_p4_2_child_a4`);
    const foreign = await req(owner.cookie, "POST", `/api/circles/${CIRCLE_A}/children`, {
      childProfileId: foreignChildId,
    });
    log("owner A · add foreign child (expect 403)", { status: foreign.status, code: foreign.body?.code });
    // Restore A4
    await req(owner.cookie, "POST", `/api/circles/${CIRCLE_A}/children`, { childProfileId: "test_p4_2_child_a4" });
    // Cleanup test children
    await dbClient.query("DELETE FROM child_profiles WHERE id IN ($1, $2)", [child5Id, foreignChildId]);

    // === Admin coach ===
    process.stderr.write("\n═══ Admin coach ═══\n");
    // Non-admin tente d'assigner · 403
    const nonAdminAssign = await req(owner.cookie, "POST", `/api/admin/circles/${CIRCLE_A}/coach`, {
      coachUserId: (await dbClient.query("SELECT id FROM users WHERE email=$1", [EMAILS.coachA])).rows[0].id,
    });
    log("owner (non-admin) · assign coach (expect 403)", {
      status: nonAdminAssign.status, code: nonAdminAssign.body?.code,
    });
    // Admin remove coach existant · 200
    const adminRemove = await req(admin.cookie, "DELETE", `/api/admin/circles/${CIRCLE_A}/coach`);
    log("admin · remove coach", { status: adminRemove.status });
    // Admin assign nouveau coach · 200
    const secondCoachId = (await dbClient.query("SELECT id FROM users WHERE email=$1", [EMAILS.coachA])).rows[0].id;
    const assignBack = await req(admin.cookie, "POST", `/api/admin/circles/${CIRCLE_A}/coach`, {
      coachUserId: secondCoachId,
    });
    log("admin · re-assign coach", { status: assignBack.status });
    // Double assign · 409 coach_already_assigned
    const doubleAssign = await req(admin.cookie, "POST", `/api/admin/circles/${CIRCLE_A}/coach`, {
      coachUserId: secondCoachId,
    });
    log("admin · double assign (expect 409)", { status: doubleAssign.status, code: doubleAssign.body?.code });

    // === Concurrence ===
    process.stderr.write("\n═══ Concurrence ═══\n");
    // (1) Deux emails simultanés · les deux passent (invitations PENDING, pas
    // encore ACTIVE — le cap ne s'applique qu'à l'acceptation).
    const [c1, c2] = await Promise.all([
      req(owner.cookie, "POST", `/api/circles/${CIRCLE_A}/invitations/adult`, { email: "race+p42a@example.com" }),
      req(owner.cookie, "POST", `/api/circles/${CIRCLE_A}/invitations/adult`, { email: "race+p42b@example.com" }),
    ]);
    log("concurrent invitations (2 emails distincts, PENDING · les 2 passent)", {
      status1: c1.status, status2: c2.status, ok: c1.status === 200 && c2.status === 200,
    });
    // (2) Double acceptation atomique · si deux requêtes présentent le MÊME
    // token, une seule doit aboutir.
    // Pour tester, on injecte le tokenHash d'un token connu et on lance 2 fetch.
    await dbClient.query(
      "DELETE FROM circle_invitations WHERE \"invitedEmailHash\" = encode(sha256(lower($1)::bytea), 'hex') AND status = 'PENDING'",
      [EMAILS.invitedAdult],
    );
    const invFresh = await req(owner.cookie, "POST", `/api/circles/${CIRCLE_A}/invitations/adult`, {
      email: EMAILS.invitedAdult,
    });
    const freshToken = invFresh.headers?.get("x-p4-test-token");
    if (freshToken) {
      const [r1, r2] = await Promise.all([
        req(invited.cookie, "POST", `/api/circle-invitations/${encodeURIComponent(freshToken)}/accept`),
        req(invited.cookie, "POST", `/api/circle-invitations/${encodeURIComponent(freshToken)}/accept`),
      ]);
      const succ = [r1, r2].filter((r) => r.status === 200).length;
      const fail = [r1, r2].filter((r) => r.status !== 200).length;
      log("concurrent accept · même token", {
        successes: succ, failures: fail,
        codes: [r1.body?.code ?? null, r2.body?.code ?? null].filter(Boolean),
        ok: succ === 1,
      });
      // Vérifie qu'un seul ADULT ACTIVE existe pour l'invitedAdult
      const membershipCount = await dbClient.query(
        "SELECT COUNT(*)::int as n FROM circle_memberships WHERE \"circleId\" = $1 AND status = 'ACTIVE' AND role IN ('OWNER','ADULT')",
        [CIRCLE_A],
      );
      log("post-race active adults count", { count: membershipCount.rows[0].n, expect: 2 });
    }
    // Cleanup les invitations race
    await dbClient.query(
      "DELETE FROM circle_invitations WHERE \"invitedEmailHash\" IN (encode(sha256('race+p42a@example.com'::bytea), 'hex'), encode(sha256('race+p42b@example.com'::bytea), 'hex'))",
    );

    // === AuditEvent check ===
    process.stderr.write("\n═══ AuditEvent check ═══\n");
    const auditRows = await dbClient.query(
      "SELECT action, COUNT(*) as n FROM audit_events WHERE \"scopeType\" = 'Circle' AND \"scopeId\" = $1 GROUP BY action ORDER BY action",
      [CIRCLE_A],
    );
    log("audit events P4.2 actions emitted", {
      count: auditRows.rows.reduce((a, r) => a + Number(r.n), 0),
      breakdown: auditRows.rows.map((r) => `${r.action}=${r.n}`),
    });
    // Vérifie qu'aucun metadata ne contient de token brut
    const leaks = await dbClient.query(
      "SELECT id FROM audit_events WHERE metadata::text ILIKE '%token%' OR metadata::text ILIKE '%password%' LIMIT 5",
    );
    log("audit metadata leak check", { leaks: leaks.rows.length, expect: 0 });

    await Promise.all([
      owner.ctx.close(), adult.ctx.close(), coach.ctx.close(),
      ownerB.ctx.close(), admin.ctx.close(), invited.ctx.close(),
    ]);
  } finally {
    await dbClient.end();
    await browser.close();
  }
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p4-2-captures", { recursive: true });
  await writeFile("/tmp/p4-2-captures/smoke.json", JSON.stringify(events, null, 2));
  process.stderr.write(`\nWritten /tmp/p4-2-captures/smoke.json (${events.length} events)\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
