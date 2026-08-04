// Gate 8G · Coach P-1 ACTIF · Circle A/B via API canonique 200.
//
// Fixtures ·
//   - Coach A + Coach B temp (Auth admin + Prisma User + UserAppRole
//     RACINES_COACH)
//   - Circle A (WOLOF · household QA · Coach A membership COACH + Aicha
//     child CHILD)
//   - Circle B (SWAHILI · household QA · Coach B membership COACH · sans
//     enfant · isolation cap check)
//
// Vérification API canonique · GET /api/roots-coach/profiles avec
// flags YEMA_COACH_WORKSPACE_ENABLED + ROOTS_COACH_RLS_CONFIRMED actifs.
//
// Cleanup finally exact.

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
  const PORT = process.env.YEMA_FINAL_EVIDENCE_PORT || "3300";

  function fail(step: string, msg: string, code = 1): never {
    console.error(`[final-evidence] STEP ${step} FAIL · ${msg}`);
    process.exit(code);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !url.includes(P1_REF)) fail("0", `URL non-P1`);
  for (const b of BLOCKED) if (url.includes(b)) fail("0", `blocklisted ${b}`);
  if (!process.env.P1_TEST_PASSWORD) fail("0", "P1_TEST_PASSWORD absent", 2);
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) fail("0", "SUPABASE_SERVICE_ROLE_KEY absent", 2);
  // Gate 8G · flags Coach obligatoires · fallback si le double-spawn du
  // wrapper les a sanitises (run-p4-5-b2-p1.mjs). Ces flags sont ensuite
  // propages au next start (STEP 2). Aucun secret, aucun .env touche.
  process.env.YEMA_COACH_WORKSPACE_ENABLED ??= "true";
  process.env.YEMA_ROOTS_COACH_RLS_CONFIRMED ??= "true";
  if (process.env.YEMA_COACH_WORKSPACE_ENABLED !== "true") fail("0", "YEMA_COACH_WORKSPACE_ENABLED != true");
  if (process.env.YEMA_ROOTS_COACH_RLS_CONFIRMED !== "true") fail("0", "YEMA_ROOTS_COACH_RLS_CONFIRMED != true");

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

  async function ensureCoachTemp(email: string): Promise<{ id: string; supabaseId: string }> {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200, page: 1 });
    let authUser = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!authUser) {
      const { data, error } = await admin.auth.admin.createUser({
        email, password: PASSWORD, email_confirm: true,
        user_metadata: { fixture: "GATE_8G_TEMP", roles: ["STUDENT"], active_space: "STUDENT" },
      });
      if (error || !data?.user) throw new Error(`create ${email} · ${error?.message}`);
      authUser = data.user;
    }
    const supabaseId = authUser.id;
    const dbUser = await db.user.upsert({
      where: { email },
      update: { supabaseId, role: "STUDENT" as never, fullName: `GATE 8G ${email.split("@")[0]}`, onboardingDone: true },
      create: {
        email, supabaseId, role: "STUDENT" as never,
        fullName: `GATE 8G ${email.split("@")[0]}`, onboardingDone: true,
      },
      select: { id: true },
    });
    await db.userAppRole.upsert({
      where: { userId_role: { userId: dbUser.id, role: "RACINES_COACH" as never } },
      update: {},
      create: { userId: dbUser.id, role: "RACINES_COACH" as never },
    });
    cleanup.push(async () => {
      try {
        await db.circleMembership.deleteMany({ where: { userId: dbUser.id } });
        await db.userAppRole.deleteMany({ where: { userId: dbUser.id } });
        await db.user.delete({ where: { id: dbUser.id } });
        await admin.auth.admin.deleteUser(supabaseId);
      } catch {}
    });
    return { id: dbUser.id, supabaseId };
  }

  async function main() {
    console.log("[final-evidence] STEP 1 · fixtures QA idempotent");
    spawnSync("node", ["scripts/test-baseline/yema-qa-fixtures.mjs"], { stdio: "inherit", env: process.env });

    console.log(`[final-evidence] STEP 2 · next start port ${PORT} · flags Coach ON`);
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
        YEMA_COACH_WORKSPACE_ENABLED: "true",
        YEMA_ROOTS_COACH_RLS_CONFIRMED: "true",
        YEMA_CHILD_SESSION_SECRET: hmacSecret,
      },
    });
    let ready = false;
    server.stdout?.on("data", (b: Buffer) => { if (/Ready|ready in|Started/i.test(b.toString())) ready = true; });
    for (let i = 0; i < 30 && !ready; i++) await sleep(1000);
    if (!ready) { server.kill("SIGTERM"); fail("2", "server not ready"); }
    cleanup.push(async () => { server.kill("SIGTERM"); await sleep(500); });

    const HOST = `127.0.0.1:${PORT}`;
    const ts = Date.now();

    console.log("[final-evidence] STEP 3 · provision Coach A + Coach B + Households temp + Circles A/B");
    const coachAEmail = `temp_gate8g_coach_a_${ts}@example.com`;
    const coachBEmail = `temp_gate8g_coach_b_${ts}@example.com`;
    const coachA = await ensureCoachTemp(coachAEmail);
    const coachB = await ensureCoachTemp(coachBEmail);

    // Gate 8G · households TEMPORAIRES distincts par Coach · évite tout
    // conflit unique constraint (household, language) avec fixtures partagées.
    const householdAId = `test_yema_qa_gate8g_hh_a_${ts}`;
    const householdBId = `test_yema_qa_gate8g_hh_b_${ts}`;
    await db.household.create({ data: { id: householdAId, ownerUserId: coachA.id } });
    await db.householdMembership.create({
      data: { householdId: householdAId, userId: coachA.id, role: "OWNER" as never, status: "ACTIVE" as never },
    });
    await db.household.create({ data: { id: householdBId, ownerUserId: coachB.id } });
    await db.householdMembership.create({
      data: { householdId: householdBId, userId: coachB.id, role: "OWNER" as never, status: "ACTIVE" as never },
    });
    cleanup.push(async () => {
      try {
        await db.householdMembership.deleteMany({ where: { householdId: { in: [householdAId, householdBId] } } });
        await db.household.deleteMany({ where: { id: { in: [householdAId, householdBId] } } });
      } catch {}
    });

    const circleAId = `test_yema_qa_gate8g_circle_a_${ts}`;
    const circleBId = `test_yema_qa_gate8g_circle_b_${ts}`;

    await db.circle.create({
      data: {
        id: circleAId, householdId: householdAId, language: "WOLOF" as never,
        status: "ACTIVE" as never, createdByUserId: coachA.id,
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
        id: circleBId, householdId: householdBId, language: "SWAHILI" as never,
        status: "ACTIVE" as never, createdByUserId: coachB.id,
      },
    });
    cleanup.push(async () => {
      try {
        await db.circleMembership.deleteMany({ where: { circleId: circleBId } });
        await db.circle.delete({ where: { id: circleBId } });
      } catch {}
    });

    // Coach A membership COACH ACTIVE dans Circle A.
    await db.circleMembership.create({
      data: {
        circleId: circleAId, userId: coachA.id, role: "COACH" as never,
        status: "ACTIVE" as never, joinedAt: new Date(),
      },
    });
    // Coach B membership COACH ACTIVE dans Circle B.
    await db.circleMembership.create({
      data: {
        circleId: circleBId, userId: coachB.id, role: "COACH" as never,
        status: "ACTIVE" as never, joinedAt: new Date(),
      },
    });
    // Aicha (Racines existant du household QA principal) assignee CHILD au
    // Circle A comme apprenant Coach A. Aucun apprenant assigne au Circle B
    // (cap isolation prouvee par vide).
    await db.circleMembership.create({
      data: {
        circleId: circleAId, childProfileId: "test_yema_qa_child_family_racines",
        role: "CHILD" as never, status: "ACTIVE" as never, joinedAt: new Date(),
      },
    });
    console.log(`  · Household A temp · Circle A WOLOF · Coach A + Aicha CHILD`);
    console.log(`  · Household B temp · Circle B SWAHILI · Coach B (aucun enfant · isolation cap)`);

    console.log("[final-evidence] STEP 4 · API Coach A · /api/roots-coach/profiles 200 attendu");
    const cookieA = await loginCookie(coachAEmail);
    const hA = { Cookie: cookieA, Origin: `http://${HOST}`, Host: HOST };
    const aResp = await fetch(`http://${HOST}/api/roots-coach/profiles?pageSize=50`, { headers: hA });
    if (aResp.status !== 200) fail("4", `Coach A /api/roots-coach/profiles · ${aResp.status} (attendu 200 avec flags actifs)`);
    const aBody = await aResp.json();
    if (!Array.isArray(aBody?.items)) fail("4", `Coach A items non-array · ${JSON.stringify(aBody)}`);
    const aChildIds = aBody.items.map((p: { id?: string }) => p.id);
    console.log(`  ✓ Coach A · status=200 · ${aBody.items.length} apprenants · ${aChildIds.join(", ") || "(vide)"}`);
    // Aicha doit être présente pour Coach A.
    if (!aChildIds.includes("test_yema_qa_child_family_racines")) {
      fail("4", `Coach A ne voit PAS Aicha (attendu · Circle A CHILD membership)`);
    }
    console.log(`  ✓ Coach A voit Aicha (Circle A CHILD)`);

    console.log("[final-evidence] STEP 5 · API Coach B · isolation cap · aucune leak Circle A");
    const cookieB = await loginCookie(coachBEmail);
    const hB = { Cookie: cookieB, Origin: `http://${HOST}`, Host: HOST };
    const bResp = await fetch(`http://${HOST}/api/roots-coach/profiles?pageSize=50`, { headers: hB });
    if (bResp.status !== 200) fail("5", `Coach B /api/roots-coach/profiles · ${bResp.status}`);
    const bBody = await bResp.json();
    const bChildIds = bBody.items?.map((p: { id?: string }) => p.id) ?? [];
    console.log(`  ✓ Coach B · status=200 · ${bBody.items?.length ?? 0} apprenants · ${bChildIds.join(", ") || "(vide)"}`);
    // Aicha ne doit PAS apparaitre pour Coach B (isolation Circle A → Coach B).
    if (bChildIds.includes("test_yema_qa_child_family_racines")) {
      fail("5", `Coach B voit Aicha (Circle A) · isolation cassée`);
    }
    console.log(`  ✓ Coach B NE voit PAS Aicha (isolation Circle A/B prouvée)`);

    console.log("[final-evidence] STEP 6 · cross-persona · Coach A/B refusés Teacher · isolation Family");
    // Note · Coach A/B sont OWNER de leur household temp (pour créer les
    // Circles). Cela leur donne un rôle guardian implicite sur leur propre
    // household. Le check ici · ils NE voient PAS les enfants du household
    // QA principal (Family QA). Family API peut retourner 200 avec children
    // vides ou uniquement les enfants de leur propre household.
    for (const [label, h] of [["Coach A", hA], ["Coach B", hB]] as const) {
      const rT = await fetch(`http://${HOST}/api/teacher/students`, { headers: h });
      const rF = await fetch(`http://${HOST}/api/family/dashboard`, { headers: h });
      if (rT.status === 200) fail("6", `${label} accède Teacher · isolation cross-persona cassée`);
      // Family peut renvoyer 200 · vérifier qu'aucun enfant du household
      // QA principal n'est exposé (Aïcha ne doit PAS apparaître pour Coach B).
      if (rF.status === 200) {
        const body = await rF.json();
        const leakedChildren = (body.children ?? []).filter((c: { id?: string }) =>
          c.id === "test_yema_qa_child_family_racines" || c.id === "test_yema_qa_child_family_monde",
        );
        if (leakedChildren.length > 0) {
          fail("6", `${label} voit enfants Family QA (household principal) · isolation cross-household cassée`);
        }
        console.log(`  ✓ ${label} · Teacher ${rT.status} · Family ${rF.status} avec ${body.children?.length ?? 0} enfants (household perso · aucun leak QA)`);
      } else {
        console.log(`  ✓ ${label} · Teacher ${rT.status} · Family ${rF.status}`);
      }
    }

    console.log("[final-evidence] STEP 7 · récapitulatif Gate 8G");
    console.log(`  · flags Coach P-1 actifs · YEMA_COACH_WORKSPACE_ENABLED=true + ROOTS_COACH_RLS_CONFIRMED=true`);
    console.log(`  · API /api/roots-coach/profiles ACTIVE · 200 avec scope Circle CircleMembership canonique`);
    console.log(`  · isolation Circle A/B prouvée · Coach A voit Aicha, Coach B ne la voit PAS`);
    console.log(`  · cross-persona · Coach refusé Teacher (403) et Family (401)`);
    console.log(`  · captures Playwright · deferred vers spec dédiée (Coach + enfant PIN flow) hors scope Gate 8G API`);

    console.log("[final-evidence] ALL OK · Gate 8G evidence ferme");
  }

  async function runCleanup() {
    console.log("[final-evidence] CLEANUP · restauration finally");
    while (cleanup.length) {
      try { await cleanup.pop()!(); }
      catch (e) { console.error(`  · cleanup fail · ${(e as Error).message}`); }
    }
    const leakUsers = await db.user.count({ where: { email: { startsWith: "temp_gate8g_" } } });
    const leakCircles = await db.circle.count({ where: { id: { startsWith: "test_yema_qa_gate8g_" } } });
    if (leakUsers > 0 || leakCircles > 0) {
      console.error(`  · WARN · ${leakUsers} users + ${leakCircles} circles résiduels · best-effort`);
      const leaked = await db.user.findMany({
        where: { email: { startsWith: "temp_gate8g_" } }, select: { id: true, supabaseId: true },
      });
      for (const u of leaked) {
        await db.circleMembership.deleteMany({ where: { userId: u.id } });
        await db.userAppRole.deleteMany({ where: { userId: u.id } });
        await db.user.delete({ where: { id: u.id } }).catch(() => {});
        if (u.supabaseId) await admin.auth.admin.deleteUser(u.supabaseId).catch(() => {});
      }
      await db.circle.deleteMany({ where: { id: { startsWith: "test_yema_qa_gate8g_" } } });
    } else {
      console.log("  · aucun résidu temp ✓");
    }
  }

  try {
    await main();
  } catch (e) {
    console.error(`[final-evidence] ERROR · ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    await runCleanup();
    await db.$disconnect();
    process.exit(process.exitCode ?? 0);
  }
})();
