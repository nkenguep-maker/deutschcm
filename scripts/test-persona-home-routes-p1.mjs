#!/usr/bin/env node
// Strict persona home-route gate for P-1.
// A persona home is valid only when the canonical route itself returns 200.
// Redirects (3xx) are failures: they usually mean the active space/persona
// resolved to another workspace, which is exactly the regression this gate
// exists to catch. Dashboard personas must additionally expose the resolved
// universe marker so Monde and Racines cannot false-green on /dashboard.

import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
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
  ["super_admin", "test_yema_qa_super_admin@example.com", "/admin", null],
  ["teacher", "test_yema_qa_teacher@example.com", "/teacher", null],
  ["coach", "test_yema_qa_coach@example.com", "/coach/racines", null],
  ["center_admin", "test_yema_qa_center_admin@example.com", "/center", null],
  ["student_monde", "test_yema_qa_student_monde@example.com", "/dashboard", "student_monde"],
  ["student_racines", "test_yema_qa_student_racines@example.com", "/dashboard", "student_racines"],
  ["family", "test_yema_qa_family@example.com", "/family", null],
];
const CHILDREN = [
  ["child_monde", "test_yema_qa_child_family_monde", "1234", "child_monde"],
  ["child_racines", "test_yema_qa_child_family_racines", "5678", "child_racines"],
];
const LOCALES = ["fr", "en"];

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

async function assertDashboardPersona(host, cookie, id, locale, expectedPersona) {
  const route = `/${locale}/dashboard`;
  const response = await fetch(`http://${host}${route}`, {
    headers: { Cookie: cookie, Origin: `http://${host}`, Host: host },
    redirect: "manual",
  });
  if (response.status !== 200) {
    const location = response.headers.get("location");
    console.error(`  ✗ ${id} · ${route} → ${response.status}${location ? ` · location=${location}` : ""}`);
    return false;
  }
  const html = await response.text();
  const marker = `data-yema-persona=\"${expectedPersona}\"`;
  if (!html.includes(marker)) {
    console.error(`  ✗ ${id} · ${route} → 200 mais marker ${expectedPersona} absent`);
    return false;
  }
  console.log(`  ✓ ${id} · ${route} → 200 · ${expectedPersona}`);
  return true;
}

async function main() {
  const hmacSecret = process.env.YEMA_CHILD_SESSION_SECRET
    ?? process.env.SUPABASE_JWT_SECRET
    ?? randomBytes(32).toString("base64");
  const server = spawn("npx", ["next", "start", "-p", PORT], {
    stdio: ["ignore", "pipe", "inherit"],
    env: {
      ...process.env,
      YEMA_CHILD_SESSION_SECRET: hmacSecret,
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
    for (const [id, email, routeSuffix, expectedPersona] of ADULTS) {
      const cookie = await loginCookie(email);
      for (const locale of LOCALES) {
        if (expectedPersona) {
          if (!(await assertDashboardPersona(host, cookie, id, locale, expectedPersona))) failed = true;
          continue;
        }
        const route = `/${locale}${routeSuffix}`;
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
    }

    const familyCookie = await loginCookie("test_yema_qa_family@example.com");
    const parentHeaders = {
      Cookie: familyCookie,
      Origin: `http://${host}`,
      Host: host,
      "Content-Type": "application/json",
    };
    for (const [id, childProfileId, pin, expectedPersona] of CHILDREN) {
      const login = await fetch(`http://${host}/api/child-session`, {
        method: "POST",
        headers: parentHeaders,
        body: JSON.stringify({ childProfileId, pin }),
      });
      if (login.status !== 200) {
        console.error(`  ✗ ${id} · child-session → ${login.status}`);
        failed = true;
        continue;
      }
      const setCookie = login.headers.get("set-cookie") ?? "";
      const match = setCookie.match(/yema_child_session=([^;]+)/);
      if (!match) {
        console.error(`  ✗ ${id} · yema_child_session cookie manquant`);
        failed = true;
        continue;
      }
      const childCookie = `${familyCookie}; yema_child_session=${match[1]}`;
      for (const locale of LOCALES) {
        if (!(await assertDashboardPersona(host, childCookie, id, locale, expectedPersona))) failed = true;
      }
      await fetch(`http://${host}/api/child-session`, {
        method: "DELETE",
        headers: { Cookie: childCookie, Origin: `http://${host}`, Host: host },
      });
    }
  } finally {
    server.kill("SIGTERM");
    await sleep(500);
  }

  if (failed) fail(2, "une ou plusieurs routes persona redirigent, échouent ou résolvent le mauvais univers");
  console.log("[persona-home] ALL GREEN · 9 personas FR/EN and dashboard universes are canonical");
}

main().catch((error) => fail("?", error.message));
