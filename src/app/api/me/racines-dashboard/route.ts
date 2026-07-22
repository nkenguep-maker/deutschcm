// P3 · GET /api/me/racines-dashboard · état complet du dashboard étudiant Racines.
// Session · STUDENT strict · retourne 200 même sans contenu (état honnête).
//
// Contenu par langue Racines · doctrine P3 §6 · tant que le contenu n'est pas
// prêt (READY), on ne rend PAS de leçons — l'écran affiche « Bientôt disponible ».

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  RACINES_STEP_DEFINITIONS,
  RACINES_LANG_STATUS,
  anyRacinesLanguageReady,
  inferProfileMode,
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

    // Enfants du parent · les ChildProfile sont filtrés par parentUserId
    // (server-resolved, jamais depuis un id client). Ownership cross-parent
    // impossible par construction.
    const children = await prisma.childProfile.findMany({
      where: { parentUserId: dbUser.id },
      select: {
        id: true, prenom: true, avatarAnimal: true, age: true,
        activeLangue: true, langues: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const mode = inferProfileMode(children.length);
    const answers = lp ? readAnswers(lp) : {};
    const langId = prismaLangToId(lp?.language ?? null);
    const langStatus = langId ? RACINES_LANG_STATUS[langId] ?? "MISSING" : null;
    const racinesStep = answers.racinesStep ?? answers.declaredLevel ?? null;

    return NextResponse.json({
      universe: "RACINES",
      hasLearningPath: Boolean(lp),
      learningPath: lp ? { id: lp.id, language: lp.language, currentLevel: lp.currentLevel } : null,
      mode,                                        // "SOLO" | "FAMILY"
      langStatus,                                  // "READY" | "PARTIAL" | "MISSING" | null
      anyLanguageReady: anyRacinesLanguageReady(), // false tant qu'aucune Racines n'est READY
      racinesStep,                                 // "E1".."E5" | null
      steps: RACINES_STEP_DEFINITIONS,             // définitions doctrinales §8
      children: children.map((c) => ({
        id: c.id,
        prenom: c.prenom,
        avatarAnimal: c.avatarAnimal,
        age: c.age,
        activeLangue: c.activeLangue,
        langues: Array.isArray(c.langues) ? c.langues : [],
      })),
      greetingName: dbUser.fullName ?? null,
    });
  } catch (e) {
    console.error("[racines-dashboard] FAIL", e);
    return err("INTERNAL", "internal error", 500);
  }
}
