#!/usr/bin/env node
// Supplemental P-1 runtime assertion for the 7 adult personas.
// Every expected allowed API must answer 200; one healthy endpoint is not enough.

import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);
const PORT = process.env.YEMA_ADULT_PERSONAS_VERIFY_PORT || "3242";

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

function fail(message, code = 1) {
  console.error(`[adult-personas-verify] FAIL · ${message}`);
  process.exit(code);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl || !supabaseUrl.includes(P1_REF)) fail(`URL non-P1 · ${supabaseUrl}`);
for (const blockedRef of BLOCKED) {
  if (supabaseUrl.includes(blockedRef)) fail(`blocklisted ${blockedRef}`);
}
if (!process.env.P1_TEST_PASSWORD) fail("P1_TEST_PASSWORD absent", 2);
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) fail("NEXT_PUBLIC_SUPABASE_ANON_KEY absent", 2);

const supRef = new URL(supabaseUrl).host.split(".")[0];

async function loginCookie(email) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password: process.env.P1_TEST_PASSWORD }),
  });
  if (!response.ok) throw new Error(`${email} login → ${response.status}`);
  const session = await response.json();
  const payload = {
    access_token: session.access_token,
    token_type: session.token_type,
    expires_in: session.expires_in,
    expires_at: session.expires_at ?? (Math.floor(Date.now() / 1000) + session.expires_in),
    refresh_token: session.refresh_token,
    user: session.user,
  };
  return `sb-${supRef}-auth-token=base64-${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
}

async function verifyPersona(host, persona) {
  const cookie = await loginCookie(persona.email);
  const headers = { Cookie: cookie, Origin: `http://${host}`, Host: host };

  const home = await fetch(`http://${host}${persona.homeRoute}`, { headers, redirect: "manual" });
  if (home.status !== 200) throw new Error(`${persona.id} home ${persona.homeRoute} → ${home.status}`);

  for (const path of persona.allowedApi) {
    const response = await fetch(`http://${host}${path}`, { headers });
    if (response.status !== 200) throw new Error(`${persona.id} allowed ${path} → ${response.status}`);
  }

  for (const path of persona.forbiddenApi) {
    const response = await fetch(`http://${host}${path}`, { headers });
    if (response.status === 200) throw new Error(`${persona.id} forbidden ${path} → 200`);
  }

  console.log(`[adult-personas-verify] OK · ${persona.id} · all allowed ✓ · forbidden ✓`);
}

async function main() {
  const server = spawn("npx", ["next", "start", "-p", PORT], {
    stdio: ["ignore", "pipe", "inherit"],
    env: {
      ...process.env,
      YEMA_DASHBOARD_REDESIGN_ENABLED: "true",
      YEMA_CHILD_SESSION_SECRET: process.env.YEMA_CHILD_SESSION_SECRET
        ?? process.env.SUPABASE_JWT_SECRET
        ?? randomBytes(32).toString("base64"),
      YEMA_CENTER_REAL_DATA_ENABLED: "true",
      YEMA_CENTER_RLS_CONFIRMED: "true",
      YEMA_COACH_WORKSPACE_ENABLED: "true",
      YEMA_ROOTS_COACH_RLS_CONFIRMED: "true",
      YEMA_CIRCLE_ENABLED: "true",
    },
  });

  let ready = false;
  server.stdout.on("data", (buffer) => {
    if (/Ready|ready in|Started/i.test(buffer.toString())) ready = true;
  });

  try {
    for (let i = 0; i < 30 && !ready && server.exitCode == null; i++) await sleep(1000);
    if (!ready) throw new Error(`server not ready${server.exitCode == null ? "" : ` · exit ${server.exitCode}`}`);

    const host = `127.0.0.1:${PORT}`;
    for (const persona of ADULTS) await verifyPersona(host, persona);
    console.log("[adult-personas-verify] ALL OK · 7/7 adult personas require every allowed route");
  } finally {
    if (server.exitCode == null) server.kill("SIGTERM");
    await sleep(500);
  }
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
