// Gate 8F · Playwright REEL · dual context Family + Monde adulte + captures.
//
// Provisionne PASSAGE + LearningPath temp sur Family QA · lance next start
// · execute Playwright chromium reel · assertions DOM · captures ciblees.
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

  const P1_REF = "kzzagbojjkivdzzcrmxn";
  const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);
  const PORT = process.env.YEMA_BROWSER_SIGNOFF_PORT || "3295";

  function fail(step: string, msg: string, code = 1): never {
    console.error(`[browser-signoff] STEP ${step} FAIL · ${msg}`);
    process.exit(code);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !url.includes(P1_REF)) fail("0", `URL non-P1`);
  for (const b of BLOCKED) if (url.includes(b)) fail("0", `blocklisted ${b}`);
  if (!process.env.P1_TEST_PASSWORD) fail("0", "P1_TEST_PASSWORD absent", 2);

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL! }) });
  const cleanup: Array<() => Promise<void>> = [];

  async function main() {
    console.log("[browser-signoff] STEP 1 · fixtures QA");
    spawnSync("node", ["scripts/test-baseline/yema-qa-fixtures.mjs"], { stdio: "inherit", env: process.env });

    console.log("[browser-signoff] STEP 2 · provision PASSAGE + LearningPath adulte MONDE temp sur Family QA");
    const familyUser = await db.user.findUnique({
      where: { email: "test_yema_qa_family@example.com" }, select: { id: true },
    });
    if (!familyUser) fail("2", "Family QA absent");
    const passageVariant = await db.productVariant.findFirst({
      where: { product: { code: "PASSAGE" }, active: true }, select: { id: true },
    });
    if (!passageVariant) fail("2", "PASSAGE variant absent");
    const ts = Date.now();
    const tempPassageId = `test_yema_qa_gate8f_passage_${ts}`;
    await db.accessGrant.create({
      data: {
        id: tempPassageId,
        beneficiaryType: "USER", beneficiaryId: familyUser.id,
        productVariantId: passageVariant.id,
        sourceType: "SUBSCRIPTION", sourceId: `test_yema_qa_gate8f_src_${ts}`,
        status: "ACTIVE", startsAt: new Date(),
      },
    });
    cleanup.push(async () => { try { await db.accessGrant.delete({ where: { id: tempPassageId } }); } catch {} });

    const existingLP = await db.learningPath.findFirst({
      where: { userId: familyUser.id, universe: "MONDE", status: "ACTIVE" },
    });
    if (!existingLP) {
      const lp = await db.learningPath.create({
        data: {
          userId: familyUser.id, universe: "MONDE", language: "DEUTSCH", currentLevel: "A1",
          status: "ACTIVE",
          onboardingAnswers: { why: "study", startPoint: "beginner", declaredLevel: "A1", recommendedLevel: "A1" },
        },
        select: { id: true },
      });
      cleanup.push(async () => { try { await db.learningPath.delete({ where: { id: lp.id } }); } catch {} });
    }
    console.log(`  · PASSAGE + LearningPath adulte MONDE temp créés`);

    console.log(`[browser-signoff] STEP 3 · next start port ${PORT}`);
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
        YEMA_CHILD_SESSION_SECRET: hmacSecret,
      },
    });
    let ready = false;
    server.stdout?.on("data", (b: Buffer) => { if (/Ready|ready in|Started/i.test(b.toString())) ready = true; });
    for (let i = 0; i < 30 && !ready; i++) await sleep(1000);
    if (!ready) { server.kill("SIGTERM"); fail("3", "server not ready"); }
    cleanup.push(async () => { server.kill("SIGTERM"); await sleep(500); });

    console.log("[browser-signoff] STEP 4 · Playwright chromium réel · dual context");
    const pw = spawnSync("npx", [
      "playwright", "test", "--config", "playwright.browser-signoff.config.ts",
    ], {
      stdio: "inherit",
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${PORT}`,
        YEMA_CHILD_SESSION_SECRET: hmacSecret,
      },
    });
    if (pw.status !== 0) fail("4", `Playwright chromium exit ${pw.status}`);
    console.log("[browser-signoff] ALL OK · dual context browser-real prouvé");
  }

  async function runCleanup() {
    console.log("[browser-signoff] CLEANUP · restauration finally");
    while (cleanup.length) {
      try { await cleanup.pop()!(); }
      catch (e) { console.error(`  · cleanup fail · ${(e as Error).message}`); }
    }
    const leak = await db.accessGrant.count({ where: { id: { startsWith: "test_yema_qa_gate8f_" } } });
    if (leak > 0) console.error(`  · WARN · ${leak} grants temp résiduels`);
    else console.log("  · aucun résidu ✓");
  }

  try {
    await main();
  } catch (e) {
    console.error(`[browser-signoff] ERROR · ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    await runCleanup();
    await db.$disconnect();
    process.exit(process.exitCode ?? 0);
  }
})();
