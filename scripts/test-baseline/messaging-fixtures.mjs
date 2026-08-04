// P4.6-A · fixtures Messagerie P-1 · 13 conversations métier + guided phrases.
//
// Doctrine :
//   - Aucun t_sa_audit Conversation · c'est une projection Metadata Super
//     Admin qui vient du reader adminProjection.ts.
//   - Aucune donnée Production. Aucun secret loggué.
//   - Idempotent : upsert par id fixture t_*.
//   - Réutilise les personas + Household QA déjà bakés par
//     yema-qa-fixtures.mjs (dépendance implicite : lance d'abord ce
//     script si les fixtures QA n'existent pas encore).

import { assertNonProduction, getTestPassword } from "./_common.mjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

assertNonProduction();
// getTestPassword() vérifie que P1_TEST_PASSWORD est défini · même contrat
// que yema-qa-fixtures.mjs, aucun mot de passe loggué.
getTestPassword();

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
  log: ["error"],
});

const PREFIX = "test_yema_qa_";
const now = new Date();

// ─── Guided phrases (10 par univers × 2 locales) ────────────────────
const GUIDED = [
  // CHILD_WORLD_GUIDED · FR/EN · deutsch
  { universe: "MONDE", conversationType: "CHILD_WORLD_GUIDED", locale: "fr", text: "Bonjour !",              ordering: 1 },
  { universe: "MONDE", conversationType: "CHILD_WORLD_GUIDED", locale: "fr", text: "J'ai fini !",            ordering: 2 },
  { universe: "MONDE", conversationType: "CHILD_WORLD_GUIDED", locale: "fr", text: "Merci beaucoup.",        ordering: 3 },
  { universe: "MONDE", conversationType: "CHILD_WORLD_GUIDED", locale: "fr", text: "Je peux réessayer ?",    ordering: 4 },
  { universe: "MONDE", conversationType: "CHILD_WORLD_GUIDED", locale: "fr", text: "Encore une écoute.",     ordering: 5 },
  { universe: "MONDE", conversationType: "CHILD_WORLD_GUIDED", locale: "en", text: "Hi!",                    ordering: 1 },
  { universe: "MONDE", conversationType: "CHILD_WORLD_GUIDED", locale: "en", text: "I finished.",            ordering: 2 },
  // CHILD_ROOTS_GUIDED · wolof/mots familiaux
  { universe: "RACINES", conversationType: "CHILD_ROOTS_GUIDED", locale: "fr", text: "J'ai écouté le conte.", ordering: 1 },
  { universe: "RACINES", conversationType: "CHILD_ROOTS_GUIDED", locale: "fr", text: "Je veux réécouter.",    ordering: 2 },
  { universe: "RACINES", conversationType: "CHILD_ROOTS_GUIDED", locale: "fr", text: "Je répète après toi.",  ordering: 3 },
  { universe: "RACINES", conversationType: "CHILD_ROOTS_GUIDED", locale: "en", text: "I listened to the tale.", ordering: 1 },
];

async function ensureGuidedPhrases() {
  const created = [];
  for (const g of GUIDED) {
    // Idempotence : findFirst puis upsert manuel car pas d'unique
    // composite couvrant (universe, type, locale, text).
    const existing = await db.messagingGuidedPhrase.findFirst({
      where: {
        universe: g.universe,
        conversationType: g.conversationType,
        locale: g.locale,
        text: g.text,
      },
      select: { id: true },
    });
    if (existing) {
      created.push(existing.id);
      continue;
    }
    const r = await db.messagingGuidedPhrase.create({
      data: { ...g, isActive: true },
      select: { id: true },
    });
    created.push(r.id);
  }
  return created;
}

async function findPersonaUser(labelEmailSuffix) {
  const email = `${PREFIX}${labelEmailSuffix}@example.com`;
  const u = await db.user.findUnique({ where: { email }, select: { id: true } });
  return u?.id ?? null;
}

async function findChildProfile(idSuffix) {
  const id = `${PREFIX}${idSuffix}`;
  const c = await db.childProfile.findUnique({ where: { id }, select: { id: true, parentUserId: true } });
  return c;
}

