#!/usr/bin/env node
// Lot 7C · orchestre npm run test:personas:p1 · authentifié P-1.
//
// Pour chaque persona adulte (7 comptes), login réel + hit des routes
// autorisées + refus des routes interdites. Les 2 personas enfants sont
// ensuite validés directement via parent réel + PIN + session HMAC + dashboard.
// Ce script est fail-closed sur le projet P-1 et ne doit jamais viser Production.

import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { scrypt as _scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";
const scryptAsync = promisify(_scrypt);
async function hashChildPin(pin) {
  const salt = randomBytes(16);
  const key = await scryptAsync(Buffer.from(pin, "utf8"), salt, 64, { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

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

// Matrice runtime · doit rester alignée avec src/lib/personas/matrix.ts.
const ADULTS = [
  {
    id: "super_admin",
    email: "test_yema_qa_super_admin@example.com",
    homeRoute: "/fr/admin",
    allowedApi: ["/api/me"],
    forbiddenApi: ["/api/teacher/students"],
  },
  {
    id: "teacher",
    email: "test_yema_qa_teacher@example.com",
    homeRoute: "/fr/teacher",
    allowedApi: ["/api/teacher/dashboard", "/api/teacher/classes", "/api/teacher/students"],
    forbiddenApi: ["/api/family/dashboard"],
  },
  {
    id: "coach",
    email: "test_yema_qa_coach@example.com",
    homeRoute: "/fr/coach/racines",
    allowedApi: ["/api/roots-coach/dashboard", "/api/roots-coach/circles"],
    forbiddenApi: ["/api/teacher/students"],
  },
  {
    id: "center_admin",
    email: "test_yema_qa_center_admin@example.com",
    homeRoute: "/fr/center",
    allowedApi: ["/api/me", "/api/center/dashboard"],
    forbiddenApi: ["/api/teacher/students", "/api/family/dashboard"],
  },
  {
    id: "student_monde",
    email: "test_yema_qa_student_monde@example.com",
    homeRoute: "/fr/dashboard",
    allowedApi: ["/api/me", "/api/me/monde-dashboard"],
    forbiddenApi: ["/api/teacher/students", "/api/family/dashboard"],
  },
  {
    id: "student_racines",
    email: "test_yema_qa_student_racines@example.com",
    homeRoute: "/fr/dashboard",
    allowedApi: ["/api/me"],
    forbiddenApi: ["/api/teacher/students", "/api/family/dashboard"],
  },
  {
    id: "family",
    email: "test_yema_qa_family@example.com",
    homeRoute: "/fr/family",
    allowedApi: ["/api/family/dashboard", "/api/family/children"],
    forbiddenApi: ["/api/teacher/students"],
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
  const home = await fetch(`http://${HOST}${persona.homeRoute}`, { headers: H, redirect: "manual" });
  if (home.status >= 400) return { ok: false, msg: `${label} home ${persona.homeRoute} → ${home.status}` };
  let anyAllowedOk = false;
  for (const path of persona.allowedApi) {
    const r = await fetch(`http://${HOST}${path}`, { headers: H });
    if (r.status === 200) anyAllowedOk = true;
  }
  if (!anyAllowedOk) return { ok: false, msg: `${label} aucune route autorisée n'a répondu 200` };
  for (const path of persona.forbiddenApi) {
    const r = await fetch(`http://${HOST}${path}`, { headers: H });
    if (r.status === 200) return { ok: false, msg: `${label} forbidden ${path} → 200 (isolation cassée)` };
  }
  return { ok: true, msg: `${label} OK · home ${home.status} · allowed ✓ · forbidden ✓` };
}

async function main() {
  console.log("[personas] STEP 1 · fixtures QA idempotentes");
  const fixturePrep = spawnSync("node", ["scripts/test-baseline/yema-qa-fixtures.mjs"], { stdio: "inherit", env: process.env });
  if (fixturePrep.error || fixturePrep.signal || fixturePrep.status !== 0) {
    const detail = fixturePrep.error?.message
      ?? (fixturePrep.signal ? `signal ${fixturePrep.signal}` : `exit ${fixturePrep.status ?? "unknown"}`);
    fail(1, `fixture provisioning failed · ${detail}`);
  }

  console.log(`[personas] STEP 2 · next start port ${PORT} (9 personas · workspaces P-1 ON)`);
  const hmacSecret = process.env.YEMA_CHILD_SESSION_SECRET
    ?? process.env.SUPABASE_JWT_SECRET
    ?? randomBytes(32).toString("base64");
  const server = spawn("npx", ["next", "start", "-p", PORT], {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      YEMA_DASHBOARD_REDESIGN_ENABLED: "true",
      YEMA_CHILD_SESSION_SECRET: hmacSecret,
      // Overrides P-1 persona-only · le wrapper général garde volontairement
      // Coach/Centre OFF pour ses tests Monde. Ici on teste leurs personas.
      YEMA_CENTER_REAL_DATA_ENABLED: "true",
      YEMA_CENTER_RLS_CONFIRMED: "true",
      YEMA_COACH_WORKSPACE_ENABLED: "true",
      YEMA_ROOTS_COACH_RLS_CONFIRMED: "true",
      YEMA_CIRCLE_ENABLED: "true",
    },
  });
  let ready = false;
  let serverOutput = "";
  const collectServerOutput = (b) => {
    serverOutput = `${serverOutput}${b.toString()}`.slice(-4_000);
  };
  server.stdout.on("data", (b) => {
    collectServerOutput(b);
    if (/Ready|ready in|Started/i.test(b.toString())) ready = true;
  });
  server.stderr.on("data", collectServerOutput);
  for (let i = 0; i < 30 && !ready; i++) await sleep(1000);
  if (!ready) {
    server.kill("SIGTERM");
    const detail = serverOutput.trim().replace(/\s+/g, " ").slice(-1_000);
    fail(2, `server not ready${detail ? ` · ${detail}` : ""}`);
  }

  // next start uses localhost as its canonical request origin. Keep the
  // synthetic browser Origin identical so the real CSRF guard is exercised.
  const HOST = `localhost:${PORT}`;
  let exitCode = 0;
  try {
    console.log("[personas] STEP 3 · check 7 personas adultes");
    for (const p of ADULTS) {
      const res = await checkPersona(HOST, p);
      if (res.ok) console.log(`  ✓ ${res.msg}`);
      else { console.error(`  ✗ ${res.msg}`); exitCode = 1; }
    }

    console.log("[personas] STEP 4 · Child Monde (Lina) · PIN + session + dashboard");
    const familyCookie = await loginCookie("test_yema_qa_family@example.com");
    const parentHeaders = { Cookie: familyCookie, Origin: `http://${HOST}`, Host: HOST, "Content-Type": "application/json" };
    const cs1 = await fetch(`http://${HOST}/api/child-session`, {
      method: "POST",
      headers: parentHeaders,
      body: JSON.stringify({ childProfileId: "test_yema_qa_child_family_monde", pin: "1234" }),
    });
    if (cs1.status !== 200) { console.error(`  ✗ child_monde login · ${cs1.status}`); exitCode = 1; }
    else {
      const childSetCookie = cs1.headers.get("set-cookie") ?? "";
      const childCookieMatch = childSetCookie.match(/yema_child_session=([^;]+)/);
      if (!childCookieMatch) { console.error("  ✗ yema_child_session cookie manquant"); exitCode = 1; }
      else {
        const childCookie = `${familyCookie}; yema_child_session=${childCookieMatch[1]}`;
        const childHeaders = { Cookie: childCookie, Origin: `http://${HOST}`, Host: HOST };
        const csGet = await fetch(`http://${HOST}/api/child-session`, { headers: childHeaders });
        const csBody = await csGet.json();
        const dashboard = await fetch(`http://${HOST}/fr/dashboard`, { headers: childHeaders, redirect: "manual" });
        if (!csBody?.active || csBody.childProfileId !== "test_yema_qa_child_family_monde") {
          console.error(`  ✗ child session GET · active=${csBody?.active}`);
          exitCode = 1;
        } else if (dashboard.status !== 200) {
          console.error(`  ✗ child_monde dashboard · ${dashboard.status}`);
          exitCode = 1;
        } else {
          console.log("  ✓ [child_monde] session HMAC active · dashboard 200");
        }
        await fetch(`http://${HOST}/api/child-session`, { method: "DELETE", headers: childHeaders });
      }
    }

    console.log("[personas] STEP 5 · Child Racines (Aicha) · PIN + session + dashboard");
    const cs2 = await fetch(`http://${HOST}/api/child-session`, {
      method: "POST",
      headers: parentHeaders,
      body: JSON.stringify({ childProfileId: "test_yema_qa_child_family_racines", pin: "5678" }),
    });
    if (cs2.status !== 200) { console.error(`  ✗ child_racines login · ${cs2.status}`); exitCode = 1; }
    else {
      const set2 = cs2.headers.get("set-cookie") ?? "";
      const m2 = set2.match(/yema_child_session=([^;]+)/);
      if (!m2) {
        console.error("  ✗ child_racines cookie manquant");
        exitCode = 1;
      } else {
        const cH = { Cookie: `${familyCookie}; yema_child_session=${m2[1]}`, Origin: `http://${HOST}`, Host: HOST };
        const dashboard = await fetch(`http://${HOST}/fr/dashboard`, { headers: cH, redirect: "manual" });
        if (dashboard.status !== 200) {
          console.error(`  ✗ child_racines dashboard · ${dashboard.status}`);
          exitCode = 1;
        } else {
          console.log("  ✓ [child_racines] session HMAC active · dashboard 200");
        }
        await fetch(`http://${HOST}/api/child-session`, { method: "DELETE", headers: cH });
      }
    }

    console.log("[personas] STEP 6 · Invalidation PIN active · rotation temporaire");
    const localDb = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }) });
    try {
      const familyUser = await localDb.user.findUnique({
        where: { email: "test_yema_qa_family@example.com" },
        select: { id: true },
      });
      if (!familyUser) throw new Error("family QA user absent");

      const qaPinAuditWhere = {
        actorUserId: familyUser.id,
        action: "CHILD_ACCESS_DENIED",
        targetType: "ChildProfile",
        targetId: "test_yema_qa_child_family_monde",
        scopeType: "child_session_pin",
        scopeId: "test_yema_qa_child_family_monde",
      };
      await localDb.auditEvent.deleteMany({ where: qaPinAuditWhere });

      const original = await localDb.childProfile.findUnique({
        where: { id: "test_yema_qa_child_family_monde" },
        select: { pinHash: true, pinUpdatedAt: true },
      });
      if (!original?.pinHash) throw new Error("original PIN absent");
      const newHash = await hashChildPin("9999");
      const newDate = new Date();
      await localDb.childProfile.update({
        where: { id: "test_yema_qa_child_family_monde" },
        data: { pinHash: newHash, pinUpdatedAt: newDate },
      });

      const oldPinAttempt = await fetch(`http://${HOST}/api/child-session`, {
        method: "POST",
        headers: parentHeaders,
        body: JSON.stringify({ childProfileId: "test_yema_qa_child_family_monde", pin: "1234" }),
      });
      if (oldPinAttempt.status === 200) {
        console.error("  ✗ ancien PIN accepté après rotation · invalidation cassée");
        exitCode = 1;
      } else if (oldPinAttempt.status === 429) {
        console.error("  ✗ rate-limit inattendu sur fixture nettoyée");
        exitCode = 1;
      } else {
        console.log(`  ✓ ancien PIN refusé (${oldPinAttempt.status}) · invalidation OK`);
      }

      const newPinAttempt = await fetch(`http://${HOST}/api/child-session`, {
        method: "POST",
        headers: parentHeaders,
        body: JSON.stringify({ childProfileId: "test_yema_qa_child_family_monde", pin: "9999" }),
      });
      if (newPinAttempt.status !== 200) {
        console.error(`  ✗ nouveau PIN refusé · ${newPinAttempt.status}`);
        exitCode = 1;
      } else {
        console.log("  ✓ nouveau PIN accepté · rotation fonctionnelle");
      }

      await localDb.childProfile.update({
        where: { id: "test_yema_qa_child_family_monde" },
        data: { pinHash: original.pinHash, pinUpdatedAt: original.pinUpdatedAt },
      });
      await localDb.auditEvent.deleteMany({ where: qaPinAuditWhere });

      const restoredCheck = await fetch(`http://${HOST}/api/child-session`, {
        method: "POST",
        headers: parentHeaders,
        body: JSON.stringify({ childProfileId: "test_yema_qa_child_family_monde", pin: "1234" }),
      });
      if (restoredCheck.status !== 200) {
        console.error(`  ✗ restauration PIN incorrecte · "1234" refusé (${restoredCheck.status})`);
        exitCode = 1;
      } else {
        console.log("  ✓ PIN original restauré · \"1234\" refonctionne");
        const restSet = restoredCheck.headers.get("set-cookie") ?? "";
        const rm = restSet.match(/yema_child_session=([^;]+)/);
        if (rm) {
          const rH = { Cookie: `${familyCookie}; yema_child_session=${rm[1]}`, Origin: `http://${HOST}`, Host: HOST };
          await fetch(`http://${HOST}/api/child-session`, { method: "DELETE", headers: rH });
        }
      }
    } finally {
      try { await localDb.$disconnect(); } catch {}
    }

    if (exitCode === 0) console.log("[personas] ALL OK · 9/9 personas verts");
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
