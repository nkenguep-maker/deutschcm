#!/usr/bin/env node
// Supplemental P-1 runtime assertion for the Child Racines persona.
// This deliberately verifies the child-session identity, not only a 200 dashboard.

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);
const PORT = process.env.YEMA_CHILD_RACINES_VERIFY_PORT || "3241";
const CHILD_ID = "test_yema_qa_child_family_racines";
const FAMILY_EMAIL = "test_yema_qa_family@example.com";

function fail(message, code = 1) {
  console.error(`[child-racines-verify] FAIL · ${message}`);
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

async function loginCookie() {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: FAMILY_EMAIL, password: process.env.P1_TEST_PASSWORD }),
  });
  if (!response.ok) throw new Error(`family login → ${response.status}`);
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
  server.stdout.on("data", (buffer) => {
    if (/Ready|ready in|Started/i.test(buffer.toString())) ready = true;
  });

  try {
    for (let i = 0; i < 30 && !ready && server.exitCode == null; i++) await sleep(1000);
    if (!ready) throw new Error(`server not ready${server.exitCode == null ? "" : ` · exit ${server.exitCode}`}`);

    const host = `127.0.0.1:${PORT}`;
    const familyCookie = await loginCookie();
    const parentHeaders = {
      Cookie: familyCookie,
      Origin: `http://${host}`,
      Host: host,
      "Content-Type": "application/json",
    };

    const create = await fetch(`http://${host}/api/child-session`, {
      method: "POST",
      headers: parentHeaders,
      body: JSON.stringify({ childProfileId: CHILD_ID, pin: "5678" }),
    });
    if (create.status !== 200) throw new Error(`session create → ${create.status}`);

    const setCookie = create.headers.get("set-cookie") ?? "";
    const match = setCookie.match(/yema_child_session=([^;]+)/);
    if (!match) throw new Error("yema_child_session cookie absent");

    const childHeaders = {
      Cookie: `${familyCookie}; yema_child_session=${match[1]}`,
      Origin: `http://${host}`,
      Host: host,
    };

    const sessionResponse = await fetch(`http://${host}/api/child-session`, { headers: childHeaders });
    if (sessionResponse.status !== 200) throw new Error(`session GET → ${sessionResponse.status}`);
    const sessionBody = await sessionResponse.json();
    if (!sessionBody?.active || sessionBody.childProfileId !== CHILD_ID) {
      throw new Error(`wrong child session · active=${sessionBody?.active} child=${sessionBody?.childProfileId ?? "missing"}`);
    }

    const dashboard = await fetch(`http://${host}/fr/dashboard`, { headers: childHeaders, redirect: "manual" });
    if (dashboard.status !== 200) throw new Error(`dashboard → ${dashboard.status}`);

    const clear = await fetch(`http://${host}/api/child-session`, { method: "DELETE", headers: childHeaders });
    if (clear.status !== 200) throw new Error(`session DELETE → ${clear.status}`);

    console.log(`[child-racines-verify] OK · ${CHILD_ID} active · dashboard 200 · session cleared`);
  } finally {
    if (server.exitCode == null) server.kill("SIGTERM");
    await sleep(500);
  }
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
