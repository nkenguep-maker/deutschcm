// P4.5-B2b3b-b2 · fixtures Supabase Auth pour les personas P4.5-B.
//
// Compagnon de `p4-5-b-fixtures.mjs` (qui ne crée que les rows Prisma).
// Étape 1 · s'assurer qu'un Auth user existe pour chaque email de persona
//           (createUser avec email_confirm: true + P1_TEST_PASSWORD).
// Étape 2 · propager le supabaseId (UUID Auth) sur la row Prisma user
//           correspondante (UPDATE where email).
//
// Idempotent · si l'Auth user existe déjà, on récupère son UUID. Si le
// supabaseId Prisma est déjà correct, on ne fait rien.
//
// Défense · assertNonProduction() bloque toute cible non-P1.

import { assertNonProduction, getTestPassword } from "./_common.mjs";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

assertNonProduction();
const PASSWORD = getTestPassword();

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
  log: ["error"],
});

const PREFIX = "test_p4_5_b_";
// role · rôle applicatif principal (TEACHER/STUDENT/CENTER/ADMIN) utilisé
// pour peupler user_metadata.{roles, active_space, onboarded_map} · sans
// ces meta le proxy redirige vers /setup-role ou /onboarding.
const PERSONAS = [
  { label: "teacher_a",           email: `${PREFIX}teacher_a@example.com`,           role: "TEACHER" },
  { label: "teacher_b",           email: `${PREFIX}teacher_b@example.com`,           role: "TEACHER" },
  { label: "teacher_no_bind",     email: `${PREFIX}teacher_no_bind@example.com`,     role: "TEACHER" },
  { label: "student_a",           email: `${PREFIX}student_a@example.com`,           role: "STUDENT" },
  { label: "student_b",           email: `${PREFIX}student_b@example.com`,           role: "STUDENT" },
  { label: "student_no_enroll",   email: `${PREFIX}student_no_enroll@example.com`,   role: "STUDENT" },
  { label: "student_removed",     email: `${PREFIX}student_removed@example.com`,     role: "STUDENT" },
  { label: "center_admin",        email: `${PREFIX}center_admin@example.com`,        role: "CENTER" },
  { label: "roots_coach",         email: `${PREFIX}roots_coach@example.com`,         role: "STUDENT" },
  { label: "yema_admin_no_bind",  email: `${PREFIX}yema_admin_no_bind@example.com`,  role: "ADMIN" },
];

async function listAllAuthUsersMatching(prefix) {
  const out = new Map();
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 200, page });
    if (error) throw new Error(`listUsers: ${error.message}`);
    for (const u of data.users) {
      if (u.email && u.email.includes(prefix)) out.set(u.email.toLowerCase(), u);
    }
    if (!data.users.length || data.users.length < 200) break;
    page += 1;
  }
  return out;
}

async function ensureAuthUser(email, existingMap) {
  const existing = existingMap.get(email.toLowerCase());
  if (existing) return { user: existing, created: false };
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { fixture: "TEST_P4_5_B", label: email.split("@")[0] },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  return { user: data.user, created: true };
}

async function syncPrismaSupabaseId(email, supabaseId) {
  // La row Prisma est créée par p4-5-b-fixtures.mjs avec supabaseId = id
  // (chaîne "test_p4_5_b_*_user"). On la remplace ici par l'UUID Auth.
  const result = await db.user.updateMany({
    where: { email, supabaseId: { not: supabaseId } },
    data: { supabaseId },
  });
  return result.count;
}

async function syncAuthMetadata(supabaseId, role) {
  // Miroir user_metadata pour que le proxy Next reconnaisse le rôle +
  // l'état onboardé + l'espace actif. Sans ceci, redirect /setup-role ou
  // /onboarding sur toutes les pages Teacher/Student. Cf. p4-3a-fixtures
  // pour le pattern canonique.
  const { data } = await admin.auth.admin.getUserById(supabaseId);
  const existing = data?.user?.user_metadata ?? {};
  await admin.auth.admin.updateUserById(supabaseId, {
    user_metadata: {
      ...existing,
      roles: [role],
      onboarded_map: { [role]: true },
      active_space: role,
      fixture: "TEST_P4_5_B",
    },
  });
}

async function main() {
  process.stderr.write("═══ P4.5-B auth fixtures P-1 ═══\n\n");

  const existing = await listAllAuthUsersMatching(PREFIX);
  process.stderr.write(`existing auth users matching prefix: ${existing.size}\n\n`);

  let created = 0;
  let synced = 0;
  const summary = [];
  for (const p of PERSONAS) {
    const { user, created: wasCreated } = await ensureAuthUser(p.email, existing);
    if (wasCreated) created += 1;
    const count = await syncPrismaSupabaseId(p.email, user.id);
    if (count > 0) synced += 1;
    await syncAuthMetadata(user.id, p.role);
    summary.push({
      label: p.label,
      email: p.email,
      role: p.role,
      authUuid: user.id,
      newlyCreated: wasCreated,
      prismaResynced: count > 0,
    });
  }

  process.stderr.write(`\ncreated=${created} synced=${synced} total=${PERSONAS.length}\n`);
  process.stderr.write(`\n${JSON.stringify(summary, null, 2)}\n`);
  process.stderr.write("\nAUTH FIXTURES READY\n");
  await db.$disconnect();
  return summary;
}

main().catch(async (e) => {
  console.error(e);
  try { await db.$disconnect(); } catch {}
  process.exit(1);
});
