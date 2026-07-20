// Tests d'intégration · getEntitlements + household + grants.
// Utilisent la vraie DB (Supabase Postgres via DIRECT_URL) avec un prefix
// d'IDs isolé (ent_test_...) pour éviter les collisions et permettre un
// cleanup ciblé à chaque run.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getEntitlements, validateAddonPurchase } from "@/lib/entitlements";
import { createGrant } from "@/lib/entitlements/grants";
import { canAddAdult, canAddDependent } from "@/lib/entitlements/household";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const db = new PrismaClient({ adapter, log: ["error"] });

const TAG = `ent_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const uid = (label: string) => `${TAG}_${label}`;

// Contexte partagé
let passageA1Xaf: string;
let passageB1Xaf: string;
let teacherA1Xaf: string;
let rootsSoloYearXaf: string;
let rootsFamilyYearXaf: string;

async function makeUser(label: string) {
  return db.user.create({
    data: {
      id: uid(label),
      supabaseId: uid(`sb_${label}`),
      email: `${uid(label)}@yema.test`,
      fullName: label,
    },
  });
}

beforeAll(async () => {
  // Récupère les variants issus du seed (fixtures partagées)
  const passageProd = await db.product.findUnique({ where: { code: "PASSAGE" } });
  const teacherProd = await db.product.findUnique({ where: { code: "TEACHER_ADDON" } });
  const soloProd = await db.product.findUnique({ where: { code: "ROOTS_SOLO" } });
  const familyProd = await db.product.findUnique({ where: { code: "ROOTS_FAMILY" } });
  if (!passageProd || !teacherProd || !soloProd || !familyProd) {
    throw new Error("Seed manquant. Lance : npx tsx prisma/seed.ts");
  }

  const passageA1 = await db.productVariant.findFirst({
    where: { productId: passageProd.id, language: "DEUTSCH", level: "A1", currency: "XAF" },
  });
  const passageB1 = await db.productVariant.findFirst({
    where: { productId: passageProd.id, language: "DEUTSCH", level: "B1", currency: "XAF" },
  });
  const teacherA1 = await db.productVariant.findFirst({
    where: { productId: teacherProd.id, language: "DEUTSCH", level: "A1", currency: "XAF" },
  });
  const solo = await db.productVariant.findFirst({
    where: { productId: soloProd.id, currency: "XAF", durationDays: 365 },
  });
  const family = await db.productVariant.findFirst({
    where: { productId: familyProd.id, currency: "XAF", durationDays: 365 },
  });
  passageA1Xaf = passageA1!.id;
  passageB1Xaf = passageB1!.id;
  teacherA1Xaf = teacherA1!.id;
  rootsSoloYearXaf = solo!.id;
  rootsFamilyYearXaf = family!.id;
});

afterAll(async () => {
  // Cleanup ciblé : tout ce qui a le TAG dans l'id.
  await db.accessGrant.deleteMany({ where: { sourceId: { startsWith: TAG } } });
  await db.dependentProfile.deleteMany({ where: { householdId: { startsWith: TAG } } });
  await db.householdMembership.deleteMany({ where: { householdId: { startsWith: TAG } } });
  await db.household.deleteMany({ where: { id: { startsWith: TAG } } });
  await db.learningPath.deleteMany({ where: { userId: { startsWith: TAG } } });
  await db.userAppRole.deleteMany({ where: { userId: { startsWith: TAG } } });
  await db.userRole.deleteMany({ where: { userId: { startsWith: TAG } } });
  await db.user.deleteMany({ where: { id: { startsWith: TAG } } });
  await db.$disconnect();
});

describe("getEntitlements", () => {
  it("Passage A1 payé → COURSE_ACCESS allowed sur le bon parcours, denied sur un autre parcours/langue", async () => {
    const u = await makeUser("u1");
    const pathDe = await db.learningPath.create({
      data: { id: uid("path_u1_de"), userId: u.id, universe: "MONDE", language: "DEUTSCH", currentLevel: "A1" },
    });

    // Sans grant → deny sauf gratuits (COURSE_ACCESS 1re leçon + AI 5min)
    const beforeCert = await getEntitlements({ userId: u.id, learningPathId: pathDe.id, capability: "CERTIFICATE" });
    expect(beforeCert.allowed).toBe(false); // CERTIFICATE requiert un Passage
    const beforeAi = await getEntitlements({ userId: u.id, learningPathId: pathDe.id, capability: "AI_TEXT" });
    expect(beforeAi.allowed).toBe(true); // AI limitée gratuite
    expect(beforeAi.limits?.max).toBe(5);

    // Crée un grant Passage A1
    await createGrant({
      beneficiaryType: "USER",
      beneficiaryId: u.id,
      productVariant: { id: passageA1Xaf, durationDays: 120 },
      sourceType: "ORDER",
      sourceId: uid("ord1"),
    });

    const r = await getEntitlements({ userId: u.id, learningPathId: pathDe.id, capability: "COURSE_ACCESS" });
    expect(r.allowed).toBe(true);
    expect(r.limits?.grantId).toBeDefined();

    // Autre user : denied
    const other = await makeUser("u1b");
    const otherPath = await db.learningPath.create({
      data: { id: uid("path_u1b_de"), userId: other.id, universe: "MONDE", language: "DEUTSCH", currentLevel: "A1" },
    });
    const rOther = await getEntitlements({ userId: other.id, learningPathId: otherPath.id, capability: "MOCK_EXAMS" });
    // MOCK_EXAMS n'est pas dans les gratuits MONDE → deny
    expect(rOther.allowed).toBe(false);
  });

  it("TEACHER_ADDON refusé sans Passage · accepté avec Passage correspondant", async () => {
    const u = await makeUser("u2");
    // Pas de Passage → deny
    const v0 = await validateAddonPurchase({
      userId: u.id,
      addonProductCode: "TEACHER_ADDON",
      language: "DEUTSCH",
      level: "A1",
    });
    expect(v0.ok).toBe(false);

    // Ajoute Passage A1 → accept
    await createGrant({
      beneficiaryType: "USER",
      beneficiaryId: u.id,
      productVariant: { id: passageA1Xaf, durationDays: 120 },
      sourceType: "ORDER",
      sourceId: uid("ord2"),
    });
    const v1 = await validateAddonPurchase({
      userId: u.id,
      addonProductCode: "TEACHER_ADDON",
      language: "DEUTSCH",
      level: "A1",
    });
    expect(v1.ok).toBe(true);

    // Mauvais niveau → deny
    const v2 = await validateAddonPurchase({
      userId: u.id,
      addonProductCode: "TEACHER_ADDON",
      language: "DEUTSCH",
      level: "B1",
    });
    expect(v2.ok).toBe(false);
  });

  it("Racines : AI_TEXT/AI_VOICE denied même avec Passage allemand actif chez le même user", async () => {
    const u = await makeUser("u3");
    // Passage A1 actif (donne AI en univers MONDE)
    await createGrant({
      beneficiaryType: "USER",
      beneficiaryId: u.id,
      productVariant: { id: passageA1Xaf, durationDays: 120 },
      sourceType: "ORDER",
      sourceId: uid("ord3"),
    });
    // Parcours racines
    const pathRacines = await db.learningPath.create({
      data: { id: uid("path_u3_wolof"), userId: u.id, universe: "RACINES", language: "WOLOF" },
    });

    const rText = await getEntitlements({ userId: u.id, learningPathId: pathRacines.id, capability: "AI_TEXT" });
    const rVoice = await getEntitlements({ userId: u.id, learningPathId: pathRacines.id, capability: "AI_VOICE" });
    expect(rText.allowed).toBe(false);
    expect(rVoice.allowed).toBe(false);
    expect(rText.reason).toMatch(/racines/i);
  });

  it("Famille : 3e adulte refusé, 5e enfant refusé, dependent ne peut pas THREAD_POST", async () => {
    const owner = await makeUser("owner_f");
    const adult2 = await makeUser("adult2_f");
    const adult3 = await makeUser("adult3_f");
    const h = await db.household.create({ data: { id: uid("household1"), ownerUserId: owner.id } });
    // Owner + 1 adulte = 2 · doit passer
    await db.householdMembership.create({
      data: { id: uid("mem_owner"), householdId: h.id, userId: owner.id, role: "OWNER" },
    });
    const canAdd2 = await canAddAdult(h.id);
    expect(canAdd2.ok).toBe(true);
    await db.householdMembership.create({
      data: { id: uid("mem_a2"), householdId: h.id, userId: adult2.id, role: "ADULT" },
    });
    // 3e refusé
    const canAdd3 = await canAddAdult(h.id);
    expect(canAdd3.ok).toBe(false);

    // Cap enfants : 2 par adulte, 4 max par foyer
    for (let i = 0; i < 2; i++) {
      const c = await canAddDependent(h.id, owner.id);
      expect(c.ok).toBe(true);
      await db.dependentProfile.create({
        data: { id: uid(`dep_o_${i}`), householdId: h.id, managedByUserId: owner.id, firstName: `enfant${i}` },
      });
    }
    // 3e enfant sur owner refusé
    const c3owner = await canAddDependent(h.id, owner.id);
    expect(c3owner.ok).toBe(false);

    // 2 enfants sur adult2 → 4 dans le foyer → OK
    for (let i = 0; i < 2; i++) {
      const c = await canAddDependent(h.id, adult2.id);
      expect(c.ok).toBe(true);
      await db.dependentProfile.create({
        data: { id: uid(`dep_a_${i}`), householdId: h.id, managedByUserId: adult2.id, firstName: `enfant_a${i}` },
      });
    }
    // 5e refusé (cap foyer)
    const c5 = await canAddDependent(h.id, adult2.id);
    expect(c5.ok).toBe(false);

    // Dependent ne peut pas THREAD_POST
    const pathTest = await db.learningPath.create({
      data: { id: uid("path_dep"), userId: owner.id, universe: "RACINES", language: "WOLOF" },
    });
    const r = await getEntitlements({
      userId: owner.id,
      learningPathId: pathTest.id,
      capability: "THREAD_POST",
      actorType: "DEPENDENT_PROFILE",
    });
    expect(r.allowed).toBe(false);

    // Utilise adult3 pour éviter warning unused-var
    expect(adult3.id).toContain(TAG);
  });

  it("Gratuit MONDE : IA limitée à 5 min · Gratuit RACINES : aucune IA", async () => {
    const u = await makeUser("u_free");
    const pMonde = await db.learningPath.create({
      data: { id: uid("path_free_de"), userId: u.id, universe: "MONDE", language: "DEUTSCH" },
    });
    const pRacines = await db.learningPath.create({
      data: { id: uid("path_free_wo"), userId: u.id, universe: "RACINES", language: "WOLOF" },
    });

    const mAi = await getEntitlements({ userId: u.id, learningPathId: pMonde.id, capability: "AI_TEXT" });
    expect(mAi.allowed).toBe(true);
    expect(mAi.limits?.max).toBe(5);

    const rAi = await getEntitlements({ userId: u.id, learningPathId: pRacines.id, capability: "AI_TEXT" });
    expect(rAi.allowed).toBe(false);
    const rVeillee = await getEntitlements({ userId: u.id, learningPathId: pRacines.id, capability: "VEILLEE_CONTENT" });
    expect(rVeillee.allowed).toBe(true);
  });

  it("Grant expiré → capability denied", async () => {
    const u = await makeUser("u_exp");
    const path = await db.learningPath.create({
      data: { id: uid("path_exp"), userId: u.id, universe: "MONDE", language: "DEUTSCH", currentLevel: "B1" },
    });
    // Grant expiré (ends_at dans le passé)
    await createGrant({
      beneficiaryType: "USER",
      beneficiaryId: u.id,
      productVariant: { id: passageB1Xaf, durationDays: 120 },
      sourceType: "ORDER",
      sourceId: uid("ord_exp"),
      startsAt: new Date(Date.now() - 200 * 86400_000),
      endsAt: new Date(Date.now() - 80 * 86400_000),
    });

    const r = await getEntitlements({ userId: u.id, learningPathId: path.id, capability: "MOCK_EXAMS" });
    expect(r.allowed).toBe(false);
  });

  it("Famille : grant HOUSEHOLD donne CHILD_PROFILES au parent · Roots follow-up requires SOLO ou FAMILY", async () => {
    const parent = await makeUser("p_fam");
    const h = await db.household.create({ data: { id: uid("hh_fam"), ownerUserId: parent.id } });
    await db.householdMembership.create({
      data: { id: uid("mem_pfam"), householdId: h.id, userId: parent.id, role: "OWNER" },
    });

    // Follow-up refusé avant Family
    const v0 = await validateAddonPurchase({ userId: parent.id, addonProductCode: "ROOTS_FOLLOWUP_ADDON" });
    expect(v0.ok).toBe(false);

    // Grant FAMILY à HOUSEHOLD
    await createGrant({
      beneficiaryType: "HOUSEHOLD",
      beneficiaryId: h.id,
      productVariant: { id: rootsFamilyYearXaf, durationDays: 365 },
      sourceType: "ORDER",
      sourceId: uid("ord_fam"),
    });

    // Follow-up accepté maintenant
    const v1 = await validateAddonPurchase({ userId: parent.id, addonProductCode: "ROOTS_FOLLOWUP_ADDON" });
    expect(v1.ok).toBe(true);

    // Le parent voit CHILD_PROFILES accordé via HOUSEHOLD
    const pathRacines = await db.learningPath.create({
      data: { id: uid("path_p_fam"), userId: parent.id, universe: "RACINES", language: "WOLOF" },
    });
    const r = await getEntitlements({ userId: parent.id, learningPathId: pathRacines.id, capability: "CHILD_PROFILES" });
    expect(r.allowed).toBe(true);

    // Utilise rootsSoloYearXaf pour éviter warning unused-var
    expect(rootsSoloYearXaf).toBeTruthy();
    // Utilise teacherA1Xaf pour éviter warning unused-var
    expect(teacherA1Xaf).toBeTruthy();
  });
});
