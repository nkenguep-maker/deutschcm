// P-1 Baseline · VERIFY
// Vérifie l'intégrité de la baseline créée.

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertNonProduction, ACCOUNTS, getTestPassword } from "./_common.mjs";

const TEST_PASSWORD = getTestPassword();

assertNonProduction();

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const db = new PrismaClient({ adapter, log: ["error"] });

let pass = 0, fail = 0;
const ok = (n) => { console.log("✓", n); pass++; };
const ko = (n, why) => { console.log("✗", n, "·", why); fail++; };

console.log("═══ P-1 Baseline · VERIFY ═══\n");

// Auth users
const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
for (const acc of ACCOUNTS) {
  const u = list.users.find((x) => x.email?.toLowerCase() === acc.email.toLowerCase());
  if (u) ok(`Auth · ${acc.label} exists (${u.id.slice(0,8)}...)`);
  else ko(`Auth · ${acc.label}`, "not found in Supabase Auth");
}

// DB users
for (const acc of ACCOUNTS) {
  const u = await db.user.findFirst({ where: { email: { equals: acc.email, mode: "insensitive" } } });
  if (u) ok(`DB · ${acc.label} · role=${u.role} · id=${u.id}`);
  else ko(`DB · ${acc.label}`, "not found");
}

// UserRole
for (const acc of ACCOUNTS) {
  const count = await db.userRole.count({
    where: { user: { email: { equals: acc.email, mode: "insensitive" } }, status: "ACTIVE", role: acc.role },
  });
  if (count > 0) ok(`UserRole · ${acc.label} · ${acc.role}`);
  else ko(`UserRole · ${acc.label}`, "no ACTIVE role");
}

// LearningPath
const monde = await db.learningPath.findFirst({
  where: { user: { email: { contains: "yema_test_monde" } }, universe: "MONDE" },
});
monde ? ok("LearningPath Monde deutsch") : ko("LearningPath Monde", "missing");

const solo = await db.learningPath.findFirst({
  where: { user: { email: { contains: "yema_test_racines_solo" } }, universe: "RACINES" },
});
solo ? ok("LearningPath Racines Solo wolof") : ko("LearningPath Racines Solo", "missing");

const fam = await db.learningPath.findFirst({
  where: { user: { email: { contains: "yema_test_racines_family" } }, universe: "RACINES" },
});
fam ? ok("LearningPath Racines Famille lingala") : ko("LearningPath Racines Famille", "missing");

// Household + child profiles
const familyUser = await db.user.findFirst({ where: { email: { contains: "yema_test_racines_family" } } });
if (familyUser) {
  const hh = await db.household.findFirst({ where: { ownerUserId: familyUser.id, status: "ACTIVE" } });
  hh ? ok(`Household famille · id=${hh.id}`) : ko("Household famille", "missing");
  const kids = await db.childProfile.findMany({ where: { parentUserId: familyUser.id }, orderBy: { prenom: "asc" } });
  kids.length === 2 ? ok(`Enfants · 2 profils (${kids.map(k => k.prenom).join(", ")})`) : ko("Enfants", `found ${kids.length}, expected 2`);
}

// Teacher + classroom
const teacherUser = await db.user.findFirst({ where: { email: { contains: "yema_test_teacher" } } });
if (teacherUser) {
  const tp = await db.teacher.findUnique({ where: { userId: teacherUser.id } });
  tp ? ok(`Teacher profile · id=${tp.id}`) : ko("Teacher profile", "missing");
  const cls = await db.classroom.findFirst({ where: { teacherId: tp?.id ?? "___" } });
  cls ? ok(`Classroom · ${cls.name} · code ${cls.code}`) : ko("Classroom", "missing");
}

// Center
const centerEntity = await db.languageCenter.findFirst({ where: { name: { startsWith: "TEST_" } } });
centerEntity ? ok(`LanguageCenter · ${centerEntity.name} · code ${centerEntity.code}`) : ko("Center", "missing");

// Auth login smoke test with the 6 accounts (using anon client)
console.log("");
for (const acc of ACCOUNTS) {
  const { data, error } = await anon.auth.signInWithPassword({ email: acc.email, password: TEST_PASSWORD });
  if (data?.session) {
    ok(`Auth login · ${acc.label} · session token OK`);
    await anon.auth.signOut();
  } else {
    ko(`Auth login · ${acc.label}`, error?.message ?? "no session");
  }
}

// Placeholders detection : no real client emails
const anySuspect = await db.user.findFirst({
  where: {
    email: { not: { contains: "yema_test_" } },
    email: { not: { contains: "@example.com" } },
  },
});
if (!anySuspect) ok("No non-test user found in P-1 DB");
else ko("Non-test user detected", anySuspect.email);

console.log(`\n${pass}/${pass+fail} checks passed`);
await db.$disconnect();
process.exit(fail === 0 ? 0 : 1);
