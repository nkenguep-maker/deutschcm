// P3 · GET /api/me/racines-dashboard · état complet du dashboard étudiant Racines.

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  RACINES_STEP_DEFINITIONS,
  RACINES_LANG_STATUS,
  anyRacinesLanguageReady,
  resolveRacinesAccessMode,
  summarizeRacinesHousehold,
} from "@/lib/racines";
import { readAnswers } from "@/lib/funnel-state";
import { prismaLangToId } from "@/lib/discovery";
import {
  INTERNAL_TEST_COOKIE_NAME,
  isInternalPersonaId,
  isInternalTesterEmail,
} from "@/lib/internalTest";
import { hasInternalTestMarker } from "@/lib/internalTestProvisioning";

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("UNAUTHORIZED", "Not signed in", 401);

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, fullName: true },
    });
    if (!dbUser) return err("NOT_FOUND", "user profile missing", 404);

    const studentRole = await prisma.userRole.findFirst({
      where: { userId: dbUser.id, role: "STUDENT", status: "ACTIVE" },
      select: { id: true },
    });
    if (!studentRole) return err("FORBIDDEN_NOT_STUDENT", "STUDENT role required", 403);

    const candidates = await prisma.learningPath.findMany({
      where: { userId: dbUser.id, status: "ACTIVE", universe: "RACINES" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, universe: true, language: true, currentLevel: true,
        onboardingAnswers: true,
      },
    });
    const jar = await cookies();
    const rawPersona = jar.get(INTERNAL_TEST_COOKIE_NAME)?.value;
    const persona = isInternalPersonaId(rawPersona) ? rawPersona : null;
    const useInternal = isInternalTesterEmail(user.email) && persona === "student_racines";
    const lp = useInternal
      ? candidates.find((path) => hasInternalTestMarker(path.onboardingAnswers)) ?? candidates[0]
      : candidates.find((path) => !hasInternalTestMarker(path.onboardingAnswers)) ?? candidates[0];

    const grants = lp
      ? await prisma.accessGrant.findMany({
          where: {
            status: "ACTIVE",
            OR: [
              { beneficiaryType: "USER", beneficiaryId: dbUser.id },
              { beneficiaryType: "LEARNING_PATH", beneficiaryId: lp.id },
            ],
          },
          include: { productVariant: { include: { product: true } } },
        })
      : [];

    const racinesGrants = grants.filter((g) => {
      const p = g.productVariant?.product;
      return p && (p.universe === "RACINES" || p.code?.startsWith("ROOTS_"));
    });
    const activeGrant = racinesGrants.find((g) => !g.endsAt || new Date(g.endsAt).getTime() > Date.now());

    const children = await prisma.childProfile.findMany({
      where: { parentUserId: dbUser.id },
      select: {
        id: true, prenom: true, avatarAnimal: true, age: true,
        activeLangue: true, langues: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const household = await prisma.household.findFirst({
      where: { ownerUserId: dbUser.id, status: "ACTIVE" },
      select: { id: true },
    });

    const answers = lp ? readAnswers(lp) : {};
    const activationIntentOffer = answers.activationIntent?.racinesOffer ?? null;

    const mode = resolveRacinesAccessMode({
      hasActiveGrant: Boolean(activeGrant),
      grantProductCode: activeGrant?.productVariant?.product?.code ?? null,
      activationIntentOffer,
      hasLearningPath: Boolean(lp),
    });

    const householdSummary = summarizeRacinesHousehold(mode, children.length, Boolean(household));

    const langId = prismaLangToId(lp?.language ?? null);
    const langStatus = langId ? RACINES_LANG_STATUS[langId] ?? "MISSING" : null;
    const racinesStep = answers.racinesStep ?? answers.declaredLevel ?? null;

    return NextResponse.json({
      universe: "RACINES",
      hasLearningPath: Boolean(lp),
      learningPath: lp ? { id: lp.id, language: lp.language, currentLevel: lp.currentLevel } : null,
      mode,
      household: householdSummary,
      langStatus,
      anyLanguageReady: anyRacinesLanguageReady(),
      racinesStep,
      steps: RACINES_STEP_DEFINITIONS,
      children: children.map((c) => ({
        id: c.id,
        prenom: c.prenom,
        avatarAnimal: c.avatarAnimal,
        age: c.age,
        activeLangue: c.activeLangue,
        langues: Array.isArray(c.langues) ? c.langues : [],
      })),
      activeChildId: (user.user_metadata?.activeChildId as string | null) ?? null,
      greetingName: dbUser.fullName ?? null,
    });
  } catch (e) {
    console.error("[racines-dashboard] FAIL", e);
    return err("INTERNAL", "internal error", 500);
  }
}
