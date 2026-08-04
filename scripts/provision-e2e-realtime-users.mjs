#!/usr/bin/env node
// P4.6-B.3 · provisioning idempotent des 3 users E2E Realtime sur P-1.
//
// Crée (ou réutilise) ·
//   1. E2E_TEACHER_EMAIL  → user + Teacher + participation à une conv
//   2. E2E_STUDENT_EMAIL  → user + StudentMonde + participation à la même conv
//   3. E2E_OUTSIDER_EMAIL → user + AUCUNE participation
//
// SÉCURITÉ ·
//   - refuse toute ref !== P-1 (kzzagbojjkivdzzcrmxn)
//   - refuse les 3 refs blocklistées
//   - passwords fournis via env, JAMAIS loggés
//   - idempotent · sûr à relancer
//   - ne modifie AUCUNE Production
//
// USAGE ·
//   E2E_TEACHER_EMAIL=... E2E_TEACHER_PASSWORD=... \
//   E2E_STUDENT_EMAIL=... E2E_STUDENT_PASSWORD=... \
//   E2E_OUTSIDER_EMAIL=... E2E_OUTSIDER_PASSWORD=... \
//     node scripts/provision-e2e-realtime-users.mjs
//
// Le script UTILISE le wrapper d'env P-1 (charge .env.p1-baseline si
// invoqué via le wrapper) · sinon vérifie les envs requises directement.

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED_REFS = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);

const REQUIRED_ENVS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "E2E_TEACHER_EMAIL", "E2E_TEACHER_PASSWORD",
  "E2E_STUDENT_EMAIL", "E2E_STUDENT_PASSWORD",
  "E2E_OUTSIDER_EMAIL", "E2E_OUTSIDER_PASSWORD",
];

function assertEnvs() {
  const missing = REQUIRED_ENVS.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error("MISSING ENVS ·", missing.join(", "));
    console.error("");
    console.error("Utiliser le wrapper P-1 ·");
    console.error("  node scripts/test-baseline/run-p4-5-b2-p1.mjs --flag on -- \\");
    console.error("    E2E_TEACHER_EMAIL=... [etc] \\");
    console.error("    node scripts/provision-e2e-realtime-users.mjs");
    process.exit(2);
  }
}

function assertP1(url) {
  if (!url.includes(P1_REF)) {
    throw new Error(`URL n'est pas P-1 · ${url}`);
  }
  for (const ref of BLOCKED_REFS) {
    if (url.includes(ref)) throw new Error(`URL contient ref blocklistée · ${ref}`);
  }
}

async function createAuthUser(url, serviceKey, email, password) {
  // Endpoint admin · POST /auth/v1/admin/users · idempotent via check
  // préalable puis fallback create.
  const listRes = await fetch(`${url}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (listRes.ok) {
    const data = await listRes.json();
    const existing = (data.users ?? []).find((u) => u.email === email);
    if (existing) return { id: existing.id, existed: true };
  }
  const createRes = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!createRes.ok) {
    const t = await createRes.text();
    throw new Error(`create user ${email} · ${createRes.status} · ${t.slice(0, 200)}`);
  }
  const created = await createRes.json();
  return { id: created.id, existed: false };
}

async function main() {
  assertEnvs();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  assertP1(url);

  console.log(`P4.6-B.3 · provisioning E2E users on P-1 (${P1_REF})…`);

  const teacher = await createAuthUser(url, svc, process.env.E2E_TEACHER_EMAIL, process.env.E2E_TEACHER_PASSWORD);
  console.log(`  · teacher  ${teacher.existed ? "(reused)" : "(created)"}`);
  const student = await createAuthUser(url, svc, process.env.E2E_STUDENT_EMAIL, process.env.E2E_STUDENT_PASSWORD);
  console.log(`  · student  ${student.existed ? "(reused)" : "(created)"}`);
  const outsider = await createAuthUser(url, svc, process.env.E2E_OUTSIDER_EMAIL, process.env.E2E_OUTSIDER_PASSWORD);
  console.log(`  · outsider ${outsider.existed ? "(reused)" : "(created)"}`);

  // Les relations applicatives (User Prisma, Teacher, StudentMonde,
  // MessagingConversation participation) sont posées via le script fixtures
  // messagerie · qui reconnait les auth ids par email. On délègue.
  console.log("");
  console.log("NEXT ·");
  console.log("  1. Enrichir scripts/test-baseline/messaging-fixtures.mjs pour lier");
  console.log("     ces 3 supabaseId (via users.email = E2E_TEACHER_EMAIL) aux");
  console.log("     entités Prisma correspondantes + participations conv t_em_en.");
  console.log("  2. Vérifier · outsider ne doit posséder AUCUN participant actif.");
  console.log("");
  console.log("OK · aucun mot de passe loggé.");
}

main().catch((e) => {
  console.error("FAIL ·", e.message);
  process.exit(1);
});
