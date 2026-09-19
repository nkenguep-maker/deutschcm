#!/usr/bin/env node
// P0.12 · Fresh-account confirmation smoke on canonical P-1 + Vercel Preview.
// Creates one temporary P-1 Auth user, follows the real confirmation link,
// verifies callback/session/reconciliation, then cleans both identities.
//
// Usage:
//   npm run test:auth-confirmation:p1 -- --base-url https://<preview>.vercel.app

import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import pg from "pg";

const { Client } = pg;
const P1_REF = "kzzagbojjkivdzzcrmxn";
const FORBIDDEN_REFS = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);
const PRODUCTION_HOSTS = new Set(["deutschcm.vercel.app"]);

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(name + " is required");
  return value;
}

function option(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1]) throw new Error(name + " is required");
  return process.argv[index + 1];
}

function assertP1() {
  if (process.env.P1_BASELINE_CONFIRMED_NOT_PRODUCTION !== "true") {
    throw new Error("P1_BASELINE_CONFIRMED_NOT_PRODUCTION must be true");
  }
  const supabaseUrl = new URL(required("NEXT_PUBLIC_SUPABASE_URL"));
  if (supabaseUrl.protocol !== "https:" || supabaseUrl.hostname !== P1_REF + ".supabase.co") {
    throw new Error("Supabase URL is not canonical P-1");
  }
  for (const ref of FORBIDDEN_REFS) {
    if (supabaseUrl.href.includes(ref)) throw new Error("forbidden Supabase ref detected");
  }
  return supabaseUrl.origin;
}

function assertPreview() {
  const target = new URL(option("--base-url"));
  if (
    target.protocol !== "https:" ||
    !target.hostname.endsWith(".vercel.app") ||
    PRODUCTION_HOSTS.has(target.hostname)
  ) {
    throw new Error("base URL must be a non-Production HTTPS Vercel Preview");
  }
  return target.origin;
}

async function main() {
  const supabaseUrl = assertP1();
  const previewOrigin = assertPreview();
  const serviceRole = required("SUPABASE_SERVICE_ROLE_KEY");
  const password = required("P1_TEST_PASSWORD");
  const databaseUrl = required("DATABASE_URL");

  const runId = Date.now().toString(36);
  const email = "test_auth_confirm_" + runId + "@yema.test";
  const fullName = "TEST_AUTH_CONFIRM_" + runId;

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const db = new Client({ connectionString: databaseUrl });

  let browser;
  let authUserId = null;
  let dbConnected = false;

  try {
    await db.connect();
    dbConnected = true;

    const redirectTo =
      previewOrigin + "/auth/callback?next=" + encodeURIComponent("/fr/onboarding/persona");

    const { data, error } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: "TEST",
          last_name: "AUTH_CONFIRM_" + runId,
          universe: "monde",
          requested_persona: "student_monde",
        },
        redirectTo,
      },
    });

    if (error) throw error;
    const actionLink = data?.properties?.action_link;
    authUserId = data?.user?.id ?? null;
    if (!actionLink || !authUserId) {
      throw new Error("generateLink did not return action_link + user id");
    }

    const before = await db.query(
      'select id from public.users where "supabaseId" = $1',
      [authUserId],
    );
    if (before.rowCount !== 0) {
      throw new Error("public.users row existed before confirmation callback");
    }

    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();

    const response = await page.goto(actionLink, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    if (!response) throw new Error("confirmation navigation returned no response");

    await page.waitForURL(
      (url) => url.origin === previewOrigin && !url.pathname.includes("/auth/callback"),
      { timeout: 30000 },
    );

    const finalUrl = new URL(page.url());
    if (finalUrl.origin !== previewOrigin) {
      throw new Error("confirmation escaped the requested Preview origin");
    }
    if (finalUrl.pathname !== "/fr/onboarding/persona") {
      throw new Error("unexpected post-confirmation route: " + finalUrl.pathname);
    }

    const me = await page.request.get(previewOrigin + "/api/me");
    if (!me.ok()) {
      throw new Error("authenticated /api/me failed with HTTP " + me.status());
    }

    const { data: authLookup, error: lookupError } =
      await admin.auth.admin.getUserById(authUserId);
    if (lookupError) throw lookupError;
    if (!authLookup.user?.email_confirmed_at) {
      throw new Error("Auth user is still unconfirmed after confirmation link");
    }

    const reconciled = await db.query(
      'select id, email, "supabaseId" from public.users where "supabaseId" = $1',
      [authUserId],
    );
    if (reconciled.rowCount !== 1 || reconciled.rows[0].email !== email) {
      throw new Error("confirmation callback did not reconcile exactly one app user");
    }

    console.log(
      "[auth-confirmation:p1] OK · email confirmed · callback session valid · app user reconciled",
    );
  } finally {
    await browser?.close();

    if (dbConnected && authUserId) {
      await db.query('delete from public.users where "supabaseId" = $1', [authUserId]);
    }

    if (authUserId) {
      const { error } = await admin.auth.admin.deleteUser(authUserId);
      if (error) throw error;
    }

    if (dbConnected) {
      if (authUserId) {
        const residual = await db.query(
          'select count(*)::int as count from public.users where "supabaseId" = $1',
          [authUserId],
        );
        if (Number(residual.rows[0]?.count ?? 0) !== 0) {
          throw new Error("temporary public.users cleanup failed");
        }
      }
      await db.end();
    }

    if (authUserId) {
      const { data } = await admin.auth.admin.getUserById(authUserId);
      if (data?.user) throw new Error("temporary P-1 Auth cleanup failed");
    }

    console.log("[auth-confirmation:p1] CLEANUP · no temporary identity remains");
  }
}

main().catch((error) => {
  console.error(
    "[auth-confirmation:p1] FAIL · " +
      (error instanceof Error ? error.message : "unknown error"),
  );
  process.exit(1);
});
