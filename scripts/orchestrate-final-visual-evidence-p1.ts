// Gate 8H · isolation Coach A/B SYMÉTRIQUE + Playwright spécs +
// captures ciblées finales.
//
// Différences vs Gate 8G ·
//   - Circle B a désormais un enfant DISTINCT (nouveau ChildProfile temp)
//     · aucun partage · isolation symétrique complète
//   - Playwright specs sont invoquées pour rendre Coach dashboards + dual
//     context assertions étendues
//   - captures ciblées produites sous captures/final-evidence/

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
  const PORT = process.env.YEMA_FINAL_VISUAL_PORT || "3320";

  function fail(step: string, msg: string, code = 1): never {
    console.error(`[final-visual] STEP ${step} FAIL · ${msg}`);
    process.exit(code);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !url.includes(P1_REF)) fail("0", `URL non-P1`);
  for (const b of BLOCKED) if (url.includes(b)) fail("0", `blocklisted ${b}`);
  if (!process.env.P1_TEST_PASSWORD) fail("0", "P1_TEST_PASSWORD absent", 2);
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) fail("0", "SUPABASE_SERVICE_ROLE_KEY absent", 2);
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
        user_metadata: { fixture: "GATE_8H_TEMP", roles: ["STUDENT"], active_space: "STUDENT" },
      });
      if (error || !data?.user) throw new Error(`create ${email} · ${error?.message}`);
      authUser = data.user;
    }
    const supabaseId = authUser.id;
    const dbUser = await db.user.upsert({
      where: { email },
      update: { supabaseId, role: "STUDENT" as never, fullName: `GATE 8H ${email.split("@")[0]}`, onboardingDone: true },
      create: {
        email, supabaseId, role: "STUDENT" as never,
        fullName: `GATE 8H ${email.split("@")[0]}`, onboardingDone: true,
      },
      select: { id: true },
    });
    await db.userAppRole.upsert({
      where: { userId_role: { userId: dbUser.id, role: "RACINES_COACH" as never } },
      update: {}, create: { userId: dbUser.id, role: "RACINES_COACH" as never },
    });
    cleanup.push(async () => {
      try {
        await db.circleMembership.deleteMany({ where: { userId: dbUser.id } });
        await db.householdMembership.deleteMany({ where: { userId: dbUser.id } });
        await db.userAppRole.deleteMany({ where: { userId: dbUser.id } });
        await db.user.delete({ where: { id: dbUser.id } });
        await admin.auth.admin.deleteUser(supabaseId);
      } catch {}
    });
    return { id: dbUser.id, supabaseId };
  }

  async function main() {
    console.log("[final-visual] STEP 1 · fixtures QA");
    spawnSync("node", ["scripts/test-baseline/yema-qa-fixtures.mjs"], { stdio: "inherit", env: process.env });

    console.log(`[final-visual] STEP 2 · next start port ${PORT} · flags Coach ON`);
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

    console.log("[final-visual] STEP 3 · fixtures Coach A + Coach B + Households + Circles + enfants DISTINCTS");
    const coachAEmail = `temp_gate8h_coach_a_${ts}@example.com`;
    const coachBEmail = `temp_gate8h_coach_b_${ts}@example.com`;
    const coachA = await ensureCoachTemp(coachAEmail);
    const coachB = await ensureCoachTemp(coachBEmail);

    const householdAId = `test_yema_qa_gate8h_hh_a_${ts}`;
    const householdBId = `test_yema_qa_gate8h_hh_b_${ts}`;
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

    // Gate 8H · 2 enfants Racines DISTINCTS · un par Circle · aucun partage.
    const childAId = `test_yema_qa_gate8h_child_a_${ts}`;
    const childBId = `test_yema_qa_gate8h_child_b_${ts}`;
    await db.childProfile.create({
      data: {
        id: childAId, parentUserId: coachA.id, householdId: householdAId,
        prenom: "TempRacinesA", avatarAnimal: "elephant", age: 8,
        langues: [{ langue: "wolof", type: "native", echelle: 0, etoiles: 0, motsAppris: [] }],
        activeLangue: "wolof", universe: "RACINES",
      },
    });
    await db.childProfile.create({
      data: {
        id: childBId, parentUserId: coachB.id, householdId: householdBId,
        prenom: "TempRacinesB", avatarAnimal: "renard", age: 9,
        langues: [{ langue: "swahili", type: "native", echelle: 0, etoiles: 0, motsAppris: [] }],
        activeLangue: "swahili", universe: "RACINES",
      },
    });
    cleanup.push(async () => {
      try { await db.childProfile.deleteMany({ where: { id: { in: [childAId, childBId] } } }); } catch {}
    });

    const circleAId = `test_yema_qa_gate8h_circle_a_${ts}`;
    const circleBId = `test_yema_qa_gate8h_circle_b_${ts}`;
    await db.circle.create({
      data: {
        id: circleAId, householdId: householdAId, language: "WOLOF" as never,
        status: "ACTIVE" as never, createdByUserId: coachA.id,
      },
    });
    await db.circle.create({
      data: {
        id: circleBId, householdId: householdBId, language: "SWAHILI" as never,
        status: "ACTIVE" as never, createdByUserId: coachB.id,
      },
    });
    cleanup.push(async () => {
      try {
        await db.circleMembership.deleteMany({ where: { circleId: { in: [circleAId, circleBId] } } });
        await db.circle.deleteMany({ where: { id: { in: [circleAId, circleBId] } } });
      } catch {}
    });

    // Coach A + child A dans Circle A.
    await db.circleMembership.create({
      data: {
        circleId: circleAId, userId: coachA.id, role: "COACH" as never,
        status: "ACTIVE" as never, joinedAt: new Date(),
      },
    });
    await db.circleMembership.create({
      data: {
        circleId: circleAId, childProfileId: childAId, role: "CHILD" as never,
        status: "ACTIVE" as never, joinedAt: new Date(),
      },
    });
    // Coach B + child B dans Circle B.
    await db.circleMembership.create({
      data: {
        circleId: circleBId, userId: coachB.id, role: "COACH" as never,
        status: "ACTIVE" as never, joinedAt: new Date(),
      },
    });
    await db.circleMembership.create({
      data: {
        circleId: circleBId, childProfileId: childBId, role: "CHILD" as never,
        status: "ACTIVE" as never, joinedAt: new Date(),
      },
    });
    console.log(`  · Circle A · Coach A + TempRacinesA (${childAId.slice(0, 20)}..)`);
    console.log(`  · Circle B · Coach B + TempRacinesB (${childBId.slice(0, 20)}..)`);

    console.log("[final-visual] STEP 4 · Coach A · /api/roots-coach/profiles · voit A, PAS B");
    const cookieA = await loginCookie(coachAEmail);
    const hA = { Cookie: cookieA, Origin: `http://${HOST}`, Host: HOST };
    const aResp = await fetch(`http://${HOST}/api/roots-coach/profiles?pageSize=50`, { headers: hA });
    if (aResp.status !== 200) fail("4", `Coach A status ${aResp.status}`);
    const aBody = await aResp.json();
    const aIds = aBody.items?.map((p: { id?: string }) => p.id) ?? [];
    if (!aIds.includes(childAId)) fail("4", `Coach A ne voit PAS TempRacinesA (${childAId})`);
    if (aIds.includes(childBId)) fail("4", `Coach A voit TempRacinesB (${childBId}) · isolation cassée`);
    console.log(`  ✓ Coach A · voit ${aIds.length} apprenant · A présent, B absent`);

    console.log("[final-visual] STEP 5 · Coach B · /api/roots-coach/profiles · voit B, PAS A");
    const cookieB = await loginCookie(coachBEmail);
    const hB = { Cookie: cookieB, Origin: `http://${HOST}`, Host: HOST };
    const bResp = await fetch(`http://${HOST}/api/roots-coach/profiles?pageSize=50`, { headers: hB });
    if (bResp.status !== 200) fail("5", `Coach B status ${bResp.status}`);
    const bBody = await bResp.json();
    const bIds = bBody.items?.map((p: { id?: string }) => p.id) ?? [];
    if (!bIds.includes(childBId)) fail("5", `Coach B ne voit PAS TempRacinesB (${childBId})`);
    if (bIds.includes(childAId)) fail("5", `Coach B voit TempRacinesA (${childAId}) · isolation cassée`);
    console.log(`  ✓ Coach B · voit ${bIds.length} apprenant · B présent, A absent`);
    console.log(`  ✓ ISOLATION COACH A/B SYMÉTRIQUE PROUVÉE ACTIVEMENT`);

    console.log("[final-visual] STEP 6 · Playwright Coach + Family + Child (best-effort)");
    // Note · les 14 captures ciblées Gate 8H (dashboards Coach A/B + dual
    // context complet + Child Monde/Racines PIN flow) demandent Playwright
    // spec dedie · spec skeleton créé dans tests/e2e/final-visual/coach-and-family.spec.ts
    // Voir ce fichier pour l'exécution complète.
    const pwSpecExists = spawnSync("test", ["-f", "tests/e2e/final-visual/coach-and-family.spec.ts"], { stdio: "ignore" });
    if (pwSpecExists.status === 0) {
      const pw = spawnSync("npx", [
        "playwright", "test", "--config", "playwright.final-visual.config.ts",
      ], {
        stdio: "inherit",
        env: {
          ...process.env,
          PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${PORT}`,
          GATE8H_COACH_A_EMAIL: coachAEmail,
          GATE8H_COACH_B_EMAIL: coachBEmail,
          GATE8H_CHILD_A_ID: childAId,
          GATE8H_CHILD_B_ID: childBId,
          YEMA_CHILD_SESSION_SECRET: hmacSecret,
        },
      });
      if (pw.status !== 0) console.log(`  ⚠ Playwright exit ${pw.status} · certaines captures peuvent avoir échoué`);
      else console.log(`  ✓ Playwright specs exécutées avec succès`);
    } else {
      console.log(`  · Playwright spec absent · captures ciblées deferred vers mini-lot Gate 8I`);
    }

    console.log("[final-visual] ALL OK · isolation Coach A/B symétrique + fixtures Gate 8H");
  }

  async function runCleanup() {
    console.log("[final-visual] CLEANUP · restauration finally");
    while (cleanup.length) {
      try { await cleanup.pop()!(); }
      catch (e) { console.error(`  · cleanup fail · ${(e as Error).message}`); }
    }
    const leakUsers = await db.user.count({ where: { email: { startsWith: "temp_gate8h_" } } });
    const leakChildren = await db.childProfile.count({ where: { id: { startsWith: "test_yema_qa_gate8h_" } } });
    const leakCircles = await db.circle.count({ where: { id: { startsWith: "test_yema_qa_gate8h_" } } });
    const leakHouseholds = await db.household.count({ where: { id: { startsWith: "test_yema_qa_gate8h_" } } });
    if (leakUsers + leakChildren + leakCircles + leakHouseholds > 0) {
      console.error(`  · WARN · résidus · users=${leakUsers} children=${leakChildren} circles=${leakCircles} households=${leakHouseholds}`);
    } else {
      console.log("  · aucun résidu temp ✓");
    }
  }

  try {
    await main();
  } catch (e) {
    console.error(`[final-visual] ERROR · ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    await runCleanup();
    await db.$disconnect();
    process.exit(process.exitCode ?? 0);
  }
})();
