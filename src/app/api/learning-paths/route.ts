// POST /api/learning-paths · crée un LearningPath depuis les réponses d'onboarding
// Appelé par /onboarding/{monde,racines} juste après supabase.auth.updateUser.
//
// Body : { universe, language, currentLevel?, intention?, onboardingAnswers? }
// Idempotent : si l'user a déjà un path (universe + language) ACTIF, on le
// met à jour au lieu d'en créer un doublon.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Universe, LanguageCode, CefrLevel, Intention } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const UNIVERSES: Universe[] = ["MONDE", "RACINES"];
const LANGUAGES: LanguageCode[] = ["DEUTSCH", "WOLOF", "DOUALA", "LINGALA", "BAMBARA", "YORUBA", "SWAHILI"];
const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];
const INTENTIONS: Intention[] = ["VISA_DEPART", "SUR_PLACE", "RACINES_SOI", "TRANSMISSION"];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.upsert({
    where: { supabaseId: user.id },
    update: {},
    create: {
      supabaseId: user.id,
      email: user.email!,
      fullName: (user.user_metadata?.full_name as string) ?? user.email?.split("@")[0] ?? "Utilisateur",
    },
  });

  const body = await request.json().catch(() => ({}));
  const universe = body.universe as Universe;
  const language = body.language as LanguageCode;
  const currentLevel = body.currentLevel as CefrLevel | undefined;
  const intention = body.intention as Intention | undefined;
  const onboardingAnswers = (body.onboardingAnswers ?? {}) as Prisma.InputJsonValue;

  if (!UNIVERSES.includes(universe)) return NextResponse.json({ error: "invalid universe" }, { status: 400 });
  if (!LANGUAGES.includes(language)) return NextResponse.json({ error: "invalid language" }, { status: 400 });
  if (currentLevel && !LEVELS.includes(currentLevel)) return NextResponse.json({ error: "invalid level" }, { status: 400 });
  if (intention && !INTENTIONS.includes(intention)) return NextResponse.json({ error: "invalid intention" }, { status: 400 });

  const existing = await prisma.learningPath.findFirst({
    where: { userId: dbUser.id, universe, language, status: "ACTIVE" },
  });

  const path = existing
    ? await prisma.learningPath.update({
        where: { id: existing.id },
        data: {
          currentLevel: currentLevel ?? existing.currentLevel,
          intention: intention ?? existing.intention,
          onboardingAnswers: {
            ...(existing.onboardingAnswers as Record<string, unknown>),
            ...(onboardingAnswers as Record<string, unknown>),
          } as Prisma.InputJsonValue,
        },
      })
    : await prisma.learningPath.create({
        data: {
          userId: dbUser.id,
          universe,
          language,
          currentLevel,
          intention,
          onboardingAnswers,
        },
      });

  return NextResponse.json({ id: path.id, universe: path.universe, language: path.language });
}
