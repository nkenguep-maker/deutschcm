// Gate 8L · Playwright · logout UI + network + manifest dedupe.

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
  const { createClient: createAdminClient } = await import("@supabase/supabase-js");

  const P1_REF = "kzzagbojjkivdzzcrmxn";
  const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);
  const PORT = process.env.YEMA_FINAL_RUNTIME_PORT || "3360";

  function fail(step: string, msg: string, code = 1): never {
    console.error(`[final-runtime] STEP ${step} FAIL · ${msg}`);
    process.exit(code);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !url.includes(P1_REF)) fail("0", `URL non-P1`);
  for (const b of BLOCKED) if (url.includes(b)) fail("0", `blocklisted ${b}`);
  if (!process.env.P1_TEST_PASSWORD) fail("0", "P1_TEST_PASSWORD absent", 2);
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) fail("0", "SUPABASE_SERVICE_ROLE_KEY absent", 2);

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL! }) });
  const cleanup: Array<() => Promise<void>> = [];
  const PASSWORD = process.env.P1_TEST_PASSWORD!;
  const admin = createAdminClient(url!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function ensureCoachTemp(email: string): Promise<{ id: string; supabaseId: string }> {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200, page: 1 });
    let authUser = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!authUser) {
      const { data, error } = await admin.auth.admin.createUser({
        email, password: PASSWORD, email_confirm: true,
        user_metadata: { fixture: "GATE_8L_TEMP", roles: ["STUDENT"], active_space: "STUDENT" },
      });
      if (error || !data?.user) throw new Error(`create ${email} · ${error?.message}`);
      authUser = data.user;
    }
    const supabaseId = authUser.id;
    const dbUser = await db.user.upsert({
      where: { email },
      update: { supabaseId, role: "STUDENT" as never, fullName: `GATE 8L ${email.split("@")[0]}`, onboardingDone: true },
      create: { email, supabaseId, role: "STUDENT" as never, fullName: `GATE 8L ${email.split("@")[0]}`, onboardingDone: true },
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
    console.log("[final-runtime] STEP 1 · fixtures QA + Coach A/B (WOLOF/SWAHILI)");
    spawnSync("node", ["scripts/test-baseline/yema-qa-fixtures.mjs"], { stdio: "inherit", env: process.env });

    const ts = Date.now();
    const coachAEmail = `temp_gate8l_coach_a_${ts}@example.com`;
    const coachBEmail = `temp_gate8l_coach_b_${ts}@example.com`;
    const coachA = await ensureCoachTemp(coachAEmail);
    const coachB = await ensureCoachTemp(coachBEmail);
    const hhAId = `test_yema_qa_gate8l_hh_a_${ts}`;
    const hhBId = `test_yema_qa_gate8l_hh_b_${ts}`;
    await db.household.create({ data: { id: hhAId, ownerUserId: coachA.id } });
    await db.householdMembership.create({ data: { householdId: hhAId, userId: coachA.id, role: "OWNER" as never, status: "ACTIVE" as never } });
    await db.household.create({ data: { id: hhBId, ownerUserId: coachB.id } });
    await db.householdMembership.create({ data: { householdId: hhBId, userId: coachB.id, role: "OWNER" as never, status: "ACTIVE" as never } });
    cleanup.push(async () => {
      try {
        await db.householdMembership.deleteMany({ where: { householdId: { in: [hhAId, hhBId] } } });
        await db.household.deleteMany({ where: { id: { in: [hhAId, hhBId] } } });
      } catch {}
    });
    const childAId = `test_yema_qa_gate8l_child_a_${ts}`;
    const childBId = `test_yema_qa_gate8l_child_b_${ts}`;
    await db.childProfile.create({ data: {
      id: childAId, parentUserId: coachA.id, householdId: hhAId, prenom: "TempA",
      avatarAnimal: "elephant", age: 8, universe: "RACINES",
      langues: [{ langue: "wolof", type: "native", echelle: 0, etoiles: 0, motsAppris: [] }], activeLangue: "wolof",
    } });
    await db.childProfile.create({ data: {
      id: childBId, parentUserId: coachB.id, householdId: hhBId, prenom: "TempB",
      avatarAnimal: "renard", age: 9, universe: "RACINES",
      langues: [{ langue: "swahili", type: "native", echelle: 0, etoiles: 0, motsAppris: [] }], activeLangue: "swahili",
    } });
    cleanup.push(async () => { try { await db.childProfile.deleteMany({ where: { id: { in: [childAId, childBId] } } }); } catch {} });
    const cAId = `test_yema_qa_gate8l_circle_a_${ts}`;
    const cBId = `test_yema_qa_gate8l_circle_b_${ts}`;
    await db.circle.create({ data: { id: cAId, householdId: hhAId, language: "WOLOF" as never, status: "ACTIVE" as never, createdByUserId: coachA.id } });
    await db.circle.create({ data: { id: cBId, householdId: hhBId, language: "SWAHILI" as never, status: "ACTIVE" as never, createdByUserId: coachB.id } });
    cleanup.push(async () => {
      try {
        await db.circleMembership.deleteMany({ where: { circleId: { in: [cAId, cBId] } } });
        await db.circle.deleteMany({ where: { id: { in: [cAId, cBId] } } });
      } catch {}
    });
    for (const [cid, uid, chid] of [[cAId, coachA.id, childAId], [cBId, coachB.id, childBId]] as const) {
      await db.circleMembership.create({ data: { circleId: cid, userId: uid, role: "COACH" as never, status: "ACTIVE" as never, joinedAt: new Date() } });
      await db.circleMembership.create({ data: { circleId: cid, childProfileId: chid, role: "CHILD" as never, status: "ACTIVE" as never, joinedAt: new Date() } });
    }

    console.log(`[final-runtime] STEP 2 · next start port ${PORT}`);
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

    console.log("[final-runtime] STEP 3 · Playwright chromium · logout UI + network + dedupe");
    const pw = spawnSync("npx", [
      "playwright", "test", "--config", "playwright.final-browser-acceptance.config.ts",
      "tests/e2e/final-browser-acceptance/gate8l-runtime.spec.ts",
    ], {
      stdio: "inherit",
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${PORT}`,
        YEMA_CHILD_SESSION_SECRET: hmacSecret,
        GATE8L_COACH_A_EMAIL: coachAEmail,
        GATE8L_COACH_B_EMAIL: coachBEmail,
      },
    });
    if (pw.status !== 0) fail("3", `Playwright exit ${pw.status}`);
    console.log(`  ✓ Playwright all green`);
  }

  async function runCleanup() {
    console.log("[final-runtime] CLEANUP · restauration finally");
    while (cleanup.length) {
      try { await cleanup.pop()!(); } catch (e) { console.error(`  · cleanup fail · ${(e as Error).message}`); }
    }
    // Leak check · Gate 8L temp fixtures.
    const leakUsers = await db.user.count({ where: { email: { startsWith: "temp_gate8l_" } } });
    const leakChildren = await db.childProfile.count({ where: { id: { startsWith: "test_yema_qa_gate8l_" } } });
    const leakCircles = await db.circle.count({ where: { id: { startsWith: "test_yema_qa_gate8l_" } } });
    const leakHouseholds = await db.household.count({ where: { id: { startsWith: "test_yema_qa_gate8l_" } } });
    if (leakUsers + leakChildren + leakCircles + leakHouseholds > 0) {
      console.error(`  · WARN · residus · users=${leakUsers} children=${leakChildren} circles=${leakCircles} households=${leakHouseholds}`);
    } else {
      console.log("  · aucun résidu temp ✓");
    }
    console.log("  · cleanup terminé");
  }

  try { await main(); }
  catch (e) { console.error(`[final-runtime] ERROR · ${(e as Error).message}`); process.exitCode = 1; }
  finally { await runCleanup(); await db.$disconnect(); process.exit(process.exitCode ?? 0); }
})();
