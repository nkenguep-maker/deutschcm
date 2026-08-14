// P4.5-QA · fixtures P-1 protégées `test_yema_qa_`.
//
// Crée les 5 personas + les données minimales pour la console QA · 1 centre,
// 1 classroom Monde, 1 assignment PUBLISHED, 1 submission DRAFT, 1
// submission SUBMITTED, 1 feedback PUBLISHED, 1 enrollment actif.
//
// Idempotent · réutilise les upsert existants. Refuse toute cible non-P-1
// via `assertNonProduction`.

import { assertNonProduction, getTestPassword } from "./_common.mjs";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { randomBytes, scrypt as _scrypt } from "node:crypto";
import { promisify } from "node:util";

// P4.6 Lot 4A · hash PIN enfant canonique (miroir de src/lib/security/childPin.ts).
// Le module TS n'est pas importable ici (ESM pur, aucun bundler). On duplique
// intentionnellement les 8 lignes cryptographiques pour éviter un layer de build.
const _scryptAsync = promisify(_scrypt);
async function hashChildPin(pin) {
  if (!/^\d{4,6}$/.test(pin)) throw new Error("invalid_pin_format");
  const salt = randomBytes(16);
  const key = await _scryptAsync(Buffer.from(pin, "utf8"), salt, 64, {
    N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

assertNonProduction();
const PASSWORD = getTestPassword();
const FIXTURE_NETWORK_TIMEOUT_MS = 20_000;
const FIXTURE_RUNTIME_DEADLINE_MS = 90_000;
const fixtureDeadline = setTimeout(() => {
  console.error("QA fixture deadline exceeded before P-1 provisioning completed");
  process.exit(1);
}, FIXTURE_RUNTIME_DEADLINE_MS);

// Fixture scripts must fail clearly when the P-1 network is unavailable.
// Preserve an upstream abort signal when the Supabase client supplies one.
function fetchWithTimeout(input, init = {}) {
  const timeoutSignal = AbortSignal.timeout(FIXTURE_NETWORK_TIMEOUT_MS);
  const signal = init.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;
  return fetch(input, { ...init, signal });
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithTimeout },
  },
);
const dbPool = new pg.Pool({
  connectionString: process.env.DIRECT_URL,
  connectionTimeoutMillis: FIXTURE_NETWORK_TIMEOUT_MS,
});
const db = new PrismaClient({
  adapter: new PrismaPg(dbPool, { disposeExternalPool: true }),
  log: ["error"],
});

const PREFIX = "test_yema_qa_";
// student_monde et student_racines · profils/parcours distincts (LP MONDE
// DEUTSCH vs LP RACINES WOLOF onboarded) · aucun mélange.
// family (P4.6 Lot 4A) · guardian principal · appRole PARENT.
const PERSONAS = [
  { label: "super_admin",     email: `${PREFIX}super_admin@example.com`,     role: "ADMIN",   appRole: "YEMA_ADMIN" },
  { label: "teacher",         email: `${PREFIX}teacher@example.com`,         role: "TEACHER", appRole: null },
  { label: "coach",           email: `${PREFIX}coach@example.com`,           role: "STUDENT", appRole: "RACINES_COACH" },
  { label: "center_admin",    email: `${PREFIX}center_admin@example.com`,    role: "CENTER",  appRole: "CENTER_ADMIN" },
  { label: "student_monde",   email: `${PREFIX}student_monde@example.com`,   role: "STUDENT", appRole: "LEARNER" },
  { label: "student_racines", email: `${PREFIX}student_racines@example.com`, role: "STUDENT", appRole: "LEARNER" },
  { label: "family",          email: `${PREFIX}family@example.com`,          role: "STUDENT", appRole: "PARENT" },
  // Lot 7B.2 · apprenants supplémentaires · couverture distribution parcours.
  { label: "student_work",     email: `${PREFIX}student_work@example.com`,     role: "STUDENT", appRole: "LEARNER" },
  { label: "student_exam",     email: `${PREFIX}student_exam@example.com`,     role: "STUDENT", appRole: "LEARNER" },
  { label: "student_nogoal",   email: `${PREFIX}student_nogoal@example.com`,   role: "STUDENT", appRole: "LEARNER" },
  { label: "student_external", email: `${PREFIX}student_external@example.com`, role: "STUDENT", appRole: "LEARNER" },
  { label: "student_inactive", email: `${PREFIX}student_inactive@example.com`, role: "STUDENT", appRole: "LEARNER" },
  // Lot 7B.2 · isolation · second foyer non lié pour test cross-household.
  { label: "family2",          email: `${PREFIX}family2@example.com`,          role: "STUDENT", appRole: "PARENT" },
];

async function listAllAuthMatching(prefix) {
  const out = new Map();
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 200, page });
    if (error) throw new Error(`listUsers: ${error.message}`);
    for (const u of data.users) if (u.email?.includes(prefix)) out.set(u.email.toLowerCase(), u);
    if (!data.users.length || data.users.length < 200) break;
    page += 1;
  }
  return out;
}

