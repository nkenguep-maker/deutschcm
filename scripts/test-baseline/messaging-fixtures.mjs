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

  const summary = {
    conversations: [
      t_em_en, t_class_a1, t_er_co, t_palabre, t_km_en, t_kr_co,
      t_pa_en, t_pa_ac, t_pa_co, t_ac_en, t_ac_co, t_ac_sa, t_sa_broadcast,
    ],
    guidedPhrases: g.length,
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
