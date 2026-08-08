#!/usr/bin/env node
// Strict persona home-route gate for P-1.
// A persona home is valid only when the canonical route itself returns 200.
// Redirects (3xx) are failures: they usually mean the active space/persona
// resolved to another workspace, which is exactly the regression this gate
// exists to catch.

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);
const PORT = process.env.YEMA_PERSONA_HOME_PORT || "3241";
const PASSWORD = process.env.P1_TEST_PASSWORD;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function fail(step, message, code = 1) {
  console.error(`[persona-home] STEP ${step} FAIL · ${message}`);
  process.exit(code);
}

if (!url.includes(P1_REF)) fail(0, "URL non-P1", 2);
for (const ref of BLOCKED) if (url.includes(ref)) fail(0, `URL blocklisted · ${ref}`, 2);
if (!PASSWORD) fail(0, "P1_TEST_PASSWORD absent", 2);
if (!anon) fail(0, "NEXT_PUBLIC_SUPABASE_ANON_KEY absent", 2);

const supRef = new URL(url).host.split(".")[0];
const ADULTS = [
  ["super_admin", "test_yema_qa_super_admin@example.com", "/fr/admin"],
  ["teacher", "test_yema_qa_teacher@example.com", "/fr/teacher"],
  ["coach", "test_yema_qa_coach@example.com", "/fr/coach/racines"],
  ["center_admin", "test_yema_qa_center_admin@example.com", "/fr/center"],
  ["student_monde", "test_yema_qa_student_monde@example.com", "/fr/dashboard"],
  ["student_racines", "test_yema_qa_student_racines@example.com", "/fr/dashboard"],
  ["family", "test_yema_qa_family@example.com", "/fr/family"],
];

async function loginCookie(email) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!response.ok) throw new Error(`login ${email} → ${response.status}`);
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

async function main() {
  const server = spawn("npx", ["next", "start", "-p", PORT], {
    stdio: ["ignore", "pipe", "inherit"],
    env: {
      ...process.env,
      YEMA_DASHBOARD_REDESIGN_ENABLED: "true",
      YEMA_CENTER_REAL_DATA_ENABLED: "true",
      YEMA_CENTER_RLS_CONFIRMED: "true",
      YEMA_COACH_WORKSPACE_ENABLED: "true",
      YEMA_ROOTS_COACH_RLS_CONFIRMED: "true",
      YEMA_CIRCLE_ENABLED: "true",
    },
  });

  let ready = false;
  server.stdout?.on("data", (buffer) => {
    if (/Ready|ready in|Started/i.test(buffer.toString())) ready = true;
  });
  for (let i = 0; i < 30 && !ready; i += 1) await sleep(1000);
  if (!ready) {
    server.kill("SIGTERM");
    fail(1, "server not ready");
  }

  const host = `127.0.0.1:${PORT}`;
  let failed = false;
  try {
    for (const [id, email, route] of ADULTS) {
      const cookie = await loginCookie(email);
      const response = await fetch(`http://${host}${route}`, {
        headers: { Cookie: cookie, Origin: `http://${host}`, Host: host },
        redirect: "manual",
      });
      if (response.status !== 200) {
        const location = response.headers.get("location");
        console.error(`  ✗ ${id} · ${route} → ${response.status}${location ? ` · location=${location}` : ""}`);
        failed = true;
      } else {
        console.log(`  ✓ ${id} · ${route} → 200`);
      }
    }
  } finally {
    server.kill("SIGTERM");
    await sleep(500);
  }

  if (failed) fail(2, "une ou plusieurs routes persona redirigent ou échouent");
  console.log("[persona-home] ALL GREEN · canonical persona homes return 200");
}

main().catch((error) => fail("?", error.message));
