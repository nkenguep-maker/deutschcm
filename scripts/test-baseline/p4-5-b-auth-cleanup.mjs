// P4.5-B2b3b-b2 · cleanup Supabase Auth users créés par
// `p4-5-b-auth-fixtures.mjs`. À exécuter APRÈS `p4-5-b-cleanup.mjs`
// (qui purge les rows Prisma d'abord). Idempotent · refuse toute
// cible non-P1.

import { assertNonProduction } from "./_common.mjs";
import { createClient } from "@supabase/supabase-js";

assertNonProduction();

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const PREFIX = "test_p4_5_b_";

async function listAllAuthUsersMatching(prefix) {
  const out = [];
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 200, page });
    if (error) throw new Error(`listUsers: ${error.message}`);
    for (const u of data.users) {
      if (u.email && u.email.includes(prefix)) out.push(u);
    }
    if (!data.users.length || data.users.length < 200) break;
    page += 1;
  }
  return out;
}

async function main() {
  process.stderr.write("═══ P4.5-B auth cleanup P-1 ═══\n\n");
  const users = await listAllAuthUsersMatching(PREFIX);
  process.stderr.write(`auth users to delete: ${users.length}\n`);
  let deleted = 0;
  const failures = [];
  for (const u of users) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) failures.push({ email: u.email, err: error.message });
    else deleted += 1;
  }
  process.stderr.write(`deleted=${deleted} failures=${failures.length}\n`);
  if (failures.length > 0) {
    process.stderr.write(`${JSON.stringify(failures, null, 2)}\n`);
    process.stderr.write("\nAUTH CLEANUP FAILED · residual auth users\n");
    process.exit(1);
  }
  // Confirm residual = 0
  const residual = await listAllAuthUsersMatching(PREFIX);
  if (residual.length > 0) {
    process.stderr.write(`RESIDUAL auth users still present: ${residual.length}\n`);
    process.exit(1);
  }
  process.stderr.write("\nAUTH BASELINE CLEANED\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
