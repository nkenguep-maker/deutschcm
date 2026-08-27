#!/usr/bin/env node
// Authenticated persona verification against an already deployed Vercel Preview.
// It is P-1-only and deliberately uses real Supabase password sessions.

import { createClient } from "@supabase/supabase-js";
import { assertNonProduction, getTestPassword } from "./test-baseline/_common.mjs";

const REQUEST_TIMEOUT_MS = 20_000;
const previewOrigin = process.argv[2];

function fail(message) {
  console.error(`[preview-personas] FAIL · ${message}`);
  process.exit(1);
}

function parsePreviewOrigin(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".vercel.app")) {
      throw new Error("origin must be an https Vercel Preview URL");
    }
    return url.origin;
  } catch (error) {
    fail(error.message);
  }
}

assertNonProduction();
const origin = parsePreviewOrigin(previewOrigin);
const password = getTestPassword();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseRef = new URL(supabaseUrl).hostname.split(".")[0];
const auth = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ADULTS = [
  { id: "super_admin", email: "test_yema_qa_super_admin@example.com", home: "/fr/admin", allowed: ["/api/me"], forbidden: ["/api/teacher/students"] },
  { id: "teacher", email: "test_yema_qa_teacher@example.com", home: "/fr/teacher", allowed: ["/api/teacher/dashboard", "/api/teacher/classes", "/api/teacher/students"], forbidden: ["/api/family/dashboard"] },
  { id: "coach", email: "test_yema_qa_coach@example.com", home: "/fr/coach/racines", allowed: ["/api/roots-coach/dashboard", "/api/roots-coach/circles"], forbidden: ["/api/teacher/students"] },
  { id: "center_admin", email: "test_yema_qa_center_admin@example.com", home: "/fr/center", allowed: ["/api/me", "/api/center/dashboard"], forbidden: ["/api/teacher/students", "/api/family/dashboard"] },
  { id: "student_monde", email: "test_yema_qa_student_monde@example.com", home: "/fr/dashboard", allowed: ["/api/me", "/api/me/monde-dashboard"], forbidden: ["/api/teacher/students", "/api/family/dashboard"] },
  { id: "student_racines", email: "test_yema_qa_student_racines@example.com", home: "/fr/dashboard", allowed: ["/api/me"], forbidden: ["/api/teacher/students", "/api/family/dashboard"] },
  { id: "family", email: "test_yema_qa_family@example.com", home: "/fr/family", allowed: ["/api/family/dashboard", "/api/family/children"], forbidden: ["/api/teacher/students"] },
];

function request(path, options = {}) {
  return fetch(`${origin}${path}`, {
    ...options,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

async function signInCookie(email) {
  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`${email}: ${error?.message ?? "session missing"}`);
  const payload = {
    access_token: data.session.access_token,
    token_type: data.session.token_type,
    expires_in: data.session.expires_in,
    expires_at: data.session.expires_at,
    refresh_token: data.session.refresh_token,
    user: data.session.user,
  };
  return `sb-${supabaseRef}-auth-token=base64-${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
}

function headers(cookie, json = false) {
  return {
    Cookie: cookie,
    Origin: origin,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

async function verifyAdult(persona) {
  const cookie = await signInCookie(persona.email);
  const home = await request(persona.home, { headers: headers(cookie), redirect: "manual" });
  if (home.status >= 400) throw new Error(`${persona.id}: home ${home.status}`);

  let allowed = false;
  for (const path of persona.allowed) {
    if ((await request(path, { headers: headers(cookie) })).status === 200) allowed = true;
  }
  if (!allowed) throw new Error(`${persona.id}: no allowed route returned 200`);

  for (const path of persona.forbidden) {
    if ((await request(path, { headers: headers(cookie) })).status === 200) {
      throw new Error(`${persona.id}: forbidden ${path} returned 200`);
    }
  }
  console.log(`[preview-personas] OK · ${persona.id}`);
}

async function verifyChild(id, pin) {
  const parentCookie = await signInCookie("test_yema_qa_family@example.com");
  const login = await request("/api/child-session", {
    method: "POST",
    headers: headers(parentCookie, true),
    body: JSON.stringify({ childProfileId: id, pin }),
  });
  if (login.status !== 200) throw new Error(`${id}: PIN login ${login.status}`);
  const match = (login.headers.get("set-cookie") ?? "").match(/yema_child_session=([^;]+)/);
  if (!match) throw new Error(`${id}: child session cookie missing`);

  const childCookie = `${parentCookie}; yema_child_session=${match[1]}`;
  const session = await request("/api/child-session", { headers: headers(childCookie) });
  const body = await session.json();
  const dashboard = await request("/fr/dashboard", { headers: headers(childCookie), redirect: "manual" });
  await request("/api/child-session", { method: "DELETE", headers: headers(childCookie) });

  if (!body?.active || body.childProfileId !== id || dashboard.status !== 200) {
    throw new Error(`${id}: session/dashboard invalid`);
  }
  console.log(`[preview-personas] OK · ${id}`);
}

async function main() {
  for (const persona of ADULTS) await verifyAdult(persona);
  await verifyChild("test_yema_qa_child_family_monde", "1234");
  await verifyChild("test_yema_qa_child_family_racines", "5678");
  console.log("[preview-personas] OK · 9/9 real P-1 personas verified against Preview");
}

main().catch((error) => fail(error.message));
