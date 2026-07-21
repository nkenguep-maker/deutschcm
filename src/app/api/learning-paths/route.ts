// POST /api/learning-paths · crée un LearningPath depuis les réponses d'onboarding
// Appelé par /onboarding/{monde,racines} juste après supabase.auth.updateUser.
//
// Body : { universe, language, currentLevel?, intention?, onboardingAnswers? }
// Idempotent : si l'user a déjà un path (universe + language) ACTIF, on le
// met à jour au lieu d'en créer un doublon.
//
// Réponses :
//   200  { id, universe, language }
//   400  { error, code: "VALIDATION_ERROR", detail? }
//   401  { error, code: "UNAUTHORIZED" }
//   500  { error, code: "DB_CONFLICT" | "INTERNAL" }
//
// Codes stables pour que le client ne devine plus à l'aveugle. Toute
// erreur est loggée serveur avec le stack complet.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { reconcileDbUser } from "@/lib/reconcileDbUser";
import type { Universe, LanguageCode, CefrLevel, Intention } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const UNIVERSES: Universe[] = ["MONDE", "RACINES"];
const LANGUAGES: LanguageCode[] = ["DEUTSCH", "WOLOF", "DOUALA", "LINGALA", "BAMBARA", "YORUBA", "SWAHILI"];
const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];
const INTENTIONS: Intention[] = ["VISA_DEPART", "SUR_PLACE", "RACINES_SOI", "TRANSMISSION"];

function err(code: string, message: string, status: number, detail?: unknown) {
  return NextResponse.json({ error: message, code, ...(detail ? { detail } : {}) }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("UNAUTHORIZED", "Not signed in", 401);

    // Réconcilie la ligne users Prisma (idempotent, tolérant à un état partiel).
    // Voir src/lib/reconcileDbUser.ts pour la doctrine.
    const { user: dbUser, path } = await reconcileDbUser({ authUser: user });
    if (path !== "matched_supabase_id") {
      console.info(`[learning-paths] reconcile path=${path} for supabaseId=${user.id}`);
    }

    const body = await request.json().catch(() => ({}));
    const universe = body.universe as Universe;
    const language = body.language as LanguageCode;
    const currentLevel = body.currentLevel as CefrLevel | undefined;
    const intention = body.intention as Intention | undefined;
    const onboardingAnswers = (body.onboardingAnswers ?? {}) as Prisma.InputJsonValue;

    if (!UNIVERSES.includes(universe)) {
      return err("VALIDATION_ERROR", "invalid universe", 400, { field: "universe", got: universe });
    }
    if (!LANGUAGES.includes(language)) {
      return err("VALIDATION_ERROR", "invalid language", 400, { field: "language", got: language });
    }
    if (currentLevel && !LEVELS.includes(currentLevel)) {
      return err("VALIDATION_ERROR", "invalid level", 400, { field: "currentLevel", got: currentLevel });
    }
    if (intention && !INTENTIONS.includes(intention)) {
      return err("VALIDATION_ERROR", "invalid intention", 400, { field: "intention", got: intention });
    }

    const existing = await prisma.learningPath.findFirst({
      where: { userId: dbUser.id, universe, language, status: "ACTIVE" },
    });

    const learningPath = existing
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

    return NextResponse.json({ id: learningPath.id, universe: learningPath.universe, language: learningPath.language });
  } catch (e) {
    // Prisma error : on log complet côté serveur, on renvoie un code stable.
    const errObj = e as { code?: string; message?: string; meta?: unknown };
    console.error("[learning-paths] FAIL", {
      code: errObj.code,
      message: errObj.message,
      meta: errObj.meta,
      stack: e instanceof Error ? e.stack : undefined,
    });
    if (errObj.code === "P2002") {
      return err("DB_CONFLICT", "unique constraint violation", 500, { meta: errObj.meta });
    }
    return err("INTERNAL", errObj.message ?? "internal error", 500);
  }
}
