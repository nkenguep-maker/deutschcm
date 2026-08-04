import "server-only";

import type { AppRole, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getInternalPersonaContract,
  type InternalPersonaId,
} from "@/lib/internalTest";

export interface InternalPersonaFixtureRef {
  centerId: string;
  householdId: string;
  mondePathId: string;
  racinesPathId: string;
  childMonde: { id: string };
  childRacines: { id: string };
}

export interface InternalPersonaVerification {
  persona: InternalPersonaId;
  checks: string[];
}

function fail(persona: InternalPersonaId, attribute: string): never {
  throw new Error(`internal persona ${persona} missing attribute: ${attribute}`);
}

function hasInternalTestMarker(value: unknown): boolean {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as Record<string, unknown>).internalTest === true,
  );
}

export async function verifyInternalPersonaFixture(params: {
  persona: InternalPersonaId;
  userId: string;
  fixture: InternalPersonaFixtureRef;
}): Promise<InternalPersonaVerification> {
  const contract = getInternalPersonaContract(params.persona);
  const checks: string[] = [];

  const spaceRole = await prisma.userRole.findFirst({
    where: {
      userId: params.userId,
      role: contract.spaceRole as Role,
      status: "ACTIVE",
      onboarded: true,
    },
    select: { id: true },
  });
  if (!spaceRole) fail(params.persona, `${contract.spaceRole} role`);
  checks.push(`space:${contract.spaceRole}`);

  if (contract.appRole) {
    const appRole = await prisma.userAppRole.findUnique({
      where: {
        userId_role: {
          userId: params.userId,
          role: contract.appRole as AppRole,
        },
      },
      select: { id: true },
    });
    if (!appRole) fail(params.persona, `${contract.appRole} app role`);
    checks.push(`app:${contract.appRole}`);
  }

  if (params.persona === "teacher" || params.persona === "center_admin") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: params.userId },
      select: {
        isVerified: true,
        centerId: true,
        languages: true,
        center: { select: { id: true, isVerified: true } },
      },
    });
    if (!teacher?.isVerified) fail(params.persona, "verified teacher binding");
    if (!teacher.centerId || teacher.centerId !== params.fixture.centerId || !teacher.center?.isVerified) {
      fail(params.persona, "verified center binding");
    }
    checks.push("binding:center");
    if (params.persona === "teacher") {
      if (!teacher.languages.includes("DEUTSCH")) fail(params.persona, "DEUTSCH language");
      checks.push("language:DEUTSCH");
    }
  }

  if (params.persona === "student_monde") {
    const path = await prisma.learningPath.findUnique({
      where: { id: params.fixture.mondePathId },
      select: {
        userId: true,
        universe: true,
        language: true,
        currentLevel: true,
        status: true,
        onboardingAnswers: true,
      },
    });
    if (!path || path.userId !== params.userId || path.status !== "ACTIVE") fail(params.persona, "active Monde path");
    if (path.universe !== "MONDE" || path.language !== "DEUTSCH" || path.currentLevel !== "A1") {
      fail(params.persona, "MONDE/DEUTSCH/A1 path");
    }
    if (!hasInternalTestMarker(path.onboardingAnswers)) fail(params.persona, "internal Monde fixture marker");
    checks.push("path:MONDE/DEUTSCH/A1");
  }

  if (params.persona === "student_racines" || params.persona === "coach") {
    const path = await prisma.learningPath.findUnique({
      where: { id: params.fixture.racinesPathId },
      select: {
        userId: true,
        universe: true,
        language: true,
        status: true,
        onboardingAnswers: true,
      },
    });
    if (!path || path.userId !== params.userId || path.status !== "ACTIVE") fail(params.persona, "active Racines path");
    if (path.universe !== "RACINES" || path.language !== "WOLOF") fail(params.persona, "RACINES/WOLOF path");
    if (!hasInternalTestMarker(path.onboardingAnswers)) fail(params.persona, "internal Racines fixture marker");
    checks.push("path:RACINES/WOLOF/E1");
  }

  if (params.persona === "family") {
    const household = await prisma.household.findFirst({
      where: {
        id: params.fixture.householdId,
        ownerUserId: params.userId,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (!household) fail(params.persona, "active household ownership");

    const grants = await prisma.accessGrant.findMany({
      where: {
        beneficiaryType: "HOUSEHOLD",
        beneficiaryId: params.fixture.householdId,
        status: "ACTIVE",
        productVariant: {
          product: { code: { in: ["FAMILY_WORLD", "ROOTS_FAMILY"] } },
        },
      },
      select: {
        productVariant: { select: { product: { select: { code: true } } } },
      },
    });
    const codes = new Set(grants.map((grant) => grant.productVariant.product.code));
    if (!codes.has("FAMILY_WORLD")) fail(params.persona, "FAMILY_WORLD grant");
    if (!codes.has("ROOTS_FAMILY")) fail(params.persona, "ROOTS_FAMILY grant");
    checks.push("household:WORLD+ROOTS");
  }

  if (params.persona === "child_monde" || params.persona === "child_racines") {
    const expected = params.persona === "child_monde"
      ? { id: params.fixture.childMonde.id, universe: "MONDE", language: "deutsch" }
      : { id: params.fixture.childRacines.id, universe: "RACINES", language: "wolof" };
    const child = await prisma.childProfile.findUnique({
      where: { id: expected.id },
      select: {
        parentUserId: true,
        householdId: true,
        universe: true,
        activeLangue: true,
      },
    });
    if (!child || child.parentUserId !== params.userId || child.householdId !== params.fixture.householdId) {
      fail(params.persona, "owned child profile");
    }
    if (child.universe !== expected.universe || child.activeLangue !== expected.language) {
      fail(params.persona, `${expected.universe}/${expected.language} child profile`);
    }
    checks.push(`child:${expected.universe}/${expected.language}`);
  }

  return { persona: params.persona, checks };
}