async function upsertConversation(fixtureKey, type, contexts, participants) {
  const id = `${PREFIX}${fixtureKey}`;
  await db.messagingConversation.upsert({
    where: { id },
    update: { status: "ACTIVE", ...contexts, lastMessageAt: now },
    create: { id, type, status: "ACTIVE", ...contexts, lastMessageAt: now, createdAt: now },
  });
  // Participants (idempotent · uniqueness sur conv_user_active / conv_child_active).
  for (const p of participants) {
    if (p.userId) {
      await db.messagingConversationParticipant.upsert({
        where: { conv_user_active: { conversationId: id, userId: p.userId } },
        update: { participantRole: p.role, leftAt: null },
        create: {
          conversationId: id,
          actorType: "USER",
          userId: p.userId,
          participantRole: p.role,
        },
      });
    } else if (p.childProfileId) {
      await db.messagingConversationParticipant.upsert({
        where: { conv_child_active: { conversationId: id, childProfileId: p.childProfileId } },
        update: { participantRole: p.role, leftAt: null },
        create: {
          conversationId: id,
          actorType: "CHILD_PROFILE",
          childProfileId: p.childProfileId,
          participantRole: p.role,
        },
      });
    }
  }
  return id;
}

async function seedFixtureMessage(conversationId, keySuffix, senderUserId, kind, extra = {}) {
  const idempotencyKey = `${PREFIX}msg_${keySuffix}`;
  const existing = await db.messagingMessage.findFirst({
    where: { conversationId, idempotencyKey },
    select: { id: true },
  });
  if (existing) return existing.id;
  const r = await db.messagingMessage.create({
    data: {
      conversationId,
      idempotencyKey,
      kind,
      senderType: "USER",
      senderUserId,
      publishedAt: now,
      ...extra,
    },
    select: { id: true },
  });
  return r.id;
}

