// P3 · GET /api/me/racines-dashboard · état complet du dashboard étudiant Racines.
// Session · STUDENT strict · retourne 200 même sans contenu (état honnête).
//
// Hardening §2 · le mode Solo/Famille vient de l'AccessGrant + Product ou
// de l'activationIntent, JAMAIS du nombre d'enfants. childrenCount ne
// devient qu'une info exposée séparément.

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

    // LearningPath Racines
    const lp = await prisma.learningPath.findFirst({
      where: { userId: dbUser.id, status: "ACTIVE", universe: "RACINES" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, universe: true, language: true, currentLevel: true,
        onboardingAnswers: true,
      },
    });

    // AccessGrants actifs pour ce user (Racines · include productVariant.product)
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

    // Ne considère que les grants Racines (product.universe === RACINES ou
    // product.code appartient à la famille Racines).
    const racinesGrants = grants.filter((g) => {
      const p = g.productVariant?.product;
      return p && (p.universe === "RACINES" || p.code?.startsWith("ROOTS_"));
    });
    const activeGrant = racinesGrants.find((g) => !g.endsAt || new Date(g.endsAt).getTime() > Date.now());

    // Enfants du parent · filtre parentUserId server-resolved
    const children = await prisma.childProfile.findMany({
      where: { parentUserId: dbUser.id },
      select: {
        id: true, prenom: true, avatarAnimal: true, age: true,
        activeLangue: true, langues: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Household existe-t-il ?
    const household = await prisma.household.findFirst({
      where: { ownerUserId: dbUser.id, status: "ACTIVE" },
      select: { id: true },
    });

    // Activation intent depuis onboardingAnswers (P1)
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
      mode,                                    // "SOLO" | "FAMILY" | "NO_ACCESS" | "UNKNOWN"
      household: householdSummary,             // { childrenCount, householdConfigured, incoherent }
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
      // activeChildId persisté côté user_metadata (P3 hardening §6).
      // Le front peut le lire directement depuis /api/me si besoin.
      activeChildId: (user.user_metadata?.activeChildId as string | null) ?? null,
      greetingName: dbUser.fullName ?? null,
    });
  } catch (e) {
    console.error("[racines-dashboard] FAIL", e);
    return err("INTERNAL", "internal error", 500);
  }
}