async function ensureAuthUser(email, existingMap) {
  const existing = existingMap.get(email.toLowerCase());
  if (existing) return { user: existing, created: false };
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true,
    user_metadata: { fixture: "TEST_YEMA_QA", label: email.split("@")[0] },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  return { user: data.user, created: true };
}

async function syncMetadata(supabaseId, appRole) {
  // Le proxy filtre roles[] via SpaceRole ∈ {STUDENT, TEACHER, CENTER, ADMIN}.
  // On mappe appRole (LEARNER/RACINES_COACH/CENTER_ADMIN/YEMA_ADMIN) →
  // SpaceRole équivalent · sans ce mapping, les personas non-teacher se
  // retrouvaient tous sur /setup-role.
  const activeSpace = appRole === "CENTER_ADMIN" ? "CENTER"
    : appRole === "YEMA_ADMIN" ? "ADMIN"
    : appRole === "RACINES_COACH" ? "STUDENT"
    : appRole === "LEARNER" ? "STUDENT"
    : appRole === "PARENT" ? "STUDENT" // P4.6 Lot 4A · family guardian
    : "TEACHER";
  const rolesList = [activeSpace];
  const onboardedMap = { [activeSpace]: true };
  const { data } = await admin.auth.admin.getUserById(supabaseId);
  const existingProfile = data?.user?.user_metadata ?? {};
  const existingAuthz = data?.user?.app_metadata ?? {};
  await admin.auth.admin.updateUserById(supabaseId, {
    user_metadata: {
      ...existingProfile,
      fixture: "TEST_YEMA_QA",
    },
    app_metadata: {
      ...existingAuthz,
      roles: rolesList,
      onboarded_map: onboardedMap,
      active_space: activeSpace,
    },
  });
}

async function ensureDbUser(supabaseId, email, role, learningGoal) {
  const data = { supabaseId, role, fullName: `TEST QA ${email.split("@")[0]}`, onboardingDone: true };
  // Lot 7B.2 · learningGoal projeté explicitement uniquement quand fourni ·
  // sinon on ne touche pas la colonne (préserve les états existants).
  if (learningGoal !== undefined) data.learningGoal = learningGoal;
  return db.user.upsert({
    where: { email },
    update: data,
    create: { email, ...data },
  });
}

async function ensureAppRole(userId, appRole) {
  if (!appRole) return;
  await db.userAppRole.upsert({
    where: { userId_role: { userId, role: appRole } },
    update: {}, create: { userId, role: appRole },
  });
}

