#!/usr/bin/env node
// Align the canonical P-1 adult QA personas with P1_TEST_PASSWORD.
//
// Safety properties:
// - refuses every target except the dedicated P-1 project via _common.mjs;
// - only touches the exact TEST_YEMA_QA adult fixture emails below;
// - never logs the password;
// - preflights every account before the first password mutation;
// - attempts every exact account even if one rotation fails, then retries only
//   transient failures once so a single error cannot leave later personas stale;
// - verifies every rotated credential with a real password sign-in before exit.

import { createClient } from "@supabase/supabase-js";
import { assertNonProduction, getTestPassword } from "./_common.mjs";

assertNonProduction();

const password = getTestPassword();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!anonKey) {
  throw new Error("REFUSED: NEXT_PUBLIC_SUPABASE_ANON_KEY missing; credential verification is mandatory.");
}

const admin = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const publicAuth = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const EXPECTED_EMAILS = [
  "test_yema_qa_super_admin@example.com",
  "test_yema_qa_teacher@example.com",
  "test_yema_qa_coach@example.com",
  "test_yema_qa_center_admin@example.com",
  "test_yema_qa_student_monde@example.com",
  "test_yema_qa_student_racines@example.com",
  "test_yema_qa_family@example.com",
];

async function listExpectedUsers() {
  const wanted = new Set(EXPECTED_EMAILS);
  const found = new Map();
  let page = 1;

  while (found.size < wanted.size) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);

    for (const user of data.users ?? []) {
      const email = user.email?.toLowerCase();
      if (email && wanted.has(email)) found.set(email, user);
    }

    if (!data.users?.length || data.users.length < 200) break;
    page += 1;
  }

  return found;
}

function preflightUsers(users) {
  const missing = EXPECTED_EMAILS.filter((email) => !users.has(email));
  if (missing.length) {
    throw new Error(`REFUSED: missing canonical QA users after fixture provisioning: ${missing.join(", ")}`);
  }

  for (const email of EXPECTED_EMAILS) {
    const fixtureMarker = users.get(email)?.user_metadata?.fixture;
    if (fixtureMarker !== "TEST_YEMA_QA") {
      throw new Error(`REFUSED: ${email} lacks TEST_YEMA_QA fixture marker.`);
    }
  }
}

async function rotateCredential(email, user) {
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });
  return error ?? null;
}

async function rotateAllWithRetry(users) {
  let failedEmails = [];

  for (const email of EXPECTED_EMAILS) {
    const error = await rotateCredential(email, users.get(email));
    if (error) failedEmails.push(email);
  }

  if (!failedEmails.length) return;

  console.warn(`[qa-passwords] RETRY · ${failedEmails.length} credential rotation(s) failed transiently`);
  const retryFailures = [];
  for (const email of failedEmails) {
    const error = await rotateCredential(email, users.get(email));
    if (error) retryFailures.push(email);
  }

  failedEmails = retryFailures;
  if (failedEmails.length) {
    throw new Error(`credential rotation failed after retry for: ${failedEmails.join(", ")}`);
  }
}

async function main() {
  console.log("[qa-passwords] PREP · locating canonical P-1 adult personas");
  const users = await listExpectedUsers();

  // Fail before the first mutation if any identity/fixture invariant is wrong.
  preflightUsers(users);

  console.log(`[qa-passwords] ROTATE · ${EXPECTED_EMAILS.length} exact P-1 QA accounts`);
  await rotateAllWithRetry(users);

  console.log("[qa-passwords] VERIFY · real password login for every adult persona");
  for (const email of EXPECTED_EMAILS) {
    const { data, error } = await publicAuth.auth.signInWithPassword({ email, password });
    if (error || !data.user || !data.session) {
      throw new Error(`credential verification failed for ${email}: ${error?.message ?? "missing session"}`);
    }
    await publicAuth.auth.signOut({ scope: "local" });
  }

  console.log(`[qa-passwords] OK · ${EXPECTED_EMAILS.length}/${EXPECTED_EMAILS.length} QA credentials aligned and verified`);
}

main().catch((error) => {
  console.error(`[qa-passwords] FAIL · ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
