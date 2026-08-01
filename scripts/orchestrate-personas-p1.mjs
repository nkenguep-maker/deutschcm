#!/usr/bin/env node
// Lot 7C · orchestre npm run test:personas:p1 · authentifié P-1.
//
// Pour chaque persona adulte (7 comptes), login réel + hit des routes
// autorisées + refus des routes interdites. Les 2 personas enfants
// (child_monde, child_racines) sont validés indirectement via
// test:messaging-audio-child:p1 (session HMAC/PIN) · ce lot 7C ne
// re-teste pas le mécanisme d'enfant (Lot P4.6-C.3.1).

import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);
const PORT = process.env.YEMA_PERSONAS_PORT || "3240";

function fail(step, msg, code = 1) {
  console.error(`[personas] STEP ${step} FAIL · ${msg}`);
  process.exit(code);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !url.includes(P1_REF)) fail(0, `URL non-P1 · ${url}`);
for (const b of BLOCKED) if (url.includes(b)) fail(0, `blocklisted ${b}`);
if (!process.env.P1_TEST_PASSWORD) fail(0, "P1_TEST_PASSWORD absent", 2);

const PASSWORD = process.env.P1_TEST_PASSWORD;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supRef = new URL(url).host.split(".")[0];

// Matrice · duplication contrôlée depuis src/lib/personas/matrix.ts.
// Un test structurel vitest enforce que les 2 sources restent alignées.
const ADULTS = [
  {
    id: "super_admin",
    email: "test_yema_qa_super_admin@example.com",
    homeRoute: "/fr/admin",
    allowedApi: ["/api/me"],
    forbiddenApi: ["/api/child/session/current"],
  },
  {
    id: "teacher",
    email: "test_yema_qa_teacher@example.com",
    homeRoute: "/fr/teacher",
    allowedApi: ["/api/teacher/dashboard", "/api/teacher/classes", "/api/teacher/students"],
    forbiddenApi: ["/api/family/dashboard", "/api/child/session/current"],
  },
  {
    id: "coach",
    email: "test_yema_qa_coach@example.com",
    homeRoute: "/fr/dashboard",
    allowedApi: ["/api/me"],
    forbiddenApi: ["/api/teacher/students", "/api/child/session/current"],
  },
  {
    id: "center_admin",
    email: "test_yema_qa_center_admin@example.com",
    homeRoute: "/fr/center",
    allowedApi: ["/api/me"],
    forbiddenApi: ["/api/teacher/students", "/api/family/dashboard", "/api/child/session/current"],
  },
  {
    id: "student_monde",
    email: "test_yema_qa_student_monde@example.com",
    homeRoute: "/fr/dashboard",
    allowedApi: ["/api/me"],
    forbiddenApi: ["/api/teacher/students", "/api/family/dashboard", "/api/child/session/current"],
  },
  {
    id: "student_racines",
    email: "test_yema_qa_student_racines@example.com",
    homeRoute: "/fr/dashboard",
    allowedApi: ["/api/me"],
    forbiddenApi: ["/api/teacher/students", "/api/family/dashboard", "/api/child/session/current"],
  },
  {
    id: "family",
    email: "test_yema_qa_family@example.com",
    homeRoute: "/fr/famille",
    allowedApi: ["/api/family/dashboard", "/api/family/children"],
    forbiddenApi: ["/api/teacher/students", "/api/child/session/current"],
  },
];

async function loginCookie(email) {
  const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!r.ok) throw new Error(`login ${email} · ${r.status}`);
  const s = await r.json();
  const payload = {
    access_token: s.access_token,
    token_type: s.token_type,
    expires_in: s.expires_in,
    expires_at: s.expires_at ?? (Math.floor(Date.now() / 1000) + s.expires_in),
    refresh_token: s.refresh_token,
    user: s.user,
  };
  return `sb-${supRef}-auth-token=base64-${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
}

async function checkPersona(HOST, persona) {
  const label = `[${persona.id}]`;
  const cookie = await loginCookie(persona.email);
  const H = { Cookie: cookie, Origin: `http://${HOST}`, Host: HOST };
  // Home route · doit répondre 200 ou 307 (jamais 401/403/500).
  const home = await fetch(`http://${HOST}${persona.homeRoute}`, { headers: H, redirect: "manual" });
  if (home.status >= 400) return { ok: false, msg: `${label} home ${persona.homeRoute} → ${home.status}` };
  // Allowed API · au moins 1 doit répondre 200.
  let anyAllowedOk = false;
  for (const path of persona.allowedApi) {
    const r = await fetch(`http://${HOST}${path}`, { headers: H });
    if (r.status === 200) anyAllowedOk = true;
  }
  if (!anyAllowedOk) return { ok: false, msg: `${label} aucune route autorisée n'a répondu 200` };
  // Forbidden API · TOUTES doivent répondre >= 400 (jamais 200).
  for (const path of persona.forbiddenApi) {
    const r = await fetch(`http://${HOST}${path}`, { headers: H });
    if (r.status === 200) return { ok: false, msg: `${label} forbidden ${path} → 200 (isolation cassée)` };
  }
  return { ok: true, msg: `${label} OK · home ${home.status} · allowed ✓ · forbidden ✓` };
}

async function main() {
  console.log("[personas] STEP 1 · fixtures QA idempotentes");
  spawnSync("node", ["scripts/test-baseline/yema-qa-fixtures.mjs"], { stdio: "inherit", env: process.env });

  console.log(`[personas] STEP 2 · next start port ${PORT}`);
  const server = spawn("npx", ["next", "start", "-p", PORT], { stdio: ["ignore", "pipe", "inherit"], env: process.env });
  let ready = false;
  server.stdout.on("data", (b) => { if (/Ready|ready in|Started/i.test(b.toString())) ready = true; });
  for (let i = 0; i < 30 && !ready; i++) await sleep(1000);
  if (!ready) { server.kill("SIGTERM"); fail(2, "server not ready"); }

  const HOST = `127.0.0.1:${PORT}`;
  let exitCode = 0;
  try {
    console.log("[personas] STEP 3 · check 7 personas adultes");
    for (const p of ADULTS) {
      const res = await checkPersona(HOST, p);
      if (res.ok) console.log(`  ✓ ${res.msg}`);
      else { console.error(`  ✗ ${res.msg}`); exitCode = 1; }
    }
    console.log("[personas] STEP 4 · enfants validés indirectement via test:messaging-audio-child:p1");
    if (exitCode === 0) console.log("[personas] ALL OK");
  } catch (e) {
    console.error(`[personas] ERROR · ${e.message}`);
    exitCode = 1;
  } finally {
    server.kill("SIGTERM");
    await sleep(500);
  }
  process.exit(exitCode);
}

main().catch((e) => fail("?", e.message));