async function main() {
  process.stderr.write("═══ YEMA QA fixtures P-1 ═══\n\n");
  const existing = await listAllAuthMatching(PREFIX);
  const created = {};
  // Lot 7B.2 · mapping des learningGoal par label · applique la valeur
  // canonique au user QA correspondant · null explicite pour student_nogoal.
  const LEARNING_GOALS = {
    student_monde:    "STUDIES",
    student_work:     "WORK",
    student_exam:     "EXAM",
    student_nogoal:   null,
    student_external: "TRAVEL",
    student_inactive: "DAILY_LIFE",
  };
  for (const p of PERSONAS) {
    const { user } = await ensureAuthUser(p.email, existing);
    await syncMetadata(user.id, p.appRole);
    const goal = Object.prototype.hasOwnProperty.call(LEARNING_GOALS, p.label) ? LEARNING_GOALS[p.label] : undefined;
    const dbUser = await ensureDbUser(user.id, p.email, p.role, goal);
    if (p.appRole) await ensureAppRole(dbUser.id, p.appRole);
    created[p.label] = { email: p.email, authUuid: user.id, dbId: dbUser.id, role: p.role };
  }

  // Teacher binding · une row Teacher.
  const teacherUser = created.teacher;
  const teacherRow = await db.teacher.upsert({
    where: { id: `${PREFIX}teacher_bind` },
    update: {},
    create: { id: `${PREFIX}teacher_bind`, userId: teacherUser.dbId },
  });

  // Classroom Monde QA + enrollment étudiant.
  const classroom = await db.classroom.upsert({
    where: { id: `${PREFIX}classroom` },
    update: {},
    create: {
      id: `${PREFIX}classroom`,
      name: "QA Klasse Monde",
      teacherId: teacherRow.id,
      level: "A1",
      code: "QA-KLASSE-01",
    },
  });
  await db.classroomEnrollment.upsert({
    where: { classroomId_userId: { classroomId: classroom.id, userId: created.student_monde.dbId } },
    update: { isActive: true },
    create: { classroomId: classroom.id, userId: created.student_monde.dbId, isActive: true },
  });
  // Lot 7B.2 · enrollments supplémentaires · WORK + EXAM + null actifs ·
  // student_inactive enrolled mais isActive=false · student_external non
  // enrolled du tout (test hors classe).
  for (const label of ["student_work", "student_exam", "student_nogoal"]) {
    await db.classroomEnrollment.upsert({
      where: { classroomId_userId: { classroomId: classroom.id, userId: created[label].dbId } },
      update: { isActive: true },
      create: { classroomId: classroom.id, userId: created[label].dbId, isActive: true },
    });
  }
  await db.classroomEnrollment.upsert({
    where: { classroomId_userId: { classroomId: classroom.id, userId: created.student_inactive.dbId } },
    update: { isActive: false },
    create: { classroomId: classroom.id, userId: created.student_inactive.dbId, isActive: false },
  });

  // 1 assignment PUBLISHED.
  const now = new Date();
  const asm = await db.assignment.upsert({
    where: { id: `${PREFIX}assignment_pub` },
    update: {},
    create: {
      id: `${PREFIX}assignment_pub`,
      classroom: { connect: { id: classroom.id } },
      title: "QA · Devoir de test",
      type: "WRITTEN", status: "PUBLISHED", publishedAt: now,
      createdByTeacher: { connect: { id: teacherRow.id } },
    },
  });

  // 1 submission DRAFT + 1 SUBMITTED (par le Student).
  const subDraft = await db.assignmentSubmission.upsert({
    where: { id: `${PREFIX}submission_draft` },
    update: {},
    create: {
      id: `${PREFIX}submission_draft`,
      assignment: { connect: { id: asm.id } },
      user: { connect: { id: created.student_monde.dbId } },
      writtenContent: "QA · brouillon en cours",
      status: "DRAFT", version: 1,
    },
  });
  const subSubmitted = await db.assignmentSubmission.upsert({
    where: { id: `${PREFIX}submission_submitted` },
    update: {},
    create: {
      id: `${PREFIX}submission_submitted`,
      assignment: { connect: { id: asm.id } },
      user: { connect: { id: created.student_monde.dbId } },
      writtenContent: "QA · travail finalisé",
      status: "SUBMITTED", version: 2, submittedAt: now,
    },
  });

  // 1 feedback PUBLISHED sur la submission SUBMITTED.
  const fb = await db.assignmentFeedback.upsert({
    where: { id: `${PREFIX}feedback_pub` },
    update: {},
    create: {
      id: `${PREFIX}feedback_pub`,
      submission: { connect: { id: subSubmitted.id } },
      authorTeacher: { connect: { id: teacherRow.id } },
      status: "PUBLISHED", version: 1, writtenContent: "QA · bien !", publishedAt: now,
    },
  });

  // ─── Learning paths distincts Monde vs Racines ─────────────────────
  // student_monde · LP MONDE DEUTSCH A1 · rend <DashboardMonde />
  await db.learningPath.upsert({
    where: { id: `${PREFIX}lp_monde` },
    update: {},
    create: {
      id: `${PREFIX}lp_monde`,
      user: { connect: { id: created.student_monde.dbId } },
      universe: "MONDE", language: "DEUTSCH", currentLevel: "A1",
      status: "ACTIVE",
      onboardingAnswers: { why: "study", startPoint: "beginner",
        selfAssessmentAnswer: 2, declaredLevel: "A1", recommendedLevel: "A1" },
    },
  });
  // Marquer universe côté metadata pour cohérence proxy/pages.
  {
    const { data } = await admin.auth.admin.getUserById(created.student_monde.authUuid);
    const existing = data?.user?.user_metadata ?? {};
    await admin.auth.admin.updateUserById(created.student_monde.authUuid, {
      user_metadata: { ...existing, universe: "monde", activeLanguage: "deutsch" },
    });
  }

  // student_racines · LP RACINES WOLOF · rend <DashboardRacines />
  await db.learningPath.upsert({
    where: { id: `${PREFIX}lp_racines` },
    update: {},
    create: {
      id: `${PREFIX}lp_racines`,
      user: { connect: { id: created.student_racines.dbId } },
      universe: "RACINES", language: "WOLOF",
      status: "ACTIVE",
      onboardingAnswers: { link: "family_words", startPoint: "some_basics" },
    },
  });
  {
    const { data } = await admin.auth.admin.getUserById(created.student_racines.authUuid);
    const existing = data?.user?.user_metadata ?? {};
    await admin.auth.admin.updateUserById(created.student_racines.authUuid, {
      user_metadata: { ...existing, universe: "racines", activeLanguage: "wolof", plan: "racines-solo" },
    });
  }

  // ─── P4.6 Lot 4A · fixture Famille ────────────────────────────────
  // Guardian principal (family) · Household · 2 ChildProfile (Monde WOLOF
  // + Racines) avec PIN hashé · AccessGrant HOUSEHOLD ROOTS_FAMILY
  // (souscription du foyer) + 1 AccessGrant USER ROOTS_FAMILY (siège
  // adulte explicit du guardian). AUCUN Passage Monde adulte.
  const familyUser = created.family;
  const rootsFamilyVariant = await db.productVariant.findFirst({
    where: { product: { code: "ROOTS_FAMILY" }, active: true },
    select: { id: true, product: { select: { code: true } } },
    orderBy: { createdAt: "asc" },
  });
  // P4.6 Lot 5.1 · FAMILY_WORLD = 3 sièges Enfant Monde (couvre l'enfant
  // Monde bakée). Ne débloque JAMAIS de Passage Monde adulte.
  const familyWorldVariant = await db.productVariant.findFirst({
    where: { product: { code: "FAMILY_WORLD" }, active: true },
    select: { id: true, product: { select: { code: true } } },
    orderBy: { createdAt: "asc" },
  });
  let familySeatGrantId = null;
  let familyHouseholdId = null;
  let familyWorldGrantId = null;
  let childMondeId = null;
  let childRacinesId = null;
  if (!rootsFamilyVariant || !familyWorldVariant) {
    process.stderr.write(
      "\n⚠ fixture Family : product ROOTS_FAMILY ou FAMILY_WORLD absent du " +
      "catalogue P-1 — exécuter `npx prisma db seed` sur P-1 puis re-baker.\n",
    );
  } else {
    const householdId = `${PREFIX}household_family`;
    const household = await db.household.upsert({
      where: { id: householdId },
      update: {},
      create: { id: householdId, ownerUserId: familyUser.dbId },
    });
    familyHouseholdId = household.id;
    await db.householdMembership.upsert({
      where: { householdId_userId: { householdId, userId: familyUser.dbId } },
      update: { status: "ACTIVE" },
      create: { householdId, userId: familyUser.dbId, role: "OWNER", status: "ACTIVE" },
    });

    // Grant HOUSEHOLD (souscription du foyer).
    const householdGrantId = `${PREFIX}grant_hh_family`;
    await db.accessGrant.upsert({
      where: { id: householdGrantId },
      update: { status: "ACTIVE" },
      create: {
        id: householdGrantId,
        beneficiaryType: "HOUSEHOLD",
        beneficiaryId: household.id,
        productVariantId: rootsFamilyVariant.id,
        sourceType: "SUBSCRIPTION",
        sourceId: `${PREFIX}order_family`,
        status: "ACTIVE",
        startsAt: now,
      },
    });

    // Grant USER (siège adulte attribué explicitement au guardian).
    const seatGrantId = `${PREFIX}grant_user_family_seat_owner`;
    await db.accessGrant.upsert({
      where: { id: seatGrantId },
      update: { status: "ACTIVE" },
      create: {
        id: seatGrantId,
        beneficiaryType: "USER",
        beneficiaryId: familyUser.dbId,
        productVariantId: rootsFamilyVariant.id,
        sourceType: "SUBSCRIPTION",
        sourceId: household.id,
        status: "ACTIVE",
        startsAt: now,
        metadata: { seatType: "ADULT_ROOTS", householdId: household.id },
      },
    });
    familySeatGrantId = seatGrantId;

    // P4.6 Lot 5.1 · Grant HOUSEHOLD FAMILY_WORLD (3 sièges Enfant Monde).
    const familyWorldGrantIdLocal = `${PREFIX}grant_hh_family_world`;
    await db.accessGrant.upsert({
      where: { id: familyWorldGrantIdLocal },
      update: { status: "ACTIVE" },
      create: {
        id: familyWorldGrantIdLocal,
        beneficiaryType: "HOUSEHOLD",
        beneficiaryId: household.id,
        productVariantId: familyWorldVariant.id,
        sourceType: "SUBSCRIPTION",
        sourceId: `${PREFIX}order_family_world`,
        status: "ACTIVE",
        startsAt: now,
      },
    });
    familyWorldGrantId = familyWorldGrantIdLocal;

    // 2 ChildProfile avec PIN hashé (« 1234 » pour QA, hashé scrypt).
    // P4.6 Lot 5.1 · universe explicite (MONDE / RACINES), plus aucune
    // inférence depuis la langue.
    const [pinHashA, pinHashB] = await Promise.all([hashChildPin("1234"), hashChildPin("5678")]);
    const childMonde = await db.childProfile.upsert({
      where: { id: `${PREFIX}child_family_monde` },
      update: {
        pinHash: pinHashA,
        pinUpdatedAt: now,
        householdId: household.id,
        universe: "MONDE",
        // Lot 7B.2 · Lina · parcours STUDIES canonique (couverture Family Monde).
        learningGoal: "STUDIES",
      },
      create: {
        id: `${PREFIX}child_family_monde`,
        parentUserId: familyUser.dbId,
        householdId: household.id,
        prenom: "Lina",
        avatarAnimal: "panda",
        age: 8,
        langues: [{ langue: "deutsch", type: "foreign", echelle: 0, etoiles: 0, motsAppris: [] }],
        activeLangue: "deutsch",
        pinHash: pinHashA,
        pinUpdatedAt: now,
        universe: "MONDE",
        learningGoal: "STUDIES",
      },
    });
    childMondeId = childMonde.id;
    // Lot 7B.2 · second enfant MONDE avec learningGoal=EXAM · couvre le
    // scénario "parcours différent au sein du même foyer".
    const pinHashC = await hashChildPin("2345");
    await db.childProfile.upsert({
      where: { id: `${PREFIX}child_family_monde_exam` },
      update: {
        pinHash: pinHashC,
        pinUpdatedAt: now,
        householdId: household.id,
        universe: "MONDE",
        learningGoal: "EXAM",
      },
      create: {
        id: `${PREFIX}child_family_monde_exam`,
        parentUserId: familyUser.dbId,
        householdId: household.id,
        prenom: "Malik",
        avatarAnimal: "tortue",
        age: 10,
        langues: [{ langue: "deutsch", type: "foreign", echelle: 0, etoiles: 0, motsAppris: [] }],
        activeLangue: "deutsch",
        pinHash: pinHashC,
        pinUpdatedAt: now,
        universe: "MONDE",
        learningGoal: "EXAM",
      },
    });
    const childRacines = await db.childProfile.upsert({
      where: { id: `${PREFIX}child_family_racines` },
      update: {
        pinHash: pinHashB,
        pinUpdatedAt: now,
        householdId: household.id,
        universe: "RACINES",
      },
      create: {
        id: `${PREFIX}child_family_racines`,
        parentUserId: familyUser.dbId,
        householdId: household.id,
        prenom: "Aïcha",
        avatarAnimal: "chouette",
        age: 6,
        langues: [{ langue: "wolof", type: "native", echelle: 0, etoiles: 0, motsAppris: [] }],
        activeLangue: "wolof",
        pinHash: pinHashB,
        pinUpdatedAt: now,
        universe: "RACINES",
      },
    });
    childRacinesId = childRacines.id;

    // Lot 7B.2 · isolation · second foyer indépendant · aucun enfant du
    // household_family ne doit apparaître au family2. Household distinct,
    // parentUserId différent, 1 enfant MONDE local.
    const family2User = created.family2;
    const household2Id = `${PREFIX}household_family2`;
    const household2 = await db.household.upsert({
      where: { id: household2Id },
      update: {},
      create: { id: household2Id, ownerUserId: family2User.dbId },
    });
    await db.householdMembership.upsert({
      where: { householdId_userId: { householdId: household2.id, userId: family2User.dbId } },
      update: { status: "ACTIVE" },
      create: { householdId: household2.id, userId: family2User.dbId, role: "OWNER", status: "ACTIVE" },
    });
    const pinHashD = await hashChildPin("6789");
    await db.childProfile.upsert({
      where: { id: `${PREFIX}child_family2_monde` },
      update: {
        pinHash: pinHashD,
        pinUpdatedAt: now,
        householdId: household2.id,
        universe: "MONDE",
        learningGoal: "TRAVEL",
      },
      create: {
        id: `${PREFIX}child_family2_monde`,
        parentUserId: family2User.dbId,
        householdId: household2.id,
        prenom: "Nina",
        avatarAnimal: "renard",
        age: 9,
        langues: [{ langue: "deutsch", type: "foreign", echelle: 0, etoiles: 0, motsAppris: [] }],
        activeLangue: "deutsch",
        pinHash: pinHashD,
        pinUpdatedAt: now,
        universe: "MONDE",
        learningGoal: "TRAVEL",
      },
    });
  }

  const summary = {
    personas: Object.fromEntries(
      Object.entries(created).map(([k, v]) => [k, { email: v.email, role: v.role }]),
    ),
    data: {
      classroom: classroom.id, assignment: asm.id,
      submissionDraft: subDraft.id, submissionSubmitted: subSubmitted.id,
      feedbackPublished: fb.id,
    },
    family: {
      householdId: familyHouseholdId,
      seatGrantId: familySeatGrantId,
      familyWorldGrantId,
      childMondeId,
      childRacinesId,
      rootsFamilyVariant: rootsFamilyVariant?.id ?? null,
      familyWorldVariant: familyWorldVariant?.id ?? null,
    },
  };
  process.stderr.write(`\n${JSON.stringify(summary, null, 2)}\n\nQA FIXTURES READY\n`);
  await db.$disconnect();
  return summary;
}

main()
  .then(() => clearTimeout(fixtureDeadline))
  .catch(async (e) => {
    clearTimeout(fixtureDeadline);
    console.error(e);
    try { await db.$disconnect(); } catch {}
    process.exit(1);
  });