// P4.6-B.4 · rattachement Prisma des 3 auth users E2E provisionnés
// via scripts/provision-e2e-realtime-users.mjs.
//
// Contrat ·
//   - Opt-in par env · si E2E_TEACHER_EMAIL absent → skip proprement,
//     les fixtures QA normales continuent à fonctionner.
//   - Idempotent · upsert User + upsert Teacher + upsert participation.
//   - Le supabaseId est résolu par requête admin Supabase (identique au
//     provisioning script) · aucun mot de passe utilisé ici.
//   - Outsider · User Prisma créé SANS aucune participation active.
//   - Aucune Production · assertNonProduction() en tête de script.
async function resolveSupabaseIdByEmail(email) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return null;
  const res = await fetch(`${url}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`, {
    headers: { apikey: svc, Authorization: `Bearer ${svc}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const u = (data.users ?? []).find((x) => x.email === email);
  return u?.id ?? null;
}

async function ensurePrismaUserForAuth({ email, role, prenom, nom }) {
  const supId = await resolveSupabaseIdByEmail(email);
  if (!supId) return null;
  // Upsert User avec role · idempotent sur (email). onboardingDone=true
  // pour éviter le redirect /onboarding sur les E2E users nouveaux.
  const p = prenom ?? "E2E";
  const n = nom ?? "Test";
  const u = await db.user.upsert({
    where: { email },
    update: { supabaseId: supId, role, onboardingDone: true, germanLevel: "A1", isValidated: true },
    create: {
      email,
      supabaseId: supId,
      role,
      fullName: `${p} ${n}`,
      onboardingDone: true,
      germanLevel: "A1",
      isValidated: true,
    },
    select: { id: true },
  });
  return u.id;
}

async function ensureE2ELinkage(conversations) {
  const teacherEmail = process.env.E2E_TEACHER_EMAIL;
  const studentEmail = process.env.E2E_STUDENT_EMAIL;
  const outsiderEmail = process.env.E2E_OUTSIDER_EMAIL;
  // P4.6-C.3.1 · family2 · parent non lié · Household distinct.
  const family2Email = process.env.E2E_FAMILY2_EMAIL ?? "e2e.family2.p1@yema-test.local";
  if (!teacherEmail || !studentEmail || !outsiderEmail) {
    process.stderr.write("[e2e] E2E_*_EMAIL absents · skip rattachement Prisma\n");
    return { skipped: true };
  }
  const teacherId = await ensurePrismaUserForAuth({
    email: teacherEmail,
    role: "TEACHER",
    prenom: "E2E",
    nom: "Teacher",
  });
  const studentId = await ensurePrismaUserForAuth({
    email: studentEmail,
    role: "STUDENT",
    prenom: "E2E",
    nom: "Student",
  });
  const outsiderId = await ensurePrismaUserForAuth({
    email: outsiderEmail,
    role: "STUDENT",
    prenom: "E2E",
    nom: "Outsider",
  });
  if (!teacherId || !studentId || !outsiderId) {
    throw new Error("[e2e] provisioning auth non complet · relancer provision-e2e-realtime-users.mjs");
  }
  // Rattacher Teacher + Student à t_em_en (WORLD_STUDENT_TEACHER).
  await db.messagingConversationParticipant.upsert({
    where: { conv_user_active: { conversationId: conversations.t_em_en, userId: teacherId } },
    update: { participantRole: "MODERATOR", leftAt: null },
    create: {
      conversationId: conversations.t_em_en,
      actorType: "USER",
      userId: teacherId,
      participantRole: "MODERATOR",
    },
  });
  await db.messagingConversationParticipant.upsert({
    where: { conv_user_active: { conversationId: conversations.t_em_en, userId: studentId } },
    update: { participantRole: "MEMBER", leftAt: null },
    create: {
      conversationId: conversations.t_em_en,
      actorType: "USER",
      userId: studentId,
      participantRole: "MEMBER",
    },
  });
  // Outsider · aucune participation active dans t_em_en.
  const outsiderInConv = await db.messagingConversationParticipant.findFirst({
    where: { conversationId: conversations.t_em_en, userId: outsiderId, leftAt: null },
    select: { id: true },
  });
  if (outsiderInConv) {
    await db.messagingConversationParticipant.update({
      where: { id: outsiderInConv.id },
      data: { leftAt: now },
    });
    process.stderr.write("[e2e] WARN · outsider avait un participant actif · marqué leftAt\n");
  }

  // P4.6-C.3.1 · Family2 · parent non lié · Household distinct.
  //   - User Family réel
  //   - Household distinct (ownerUserId = family2Id)
  //   - AUCUNE relation avec le ChildProfile Monde QA
  //   - AUCUNE participation à CHILD_WORLD_GUIDED
  //   - AUCUN receipt PARENT_COPY
  const family2Id = await ensurePrismaUserForAuth({
    email: family2Email,
    role: "STUDENT", // PARENT app-role attribué séparément si nécessaire
    prenom: "E2E",
    nom: "Family2",
  });
  if (!family2Id) {
    process.stderr.write("[e2e] WARN · family2 auth absent · skip Household provisioning\n");
  } else {
    await db.household.upsert({
      where: { id: `test_yema_qa_household_family2_e2e` },
      update: { status: "ACTIVE" },
      create: {
        id: `test_yema_qa_household_family2_e2e`,
        ownerUserId: family2Id,
        status: "ACTIVE",
      },
    });
    // Vérification défensive · family2 ne doit AVOIR AUCUN participant
    // actif dans les conversations enfant.
    const family2InChild = await db.messagingConversationParticipant.findMany({
      where: {
        conversationId: { in: [conversations.t_km_en, conversations.t_kr_co].filter(Boolean) },
        userId: family2Id,
        leftAt: null,
      },
      select: { id: true },
    });
    if (family2InChild.length > 0) {
      for (const p of family2InChild) {
        await db.messagingConversationParticipant.update({
          where: { id: p.id },
          data: { leftAt: now },
        });
      }
      process.stderr.write(`[e2e] WARN · family2 avait ${family2InChild.length} participation(s) enfant · marquées leftAt\n`);
    }
    process.stderr.write("[e2e] family2 · Household distinct · zéro participation enfant · OK\n");
  }

  return {
    skipped: false,
    teacherId,
    studentId,
    outsiderId,
    family2Id,
    teacherEmail,
    studentEmail,
    outsiderEmail,
    family2Email,
    conversationId: conversations.t_em_en,
  };
}

async function main() {
  process.stderr.write("═══ P4.6-A messaging fixtures P-1 ═══\n\n");
  const g = await ensureGuidedPhrases();
  process.stderr.write(`guided_phrases · ${g.length} row(s) ready\n`);

  // Personas requis (déjà bakés par yema-qa-fixtures.mjs)
  const [teacherId, coachId, centerAdminId, superAdminId, studentMondeId, studentRacinesId, familyId] = await Promise.all([
    findPersonaUser("teacher"),
    findPersonaUser("coach"),
    findPersonaUser("center_admin"),
    findPersonaUser("super_admin"),
    findPersonaUser("student_monde"),
    findPersonaUser("student_racines"),
    findPersonaUser("family"),
  ]);
  const childMonde = await findChildProfile("child_family_monde");
  const childRacines = await findChildProfile("child_family_racines");
  if (!teacherId || !coachId || !centerAdminId || !superAdminId || !studentMondeId || !studentRacinesId || !familyId
      || !childMonde || !childRacines) {
    throw new Error("QA personas or child profiles missing · run yema-qa-fixtures.mjs first");
  }

  // Contextes réels (bakés)
  const classroom = await db.classroom.findFirst({
    where: { id: `${PREFIX}classroom` }, select: { id: true, centerId: true },
  });
  const household = await db.household.findFirst({
    where: { id: `${PREFIX}household_family` }, select: { id: true },
  });
  const centerId = classroom?.centerId ?? null;

  // ─── 13 conversations ─────────────────────────────────────────────
  const t_em_en = await upsertConversation("t_em_en", "WORLD_STUDENT_TEACHER",
    { classroomId: classroom?.id ?? null },
    [{ userId: studentMondeId, role: "MEMBER" }, { userId: teacherId, role: "MODERATOR" }]);
  await seedFixtureMessage(t_em_en, "em_en_1", teacherId, "TEXT", { body: "Bonjour, c'est bientôt le devoir." });

  const t_class_a1 = await upsertConversation("t_class_a1", "WORLD_CLASS_GROUP",
    { classroomId: classroom?.id ?? null },
    [{ userId: studentMondeId, role: "MEMBER" }, { userId: teacherId, role: "MODERATOR" }]);
  await seedFixtureMessage(t_class_a1, "class_a1_1", teacherId, "TEXT", { body: "Rappel : rendu vendredi." });

  const t_er_co = await upsertConversation("t_er_co", "ROOTS_STUDENT_COACH", {},
    [{ userId: studentRacinesId, role: "MEMBER" }, { userId: coachId, role: "MODERATOR" }]);
  await seedFixtureMessage(t_er_co, "er_co_1", coachId, "TEXT", { body: "Écoute la séquence 2 avant jeudi." });

  const t_palabre = await upsertConversation("t_palabre", "ROOTS_PALABRE_GROUP", {},
    [{ userId: studentRacinesId, role: "MEMBER" }, { userId: coachId, role: "MODERATOR" }]);
  await seedFixtureMessage(t_palabre, "palabre_1", coachId, "TEXT", { body: "Cercle jeudi 18 h." });

  const t_km_en = await upsertConversation("t_km_en", "CHILD_WORLD_GUIDED", {},
    [{ childProfileId: childMonde.id, role: "MEMBER" },
     { userId: teacherId, role: "MODERATOR" },
     { userId: familyId, role: "GUARDIAN_OBSERVER" }]);
  await seedFixtureMessage(t_km_en, "km_en_1", teacherId, "TEXT", { body: "Bravo Lina !" });

  const t_kr_co = await upsertConversation("t_kr_co", "CHILD_ROOTS_GUIDED", {},
    [{ childProfileId: childRacines.id, role: "MEMBER" },
     { userId: coachId, role: "MODERATOR" },
     { userId: familyId, role: "GUARDIAN_OBSERVER" }]);
  await seedFixtureMessage(t_kr_co, "kr_co_1", coachId, "TEXT", { body: "Bien écouté Aïcha !" });

  const t_pa_en = await upsertConversation("t_pa_en", "FAMILY_TEACHER", {},
    [{ userId: familyId, role: "MEMBER" }, { userId: teacherId, role: "MODERATOR" }]);
  await seedFixtureMessage(t_pa_en, "pa_en_1", familyId, "TEXT", { body: "Bonjour, une question sur les devoirs ?" });

  const t_pa_ac = await upsertConversation("t_pa_ac", "FAMILY_CENTER_BILLING",
    { householdId: household?.id ?? null, centerId },
    [{ userId: familyId, role: "MEMBER" }, { userId: centerAdminId, role: "MODERATOR" }]);
  await seedFixtureMessage(t_pa_ac, "pa_ac_1", centerAdminId, "TEXT", { body: "Reçu de paiement disponible." });

  const t_pa_co = await upsertConversation("t_pa_co", "FAMILY_COACH", {},
    [{ userId: familyId, role: "MEMBER" }, { userId: coachId, role: "MODERATOR" }]);
  await seedFixtureMessage(t_pa_co, "pa_co_1", coachId, "TEXT", { body: "Suivi de la semaine." });

  const t_ac_en = await upsertConversation("t_ac_en", "CENTER_TEACHER_INTERNAL",
    { centerId },
    [{ userId: centerAdminId, role: "MODERATOR" }, { userId: teacherId, role: "MEMBER" }]);
  await seedFixtureMessage(t_ac_en, "ac_en_1", centerAdminId, "TEXT", { body: "Rappel réunion pédagogique." });

  const t_ac_co = await upsertConversation("t_ac_co", "CENTER_COACH_INTERNAL",
    { centerId },
    [{ userId: centerAdminId, role: "MODERATOR" }, { userId: coachId, role: "MEMBER" }]);
  await seedFixtureMessage(t_ac_co, "ac_co_1", centerAdminId, "TEXT", { body: "Charge Racines cette semaine." });

  const t_ac_sa = await upsertConversation("t_ac_sa", "CENTER_PLATFORM_SUPPORT",
    { centerId },
    [{ userId: centerAdminId, role: "MEMBER" }, { userId: superAdminId, role: "MODERATOR" }]);
  await seedFixtureMessage(t_ac_sa, "ac_sa_1", centerAdminId, "TEXT", { body: "Demande de support." });

  const t_sa_broadcast = await upsertConversation("t_sa_broadcast", "PLATFORM_BROADCAST", {},
    [{ userId: superAdminId, role: "MODERATOR" }, { userId: centerAdminId, role: "READ_ONLY" }]);
  await seedFixtureMessage(t_sa_broadcast, "sa_broadcast_1", superAdminId, "CARD", {
    cardType: "PLATFORM_BROADCAST",
    cardPayload: { title: "Maintenance planifiée", body: "Ce weekend 22h-23h." },
  });

  // P4.6-B.4 / C.3.1 · rattachement E2E · opt-in via envs.
  const e2e = await ensureE2ELinkage({ t_em_en, t_km_en, t_kr_co });
  if (!e2e.skipped) {
    process.stderr.write(`[e2e] Prisma linkage OK · teacher/student rattachés à t_em_en · outsider isolé\n`);
  }

  const summary = {
    conversations: [
      t_em_en, t_class_a1, t_er_co, t_palabre, t_km_en, t_kr_co,
      t_pa_en, t_pa_ac, t_pa_co, t_ac_en, t_ac_co, t_ac_sa, t_sa_broadcast,
    ],
    guidedPhrases: g.length,
    e2eLinkage: e2e.skipped ? "skipped (E2E envs absent)" : "linked",
    note: "AUCUN t_sa_audit · vue Metadata via adminProjection.ts",
  };
  process.stderr.write(`\n${JSON.stringify(summary, null, 2)}\n\nMESSAGING FIXTURES READY\n`);
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try { await db.$disconnect(); } catch {}
  process.exit(1);
});
