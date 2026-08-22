#!/usr/bin/env node

// Usage: npm run test:open-beta-signup:p1 -- --base-url <preview> --inbox <address>

import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const FORBIDDEN_REFS = [
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
];
const PRODUCTION_HOSTS = new Set(["deutschcm.vercel.app"]);

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function option(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1]) throw new Error(`${name} is required`);
  return process.argv[index + 1];
}

function assertP1Environment() {
  if (process.env.P1_BASELINE_CONFIRMED_NOT_PRODUCTION !== "true") {
    throw new Error("P1_BASELINE_CONFIRMED_NOT_PRODUCTION must be true");
  }
  const supabaseUrl = new URL(required("NEXT_PUBLIC_SUPABASE_URL"));
  if (supabaseUrl.protocol !== "https:" || supabaseUrl.hostname !== `${P1_REF}.supabase.co`) {
    throw new Error("Supabase URL is not the canonical P-1 project");
  }
  for (const ref of FORBIDDEN_REFS) {
    if (supabaseUrl.href.includes(ref)) throw new Error("forbidden Supabase ref detected");
  }
  return supabaseUrl.origin;
}

function assertPreviewTarget() {
  const target = new URL(option("--base-url"));
  if (target.protocol !== "https:" || !target.hostname.endsWith(".vercel.app")) {
    throw new Error("PLAYWRIGHT_BASE_URL must be an HTTPS Vercel Preview");
  }
  if (PRODUCTION_HOSTS.has(target.hostname)) {
    throw new Error("refusing the Production hostname");
  }
  return target.origin;
}

function classifyUiAlert(message) {
  if (message.includes("Trop de tentatives")) return "rate_limited";
  if (message.includes("Connexion impossible")) return "network";
  if (message.includes("trop de temps")) return "timeout";
  return "generic";
}

function createSignupAlias(baseEmail, runId) {
  const match = baseEmail.trim().toLowerCase().match(/^([^@+]+)(?:\+[^@]*)?@([^@]+)$/);
  if (!match) throw new Error("--inbox must be a valid email address");
  return `${match[1]}+open-beta-smoke-${runId}@${match[2]}`;
}

async function loadedBundleEvidence(page) {
  const urls = await page.evaluate(() =>
    performance.getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((name) => /\.(?:js|mjs)(?:\?|$)/.test(name)),
  );
  let containsP1Ref = false;
  let containsSupabaseHost = false;
  for (const url of urls) {
    const response = await page.request.get(url);
    if (!response.ok()) continue;
    const body = await response.text();
    containsP1Ref ||= body.includes(P1_REF);
    containsSupabaseHost ||= body.includes(".supabase.co");
  }
  return { containsP1Ref, containsSupabaseHost };
}

async function findAuthUserId(admin, email) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === email)?.id ?? null;
}

async function main() {
  const supabaseUrl = assertP1Environment();
  const previewOrigin = assertPreviewTarget();
  const serviceRole = required("SUPABASE_SERVICE_ROLE_KEY");
  const password = required("P1_TEST_PASSWORD");
  const runId = Date.now().toString(36);
  const email = createSignupAlias(option("--inbox"), runId);
  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let browser;
  let authUserId = null;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    let signupRequestP1Verified = false;
    let blockedSignupTarget = false;
    const supabaseRequestPaths = new Set();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/*", async (route) => {
      const target = new URL(route.request().url());
      if (target.hostname.endsWith(".supabase.co")) supabaseRequestPaths.add(target.pathname);
      if (target.pathname === "/auth/v1/signup") {
        if (target.hostname !== `${P1_REF}.supabase.co`) {
          blockedSignupTarget = true;
          await route.abort();
          return;
        }
        signupRequestP1Verified = true;
      }
      await route.continue();
    });

    const response = await page.goto(`${previewOrigin}/fr/register`, {
      waitUntil: "load",
      timeout: 30_000,
    });
    if (!response || response.status() >= 400) throw new Error("registration page did not load");

    await page.getByLabel("Prénom", { exact: true }).fill("Beta");
    await page.getByLabel("Nom", { exact: true }).fill("Smoke");
    await page.getByLabel("E-mail").fill(email);
    await page.locator('input[autocomplete="new-password"]').fill(password);
    await page.getByRole("button", { name: "Créer mon compte" }).click();

    const success = page.getByRole("heading", { name: "Vérifiez votre boîte." });
    const alert = page.getByRole("alert");
    const outcome = await Promise.race([
      success.waitFor({ state: "visible", timeout: 30_000 }).then(() => "success"),
      alert.waitFor({ state: "visible", timeout: 30_000 }).then(() => "error"),
    ]);
    const alertKind = outcome === "error"
      ? classifyUiAlert((await alert.textContent()) ?? "")
      : "none";
    const bundleEvidence = await loadedBundleEvidence(page);
    if (blockedSignupTarget) throw new Error("signup request targeted a non-P-1 project");
    if (!signupRequestP1Verified) {
      throw new Error(
        `signup request missing · ui=${alertKind} · pageErrors=${errors.length} · supabasePaths=${[...supabaseRequestPaths].join(",") || "none"} · bundleP1=${bundleEvidence.containsP1Ref} · bundleSupabase=${bundleEvidence.containsSupabaseHost}`,
      );
    }
    if (outcome !== "success") throw new Error(`registration UI rejected the P-1 signup · ui=${alertKind}`);

    const identity = await page.evaluate(() => {
      const raw = localStorage.getItem("yema.preconfirmation.identity");
      return raw ? JSON.parse(raw) : null;
    });
    if (!identity || typeof identity.authUserId !== "string") {
      throw new Error("registration did not bind a preconfirmation identity");
    }
    authUserId = identity.authUserId;

    await page.getByRole("link", { name: "Préparer mon parcours" }).click();
    await page.waitForURL(/\/fr\/pre-onboarding(?:\?|$)/, { timeout: 10_000 });
    await page.getByRole("button", { name: /Une langue du monde/ }).click();
    await page.getByRole("button", { name: /Allemand/ }).click();
    await page.getByRole("button", { name: /Voyager/ }).click();
    await page.waitForURL(/\/fr\/pre-onboarding\/complete(?:\?|$)/, { timeout: 10_000 });

    const draft = await page.evaluate(() => {
      const raw = localStorage.getItem("yema.preconfirmation.journey");
      return raw ? JSON.parse(raw) : null;
    });
    if (draft?.authUserId !== authUserId || draft?.persona !== "student_monde") {
      throw new Error("preconfirmation journey is not bound to the signup identity");
    }
    if (errors.length > 0) throw new Error("browser page errors occurred during signup");

    console.log("[open-beta-signup:p1] OK · signup accepted and preconfirmation journey bound");
  } finally {
    await browser?.close();
    authUserId ??= await findAuthUserId(admin, email).catch(() => null);
    if (authUserId) {
      const { error } = await admin.auth.admin.deleteUser(authUserId);
      if (error) throw error;
    }
    const residual = await findAuthUserId(admin, email);
    if (residual) throw new Error("temporary P-1 Auth user cleanup failed");
    console.log("[open-beta-signup:p1] CLEANUP · no temporary Auth user remains");
  }
}

main().catch((error) => {
  console.error(`[open-beta-signup:p1] FAIL · ${error instanceof Error ? error.message : "unknown error"}`);
  process.exit(1);
});
