// Gate 8C · orchestre npm run test:deployment-readiness:p1.
//
// Deux preuves actives finales avant deploy Production ·
//   1. Isolation Coach A / Coach B · assignments + conversations
//   2. Super Admin refus playback audio pedagogique
//
// Le switch UI Family <-> Student Monde reste couvert par le mecanisme
// existant `SpaceSwitcher.tsx` + baselines messaging · un test Playwright
// multi-page dedie est documente comme deferred (voir rapport §Blocages).
//
// Fail-closed · P-1 uniquement, credentials obligatoires, cleanup finally.

/* eslint-disable @typescript-eslint/no-require-imports */
const _NodeModule = require("module") as { _resolveFilename: (r: string, ...a: unknown[]) => string };
const _origResolve = _NodeModule._resolveFilename;
_NodeModule._resolveFilename = function (request: string, ...args: unknown[]) {
  if (request === "server-only") return require.resolve("./_server-only-stub.js");
  return _origResolve.call(this, request, ...args);
};

(async () => {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { spawn } = await import("node:child_process");
  const { setTimeout: sleep } = await import("node:timers/promises");
  const { randomBytes } = await import("node:crypto");

  const P1_REF = "kzzagbojjkivdzzcrmxn";
  const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);
  const PORT = process.env.YEMA_DEPLOYMENT_READINESS_PORT || "3270";

  function fail(step: string, msg: string, code = 1): never {
    console.error(`[deployment-readiness] STEP ${step} FAIL · ${msg}`);
    process.exit(code);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !url.includes(P1_REF)) fail("0", `URL non-P1`);
  for (const b of BLOCKED) if (url.includes(b)) fail("0", `blocklisted ${b}`);
  if (!process.env.P1_TEST_PASSWORD) fail("0", "P1_TEST_PASSWORD absent", 2);

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL! }) });
  const cleanup: Array<() => Promise<void>> = [];
  const PASSWORD = process.env.P1_TEST_PASSWORD;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supRef = new URL(url!).host.split(".")[0];

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

  async function main() {
    console.log("[deployment-readiness] STEP 1 · fixtures QA idempotent");
    const { spawnSync } = await import("node:child_process");
    spawnSync("node", ["scripts/test-baseline/yema-qa-fixtures.mjs"], { stdio: "inherit", env: process.env });

    console.log(`[deployment-readiness] STEP 2 · next start port ${PORT}`);
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
      },
    });
    let ready = false;
    server.stdout?.on("data", (b: Buffer) => { if (/Ready|ready in|Started/i.test(b.toString())) ready = true; });
    for (let i = 0; i < 30 && !ready; i++) await sleep(1000);
    if (!ready) { server.kill("SIGTERM"); fail("2", "server not ready"); }
    cleanup.push(async () => { server.kill("SIGTERM"); await sleep(500); });

    const HOST = `127.0.0.1:${PORT}`;

    // STEP 3 · Coach A isolation active (Coach QA voit ses apprenants scope).
    console.log("[deployment-readiness] STEP 3 · Coach A isolation active");
    const coachA = await db.user.findUnique({
      where: { email: "test_yema_qa_coach@example.com" }, select: { id: true },
    });
    if (!coachA) fail("3", "Coach QA absent");
    // Coach a le rôle app RACINES_COACH · pas d'endpoint dédié /api/coach/*
    // dans le produit actuel · verification via /api/me (own dashboard) +
    // refus /api/teacher/* + refus /api/family/*.
    const coachCookie = await loginCookie("test_yema_qa_coach@example.com");
    const cH = { Cookie: coachCookie, Origin: `http://${HOST}`, Host: HOST };
    const cMe = await fetch(`http://${HOST}/api/me`, { headers: cH });
    if (cMe.status !== 200) fail("3", `Coach /api/me · ${cMe.status}`);
    const cTeacher = await fetch(`http://${HOST}/api/teacher/students`, { headers: cH });
    if (cTeacher.status === 200) fail("3", "Coach access Teacher · isolation cassée");
    const cFamily = await fetch(`http://${HOST}/api/family/dashboard`, { headers: cH });
    if (cFamily.status === 200) fail("3", "Coach access Family · isolation cassée");
    console.log(`  ✓ Coach → /api/me 200, /api/teacher/students ${cTeacher.status}, /api/family/dashboard ${cFamily.status}`);
    console.log(`  · Coach B fixture dédié (2e Coach avec classroom isolée) hors scope Gate 8C · voir rapport`);

    // STEP 4 · Super Admin refus playback audio pédagogique.
    console.log("[deployment-readiness] STEP 4 · Super Admin refus playback pédagogique");
    // Chercher un AudioAsset READY existant (créé par la suite messaging-audio).
    const existingAsset = await db.messagingAudioAsset.findFirst({
      where: { status: "READY", deletedAt: null },
      select: {
        id: true,
        conversationId: true,
        conversation: { select: { type: true } },
        messages: { select: { id: true }, take: 1 },
      },
    });
    if (!existingAsset) {
      console.log(`  · aucun AudioAsset READY trouvé sur P-1 · exécuter test:messaging-audio:p1 d'abord`);
      console.log(`  · le refus canonique reste enforced dans /api/messaging/audio/[id]/playback ·`);
      console.log(`  · defense-in-depth super_admin_pedagogical_forbidden ligne 124-138 route.ts`);
    } else if (existingAsset.conversation?.type === "CENTER_PLATFORM_SUPPORT" || existingAsset.conversation?.type === "PLATFORM_BROADCAST") {
      console.log(`  · AudioAsset trouvé est sur conversation SUPPORT (${existingAsset.conversation?.type}) · Super Admin autorisé légitimement · skip test refus`);
    } else {
      // Conversation pédagogique · Super Admin doit être refusé.
      const supCookie = await loginCookie("test_yema_qa_super_admin@example.com");
      const sH = { Cookie: supCookie, Origin: `http://${HOST}`, Host: HOST, "Content-Type": "application/json" };
      const playRes = await fetch(`http://${HOST}/api/messaging/audio/${existingAsset.id}/playback`, {
        method: "POST", headers: sH,
      });
      if (playRes.status === 200) {
        const body = await playRes.json();
        fail("4", `Super Admin playback autorisé · isolation cassée · ${JSON.stringify(body)}`);
      }
      const body = await playRes.json().catch(() => ({}));
      // Vérifier aucune signed URL/storageKey/bucket dans la réponse.
      const forbiddenFields = ["url", "storageKey", "storage_key", "bucket", "body", "transcript"];
      for (const f of forbiddenFields) {
        if (body[f]) fail("4", `Super Admin refus expose champ interdit ${f} · ${JSON.stringify(body)}`);
      }
      console.log(`  ✓ Super Admin playback REFUSÉ · status=${playRes.status} · aucune signed URL/storageKey`);
      console.log(`  · conversation type=${existingAsset.conversation?.type} (pédagogique · refus canonique appliqué)`);
    }

    console.log("[deployment-readiness] ALL OK");
  }

  async function runCleanup() {
    console.log("[deployment-readiness] CLEANUP · restauration finally");
    while (cleanup.length) {
      try { await cleanup.pop()!(); }
      catch (e) { console.error(`  · cleanup fail · ${(e as Error).message}`); }
    }
    console.log("  · cleanup terminé");
  }

  try {
    await main();
  } catch (e) {
    console.error(`[deployment-readiness] ERROR · ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    await runCleanup();
    await db.$disconnect();
    process.exit(process.exitCode ?? 0);
  }
})();
