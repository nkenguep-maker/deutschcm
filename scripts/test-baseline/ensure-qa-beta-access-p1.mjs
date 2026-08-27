#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { assertNonProduction } from "./_common.mjs";

assertNonProduction();

const P1_REF = "kzzagbojjkivdzzcrmxn";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!url.includes(P1_REF)) {
  throw new Error("REFUSED · QA beta admission may run only on P-1");
}
if (!serviceRole) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for P-1 QA admission");
}

const QA_EMAILS = [
  "test_yema_qa_super_admin@example.com",
  "test_yema_qa_teacher@example.com",
  "test_yema_qa_coach@example.com",
  "test_yema_qa_center_admin@example.com",
  "test_yema_qa_student_monde@example.com",
  "test_yema_qa_student_racines@example.com",
  "test_yema_qa_family@example.com",
];

const admin = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findQaUsers() {
  const expected = new Set(QA_EMAILS);
  const found = new Map();
  let page = 1;
  while (found.size < expected.size) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const user of data.users) {
      const email = user.email?.toLowerCase();
      if (email && expected.has(email)) found.set(email, user);
    }
    if (data.users.length < 200) break;
    page += 1;
  }
  return found;
}

const users = await findQaUsers();
const missing = QA_EMAILS.filter((email) => !users.has(email));
if (missing.length > 0) {
  throw new Error(`P-1 QA users missing: ${missing.join(", ")}`);
}

for (const email of QA_EMAILS) {
  const user = users.get(email);
  const existing = user.app_metadata ?? {};
  const roles = Array.isArray(existing.roles) ? existing.roles : [];
  const activeSpace = typeof existing.active_space === "string" ? existing.active_space : null;
  if (roles.length === 0 || !activeSpace) {
    throw new Error(`P-1 QA authz metadata incomplete for ${email}`);
  }

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...existing,
      beta_access: true,
      beta_access_updated_at: new Date().toISOString(),
    },
  });
  if (error) throw error;
}

console.log(`[qa-beta:p1] ✓ ${QA_EMAILS.length} QA adult accounts admitted on ${P1_REF}`);
