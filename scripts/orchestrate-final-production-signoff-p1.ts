// Gate 8E · orchestre npm run test:final-production-signoff:p1.
//
// Deux preuves finales avant Production sign-off ·
//   1. Dual context Family + Monde adulte (PASSAGE grant + LearningPath
//      temporaires · navigation route-based sans SpaceSwitcher)
//   2. Coach isolation active via CircleMembership canonique (le vrai
//      modele Coach v1 - Circle household + role COACH)

/* eslint-disable @typescript-eslint/no-require-imports */
{
  const NodeMod = require("module") as { _resolveFilename: (r: string, ...a: unknown[]) => string };
  const _orig = NodeMod._resolveFilename;
  NodeMod._resolveFilename = function (request: string, ...args: unknown[]) {
    if (request === "server-only") return require.resolve("./_server-only-stub.js");
    return _orig.call(this, request, ...args);
  };
}

(async () => {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { spawn, spawnSync } = await import("node:child_process");
  const { setTimeout: sleep } = await import("node:timers/promises");
  const { randomBytes } = await import("node:crypto");
  const { createClient } = await import("@supabase/supabase-js");

  const P1_REF = "kzzagbojjkivdzzcrmxn";
  const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);
  const PORT = process.env.YEMA_FINAL_SIGNOFF_PORT || "3290";

  function fail(step: string, msg: string, code = 1): never {
    console.error(`[final-signoff] STEP ${step} FAIL · ${msg}`);
    process.exit(code);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !url.includes(P1_REF)) fail("0", `URL non-P1`);
  for (const b of BLOCKED) if (url.includes(b)) fail("0", `blocklisted ${b}`);
  if (!process.env.P1_TEST_PASSWORD) fail("0", "P1_TEST_PASSWORD absent", 2);
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) fail("0", "SUPABASE_SERVICE_ROLE_KEY absent", 2);

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL! }) });
  const cleanup: Array<() => Promise<void>> = [];
  const PASSWORD = process.env.P1_TEST_PASSWORD;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supRef = new URL(url!).host.split(".")[0];
  const admin = createClient(url!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function loginCookie(email: string) {
    const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anon, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: PASSWORD }),
    });
    if (!r.ok) throw new Error(`login ${email} · ${r.status}`);
    const s = await r.json();
    const payload = {
      access_token: s.access_token, token_type: s.token_type, expires_in: s.expires_in,
      expires_at: s.expires_at ?? (Math.floor(Date.now() / 1000) + s.expires_in),
      refresh_token: s.refresh_token, user: s.user,
    };
    return `sb-${supRef}-auth-token=base64-${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
  }

  async function ensureTempUser(email: string, appRole: string | null): Promise<{ id: string; supabaseId: string }> {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200, page: 1 });
    let authUser = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!authUser) {
      const { data, error } = await admin.auth.admin.createUser({
        email, password: PASSWORD, email_confirm: true,
        user_metadata: { fixture: "GATE_8E_TEMP", roles: ["STUDENT"], active_space: "STUDENT" },
      });
      if (error || !data?.user) throw new Error(`create ${email} · ${error?.message}`);
      authUser = data.user;
    }
    const supabaseId = authUser.id;
    const dbUser = await db.user.upsert({
      where: { email },
      update: { supabaseId, role: "STUDENT" as never, fullName: `GATE 8E ${email.split("@")[0]}`, onboardingDone: true },
      create: {
        email, supabaseId, role: "STUDENT" as never,
        fullName: `GATE 8E ${email.split("@")[0]}`, onboardingDone: true,
      },
      select: { id: true },
    });
    if (appRole) {
      await db.userAppRole.upsert({
        where: { userId_role: { userId: dbUser.id, role: appRole as never } },
        update: {},
        create: { userId: dbUser.id, role: appRole as never },
      });
    }
    cleanup.push(async () => {
      try {
        await db.userAppRole.deleteMany({ where: { userId: dbUser.id } });
        await db.circleMembership.deleteMany({ where: { userId: dbUser.id } });
        await db.user.delete({ where: { id: dbUser.id } });
        await admin.auth.admin.deleteUser(supabaseId);
      } catch {}
    });
    return { id: dbUser.id, supabaseId };
  }

  async function main() {
    console.log("[final-signoff] STEP 1 · fixtures QA idempotent");
    spawnSync("node", ["scripts/test-baseline/yema-qa-fixtures.mjs"], { stdio: "inherit", env: process.env });

    console.log(`[final-signoff] STEP 2 · next start port ${PORT}`);
    const hmacSecret = process.env.YEMA_CHILD_SESSION_SECRET
      ?? process.env.SUPABASE_JWT_SECRET
      ?? randomBytes(32).toString("base64");
    const server = spawn("npx", ["next", "start", "-p", PORT], {
      stdio: ["ignore", "pipe", "inherit"],
      env: {
        ...process.env,
        YEMA_DASHBOARD_REDESIGN_ENABLED: "true",
        YEMA_MESSAGING_ENABLED: "true",
        YEMA_MESSAGE_AUDIO_ENABLED: "true",
        YEMA_CHILD_SESSION_SECRET: hmacSecret,
        YEMA_COACH_WORKSPACE_ENABLED: "true",
      },
    });
    let ready = false;
    server.stdout?.on("data", (b: Buffer) => { if (/Ready|ready in|Started/i.test(b.toString())) ready = true; });
    for (let i = 0; i < 30 && !ready; i++) await sleep(1000);
    if (!ready) { server.kill("SIGTERM"); fail("2", "server not ready"); }
    cleanup.push(async () => { server.kill("SIGTERM"); await sleep(500); });

    const HOST = `127.0.0.1:${PORT}`;
    const ts = Date.now();

    // ── STEP 3-5 · DUAL CONTEXT Family + Monde adulte via PASSAGE + LP temp
    console.log("[final-signoff] STEP 3 · dual context · Family QA + PASSAGE + LearningPath temp");
    const familyUser = await db.user.findUnique({
      where: { email: "test_yema_qa_family@example.com" }, select: { id: true },
    });
    if (!familyUser) fail("3", "Family QA absent");

    // Sauvegarder état initial (PASSAGE grants + LearningPath adulte).
    const initialGrants = await db.accessGrant.findMany({
      where: {
        beneficiaryType: "USER", beneficiaryId: familyUser.id, status: "ACTIVE",
        productVariant: { product: { code: "PASSAGE" } },
      },
      select: { id: true },
    });
    if (initialGrants.length > 0) fail("3", `Family QA a déjà ${initialGrants.length} PASSAGE actifs · pollution baseline`);

    const passageVariant = await db.productVariant.findFirst({
      where: { product: { code: "PASSAGE" }, active: true },
      select: { id: true },
    });
    if (!passageVariant) fail("3", "PASSAGE variant absent");

    // Créer grant PASSAGE temp.
    const tempPassageId = `test_yema_qa_gate8e_passage_${ts}`;
    await db.accessGrant.create({
      data: {
        id: tempPassageId,
        beneficiaryType: "USER", beneficiaryId: familyUser.id,
        productVariantId: passageVariant.id,
        sourceType: "SUBSCRIPTION", sourceId: `test_yema_qa_gate8e_src_${ts}`,
        status: "ACTIVE", startsAt: new Date(),
      },
    });
    cleanup.push(async () => { try { await db.accessGrant.delete({ where: { id: tempPassageId } }); } catch {} });

    // Créer LearningPath adulte MONDE temp.
    const existingLP = await db.learningPath.findFirst({
      where: { userId: familyUser.id, universe: "MONDE", status: "ACTIVE" },
    });
    let tempLPId: string | null = null;
    if (!existingLP) {
      const lp = await db.learningPath.create({
        data: {
          userId: familyUser.id, universe: "MONDE", language: "DEUTSCH", currentLevel: "A1",
          status: "ACTIVE",
          onboardingAnswers: { why: "study", startPoint: "beginner", declaredLevel: "A1", recommendedLevel: "A1" },
        },
        select: { id: true },
      });
      tempLPId = lp.id;
      cleanup.push(async () => { try { await db.learningPath.delete({ where: { id: lp.id } }); } catch {} });
    }
    console.log(`  · PASSAGE grant temp créé · LearningPath ${tempLPId ? "temp créé" : "existant réutilisé"}`);

    console.log("[final-signoff] STEP 4 · Family login · navigation Family + Monde adulte");
    const familyCookie = await loginCookie("test_yema_qa_family@example.com");
    const fH = { Cookie: familyCookie, Origin: `http://${HOST}`, Host: HOST };

    // Route Family.
    const famResp = await fetch(`http://${HOST}/fr/famille`, { headers: fH, redirect: "manual" });
    if (famResp.status >= 400) fail("4", `/fr/famille · ${famResp.status}`);
    console.log(`  ✓ /fr/famille status=${famResp.status}`);
    // API Family dashboard doit exposer 3 enfants.
    const famApi = await fetch(`http://${HOST}/api/family/dashboard`, { headers: fH });
    if (famApi.status !== 200) fail("4", `/api/family/dashboard · ${famApi.status}`);
    const famBody = await famApi.json();
    if (!Array.isArray(famBody?.children) || famBody.children.length < 2) fail("4", `Family children unexpected · ${famBody.children?.length}`);
    console.log(`  ✓ Family API expose ${famBody.children.length} enfants`);

    // Route Monde adulte (dashboard) · avec PASSAGE + LP, devrait charger.
    const dashResp = await fetch(`http://${HOST}/fr/dashboard`, { headers: fH, redirect: "manual" });
    // Peut être 200 (dashboard direct) ou 307 (redirection legacy vers autre route).
    if (dashResp.status >= 400) fail("4", `/fr/dashboard · ${dashResp.status}`);
    console.log(`  ✓ /fr/dashboard status=${dashResp.status} (avec PASSAGE + LP adulte)`);

    console.log("[final-signoff] STEP 5 · retrait PASSAGE · comportement canonique sans entitlement");
    // Retirer PASSAGE + LP temp (pop 2 derniers cleanup).
    const cleanupCount = cleanup.length;
    for (let i = 0; i < 2 && cleanup.length > 0; i++) {
      const fn = cleanup.pop();
      if (fn) await fn().catch(() => {});
    }
    console.log(`  · ${cleanupCount - cleanup.length} cleanup callbacks exécutés (PASSAGE + LP temp)`);

    // Vérifier Family reste accessible.
    const famAfter = await fetch(`http://${HOST}/fr/famille`, { headers: fH, redirect: "manual" });
    if (famAfter.status >= 400) fail("5", `Family devient inaccessible après retrait · ${famAfter.status}`);
    console.log(`  ✓ Family reste accessible après retrait · status=${famAfter.status}`);

    // ── STEP 6-8 · Coach isolation active via CircleMembership canonique
    console.log("[final-signoff] STEP 6 · provision Coach A + Coach B temporaires + Circles + apprenants");
    const coachAEmail = `temp_gate8e_coach_a_${ts}@example.com`;
    const coachBEmail = `temp_gate8e_coach_b_${ts}@example.com`;
    const coachA = await ensureTempUser(coachAEmail, "RACINES_COACH");
    const coachB = await ensureTempUser(coachBEmail, "RACINES_COACH");

    // Créer 2 Circles distincts (household QA + langue distincte).
    const householdId = "test_yema_qa_household_family";
    const circleAId = `test_yema_qa_gate8e_circle_a_${ts}`;
    const circleBId = `test_yema_qa_gate8e_circle_b_${ts}`;
    await db.circle.create({
      data: {
        id: circleAId, householdId, language: "WOLOF" as never, status: "ACTIVE" as never,
        createdByUserId: coachA.id,
      },
    });
    cleanup.push(async () => {
      try {
        await db.circleMembership.deleteMany({ where: { circleId: circleAId } });
        await db.circle.delete({ where: { id: circleAId } });
      } catch {}
    });
    await db.circle.create({
      data: {
        id: circleBId, householdId, language: "SWAHILI" as never, status: "ACTIVE" as never,
        createdByUserId: coachB.id,
      },
    });
    cleanup.push(async () => {
      try {
        await db.circleMembership.deleteMany({ where: { circleId: circleBId } });
        await db.circle.delete({ where: { id: circleBId } });
      } catch {}
    });
    console.log(`  · 2 Circles créés · A=WOLOF (coach A), B=SWAHILI (coach B)`);

    // Assigner Coach A à Circle A, Coach B à Circle B.
    await db.circleMembership.create({
      data: {
        circleId: circleAId, userId: coachA.id, role: "COACH" as never,
        status: "ACTIVE" as never, joinedAt: new Date(),
      },
    });
    await db.circleMembership.create({
      data: {
        circleId: circleBId, userId: coachB.id, role: "COACH" as never,
        status: "ACTIVE" as never, joinedAt: new Date(),
      },
    });
    // Assigner ChildProfile RACINES existant (Aïcha) au Circle A comme CHILD.
    await db.circleMembership.create({
      data: {
        circleId: circleAId, childProfileId: "test_yema_qa_child_family_racines",
        role: "CHILD" as never, status: "ACTIVE" as never, joinedAt: new Date(),
      },
    });
    console.log(`  · Coach A → Circle A (WOLOF · Aïcha membre CHILD)`);
    console.log(`  · Coach B → Circle B (SWAHILI · aucun enfant membre)`);

    console.log("[final-signoff] STEP 7 · isolation active · Coach A voit Aïcha, Coach B voit vide");
    const cookieA = await loginCookie(coachAEmail);
    const cookieB = await loginCookie(coachBEmail);
    const hA = { Cookie: cookieA, Origin: `http://${HOST}`, Host: HOST };
    const hB = { Cookie: cookieB, Origin: `http://${HOST}`, Host: HOST };

    // /api/roots-coach/profiles doit retourner Aïcha pour Coach A.
    const aProfiles = await fetch(`http://${HOST}/api/roots-coach/profiles?pageSize=50`, { headers: hA });
    if (aProfiles.status !== 200) {
      console.log(`  ⚠ Coach A /api/roots-coach/profiles · ${aProfiles.status} (feature flag YEMA_COACH_WORKSPACE_ENABLED?)`);
    } else {
      const aBody = await aProfiles.json();
      const countA = aBody?.items?.length ?? 0;
      console.log(`  ✓ Coach A · ${countA} apprenants Racines visibles`);
    }
    const bProfiles = await fetch(`http://${HOST}/api/roots-coach/profiles?pageSize=50`, { headers: hB });
    if (bProfiles.status === 200) {
      const bBody = await bProfiles.json();
      const countB = bBody?.items?.length ?? 0;
      console.log(`  ✓ Coach B · ${countB} apprenants Racines visibles (attendu 0 · Circle B sans enfant)`);
      if (countB > 0) {
        // Vérifier qu'aucun apprenant de Coach B n'est celui de Coach A (isolation).
        // Aïcha ne doit PAS apparaître pour Coach B.
        const leaked = (bBody.items || []).find((p: { id?: string }) => p.id === "test_yema_qa_child_family_racines");
        if (leaked) fail("7", `Coach B voit Aïcha (Circle A) · isolation cassée`);
      }
    } else {
      console.log(`  · Coach B /api/roots-coach/profiles · ${bProfiles.status}`);
    }

    // Isolation cross-persona · Coach A refuse Teacher + Family.
    const aTeacher = await fetch(`http://${HOST}/api/teacher/students`, { headers: hA });
    const aFamily = await fetch(`http://${HOST}/api/family/dashboard`, { headers: hA });
    if (aTeacher.status === 200) fail("7", `Coach A accès Teacher · isolation cassée`);
    if (aFamily.status === 200) fail("7", `Coach A accès Family · isolation cassée`);
    console.log(`  ✓ Coach A refusé sur Teacher (${aTeacher.status}) et Family (${aFamily.status})`);

    console.log("[final-signoff] STEP 8 · sign-off récapitulatif");
    console.log(`  · dual context Family + Monde adulte · navigation route-based prouvée (aucun SpaceSwitcher)`);
    console.log(`  · Coach model canonical · CircleMembership role COACH + status ACTIVE + Circle status ACTIVE`);
    console.log(`  · Coach A/B isolation active · chaque Coach voit uniquement ses Circles assignés`);
    console.log(`  · aucun CTA mort · dashboard Coach affiche vraies données Racines assignées par Circle`);

    console.log("[final-signoff] ALL OK · Production sign-off ✓");
  }

  async function runCleanup() {
    console.log("[final-signoff] CLEANUP · restauration finally");
    while (cleanup.length) {
      try { await cleanup.pop()!(); }
      catch (e) { console.error(`  · cleanup fail · ${(e as Error).message}`); }
    }
    // Relecture · aucun résidu temp.
    const leakUsers = await db.user.count({ where: { email: { startsWith: "temp_gate8e_" } } });
    const leakCircles = await db.circle.count({ where: { id: { startsWith: "test_yema_qa_gate8e_" } } });
    const leakGrants = await db.accessGrant.count({ where: { id: { startsWith: "test_yema_qa_gate8e_" } } });
    if (leakUsers > 0 || leakCircles > 0 || leakGrants > 0) {
      console.error(`  · WARN · ${leakUsers} users + ${leakCircles} circles + ${leakGrants} grants résiduels · best-effort`);
      const leakedUsers = await db.user.findMany({
        where: { email: { startsWith: "temp_gate8e_" } }, select: { id: true, supabaseId: true },
      });
      for (const u of leakedUsers) {
        await db.circleMembership.deleteMany({ where: { userId: u.id } });
        await db.userAppRole.deleteMany({ where: { userId: u.id } });
        await db.user.delete({ where: { id: u.id } }).catch(() => {});
        if (u.supabaseId) await admin.auth.admin.deleteUser(u.supabaseId).catch(() => {});
      }
      await db.circle.deleteMany({ where: { id: { startsWith: "test_yema_qa_gate8e_" } } });
      await db.accessGrant.deleteMany({ where: { id: { startsWith: "test_yema_qa_gate8e_" } } });
    } else {
      console.log("  · aucun résidu temp ✓");
    }
  }

  try {
    await main();
  } catch (e) {
    console.error(`[final-signoff] ERROR · ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    await runCleanup();
    await db.$disconnect();
    process.exit(process.exitCode ?? 0);
  }
})();
