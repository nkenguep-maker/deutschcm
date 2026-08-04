import "server-only";

import type { AppRole, LanguageCode, Prisma, Role, Universe } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const INTERNAL_CENTER_CODE = "YEMA-INTERNAL";
const INTERNAL_TEACHER_CODE = "YEMA-INTERNAL-TEACHER";

const SPACE_ROLES: Role[] = ["STUDENT", "TEACHER", "CENTER", "ADMIN"];
const APP_ROLES: AppRole[] = [
  "LEARNER",
  "PARENT",
  "TEACHER",
  "CENTER_ADMIN",
  "YEMA_ADMIN",
  "RACINES_COACH",
];

function isInternalAnswers(value: unknown): boolean {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as Record<string, unknown>).internalTest === true,
  );
}

async function ensureInternalLearningPath(params: {
  userId: string;
  universe: Universe;
  language: LanguageCode;
  level?: "A1" | "A2" | "B1" | "B2" | "C1" | null;
}) {
  const rows = await prisma.learningPath.findMany({
    where: {
      userId: params.userId,
      universe: params.universe,
      language: params.language,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
  });
  const existing = rows.find((row) => isInternalAnswers(row.onboardingAnswers));
  const onboardingAnswers: Prisma.InputJsonValue = params.universe === "MONDE"
    ? {
        internalTest: true,
        why: "internal_test",
        startPoint: "beginner",
        selfAssessmentAnswer: 1,
        declaredLevel: params.level ?? "A1",
        recommendedLevel: params.level ?? "A1",
      }
    : {
        internalTest: true,
        link: "internal_test",
        startPoint: "beginner",
        racinesStep: "E1",
        declaredLevel: "E1",
        recommendedLevel: "E1",
      };

  if (existing) {
    return prisma.learningPath.update({
      where: { id: existing.id },
      data: {
        currentLevel: params.universe === "MONDE" ? (params.level ?? "A1") : null,
        onboardingAnswers,
        archivedAt: null,
        status: "ACTIVE",
      },
    });
  }

  return prisma.learningPath.create({
    data: {
      userId: params.userId,
      universe: params.universe,
      language: params.language,
      currentLevel: params.universe === "MONDE" ? (params.level ?? "A1") : null,
      intention: params.universe === "MONDE" ? "SUR_PLACE" : "RACINES_SOI",
      onboardingAnswers,
      status: "ACTIVE",
    },
  });
}

async function ensureFamilyProductVariant(params: {
  code: "FAMILY_WORLD" | "ROOTS_FAMILY";
  universe: Universe;
  language: LanguageCode;
  durationDays: number;
}) {
  const product = await prisma.product.upsert({
    where: { code: params.code },
    update: {},
    create: {
      code: params.code,
      universe: params.universe,
      billingType: params.code === "ROOTS_FAMILY" ? "SUBSCRIPTION" : "SEAT",
      isActive: params.code === "ROOTS_FAMILY",
    },
  });

  const existing = await prisma.productVariant.findFirst({
    where: {
      productId: product.id,
      language: params.language,
      level: null,
      currency: "XAF",
      durationDays: params.durationDays,
    },
  });
  if (existing) return existing;

  return prisma.productVariant.create({
    data: {
      productId: product.id,
      language: params.language,
      level: null,
      currency: "XAF",
      amount: 0,
      durationDays: params.durationDays,
      market: "INTERNAL_TEST",
      active: false,
    },
  });
}

async function ensureFixtureGrant(params: {
  householdId: string;
  productVariantId: string;
  sourceId: string;
}) {
  const existing = await prisma.accessGrant.findFirst({
    where: {
      beneficiaryType: "HOUSEHOLD",
      beneficiaryId: params.householdId,
      productVariantId: params.productVariantId,
      sourceType: "PROMO",
      sourceId: params.sourceId,
    },
  });
  const endsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  if (existing) {
    return prisma.accessGrant.update({
      where: { id: existing.id },
      data: { status: "ACTIVE", startsAt: new Date(), endsAt },
    });
  }
  return prisma.accessGrant.create({
    data: {
      beneficiaryType: "HOUSEHOLD",
      beneficiaryId: params.householdId,
      productVariantId: params.productVariantId,
      sourceType: "PROMO",
      sourceId: params.sourceId,
      startsAt: new Date(),
      endsAt,
      status: "ACTIVE",
      metadata: { internalTest: true } as Prisma.InputJsonValue,
    },
  });
}

export async function ensureInternalTestWorkspace(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) throw new Error("internal tester user not found");

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { onboardingDone: true, isValidated: true },
    });
    for (const role of SPACE_ROLES) {
      await tx.userRole.upsert({
        where: { userId_role: { userId, role } },
        update: { status: "ACTIVE", onboarded: true },
        create: { userId, role, status: "ACTIVE", onboarded: true, grantedBy: "internal-test" },
      });
    }
    for (const role of APP_ROLES) {
      await tx.userAppRole.upsert({
        where: { userId_role: { userId, role } },
        update: {},
        create: { userId, role, grantedBy: "internal-test" },
      });
    }
  });

  const center = await prisma.languageCenter.upsert({
    where: { code: INTERNAL_CENTER_CODE },
    update: { isVerified: true, plan: "internal-test" },
    create: {
      code: INTERNAL_CENTER_CODE,
      name: "YEMA Internal Test Center",
      city: "Berlin",
      country: "DE",
      isVerified: true,
      plan: "internal-test",
      description: "Fixture privée pour les tests internes Production YEMA.",
    },
  });

  await prisma.teacher.upsert({
    where: { userId },
    update: {
      centerId: center.id,
      isVerified: true,
      speciality: ["Internal test"],
      languages: ["DEUTSCH", "WOLOF"],
      certifications: [],
      code: INTERNAL_TEACHER_CODE,
    },
    create: {
      userId,
      centerId: center.id,
      isVerified: true,
      speciality: ["Internal test"],
      languages: ["DEUTSCH", "WOLOF"],
      certifications: [],
      code: INTERNAL_TEACHER_CODE,
      bio: "Fixture privée pour les tests internes Production YEMA.",
    },
  });
  await prisma.user.update({ where: { id: userId }, data: { centerId: center.id } });

  const [mondePath, racinesPath] = await Promise.all([
    ensureInternalLearningPath({ userId, universe: "MONDE", language: "DEUTSCH", level: "A1" }),
    ensureInternalLearningPath({ userId, universe: "RACINES", language: "WOLOF" }),
  ]);

  let household = await prisma.household.findFirst({
    where: { ownerUserId: userId, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });
  if (!household) {
    household = await prisma.household.create({ data: { ownerUserId: userId, status: "ACTIVE" } });
  }
  await prisma.householdMembership.upsert({
    where: { householdId_userId: { householdId: household.id, userId } },
    update: { status: "ACTIVE", role: "OWNER" },
    create: { householdId: household.id, userId, role: "OWNER", status: "ACTIVE" },
  });

  const familyWorldVariant = await ensureFamilyProductVariant({
    code: "FAMILY_WORLD",
    universe: "MONDE",
    language: "DEUTSCH",
    durationDays: 365,
  });
  const rootsFamilyVariant = await ensureFamilyProductVariant({
    code: "ROOTS_FAMILY",
    universe: "RACINES",
    language: "WOLOF",
    durationDays: 365,
  });
  await Promise.all([
    ensureFixtureGrant({
      householdId: household.id,
      productVariantId: familyWorldVariant.id,
      sourceId: "internal-test:FAMILY_WORLD",
    }),
    ensureFixtureGrant({
      householdId: household.id,
      productVariantId: rootsFamilyVariant.id,
      sourceId: "internal-test:ROOTS_FAMILY",
    }),
  ]);

  let childMonde = await prisma.childProfile.findFirst({
    where: { parentUserId: userId, prenom: "Test Monde", universe: "MONDE" },
  });
  if (!childMonde) {
    childMonde = await prisma.childProfile.create({
      data: {
        parentUserId: userId,
        householdId: household.id,
        prenom: "Test Monde",
        avatarAnimal: "chouette",
        age: 8,
        universe: "MONDE",
        activeLangue: "deutsch",
        learningGoal: "DAILY_LIFE",
        langues: [
          { langue: "deutsch", type: "foreign", echelle: "M1", etoiles: 0, motsAppris: [] },
        ] as Prisma.InputJsonValue,
      },
    });
  }

  let childRacines = await prisma.childProfile.findFirst({
    where: { parentUserId: userId, prenom: "Test Racines", universe: "RACINES" },
  });
  if (!childRacines) {
    childRacines = await prisma.childProfile.create({
      data: {
        parentUserId: userId,
        householdId: household.id,
        prenom: "Test Racines",
        avatarAnimal: "tortue",
        age: 9,
        universe: "RACINES",
        activeLangue: "wolof",
        langues: [
          { langue: "wolof", type: "native", echelle: "E1", etoiles: 0, motsAppris: [] },
        ] as Prisma.InputJsonValue,
      },
    });
  }

  return {
    centerId: center.id,
    householdId: household.id,
    mondePathId: mondePath.id,
    racinesPathId: racinesPath.id,
    childMonde: { id: childMonde.id, pinUpdatedAt: childMonde.pinUpdatedAt },
    childRacines: { id: childRacines.id, pinUpdatedAt: childRacines.pinUpdatedAt },
  };
}

export function hasInternalTestMarker(value: unknown): boolean {
  return isInternalAnswers(value);
}
