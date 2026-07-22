// P1 · Funnel state endpoint · lit ou patch onboardingAnswers du LearningPath
// actif de l'utilisateur (voir docs/YEMA_P1_FUNNEL.md).
//
// Aucune nouvelle table : on branche sur LearningPath.onboardingAnswers JSON
// existant. Le patch fusionne les clés au niveau racine (jamais destructif).
//
// GET · renvoie l'état dérivé + le LearningPath actif (id, universe, language,
// currentLevel, onboardingAnswers).
// PATCH · body { patch: { discoveryProgress?: number[], activationIntent?: ... } }
// remplace les clés listées et écrit le résultat en DB.
//
// Refuse tout patch d'un champ non whitelisté (blindé côté serveur).

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  deriveFunnelStep,
  readAnswers,
  type ActivationIntent,
  type CefrLevel,
  type RacinesStep,
} from "@/lib/funnel-state";
import { DISCOVERY_TOTAL } from "@/lib/discovery";

const ALLOWED_KEYS = new Set(["cefrSelfAssessed", "racinesStep", "discoveryProgress", "activationIntent"]);
const CEFR: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];
const RACINES: RacinesStep[] = ["E1", "E2", "E3", "E4", "E5"];

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

async function loadContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, dbUser: null, lp: null, grant: false };
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });
  if (!dbUser) return { user, dbUser: null, lp: null, grant: false };
  const lp = await prisma.learningPath.findFirst({
    where: { userId: dbUser.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  // Grant actif = paiement réel. Aucun grant n'est accordé par le funnel P1.
  const grantCount = await prisma.accessGrant.count({
    where: {
      status: "ACTIVE",
      OR: [
        { beneficiaryType: "USER", beneficiaryId: dbUser.id },
        ...(lp ? [{ beneficiaryType: "LEARNING_PATH" as const, beneficiaryId: lp.id }] : []),
      ],
    },
  });
  return { user, dbUser, lp, grant: grantCount > 0 };
}

export async function GET() {
  try {
    const { user, lp, grant } = await loadContext();
    if (!user) return err("UNAUTHORIZED", "Not signed in", 401);
    const step = deriveFunnelStep({
      hasSupabaseUser: true,
      learningPath: lp,
      hasActiveAccessGrant: grant,
    });
    return NextResponse.json({
      step,
      hasActivation: grant,
      learningPath: lp
        ? {
            id: lp.id,
            universe: lp.universe,
            language: lp.language,
            currentLevel: lp.currentLevel,
            onboardingAnswers: lp.onboardingAnswers,
          }
        : null,
    });
  } catch (e) {
    console.error("[funnel GET] FAIL", e);
    return err("INTERNAL", "internal error", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, lp } = await loadContext();
    if (!user) return err("UNAUTHORIZED", "Not signed in", 401);
    if (!lp) return err("NO_LEARNING_PATH", "aucun parcours actif à mettre à jour", 400);

    const body = await request.json().catch(() => ({}));
    const patch = (body?.patch ?? {}) as Record<string, unknown>;

    for (const key of Object.keys(patch)) {
      if (!ALLOWED_KEYS.has(key)) {
        return err("VALIDATION_ERROR", `champ non autorisé: ${key}`, 400);
      }
    }

    // Validation stricte par champ.
    if (patch.cefrSelfAssessed !== undefined) {
      if (!CEFR.includes(patch.cefrSelfAssessed as CefrLevel)) {
        return err("VALIDATION_ERROR", "cefrSelfAssessed invalide", 400);
      }
    }
    if (patch.racinesStep !== undefined) {
      if (!RACINES.includes(patch.racinesStep as RacinesStep)) {
        return err("VALIDATION_ERROR", "racinesStep invalide", 400);
      }
    }
    if (patch.discoveryProgress !== undefined) {
      if (!Array.isArray(patch.discoveryProgress)) {
        return err("VALIDATION_ERROR", "discoveryProgress doit être un tableau", 400);
      }
      const ok = (patch.discoveryProgress as unknown[]).every(
        (n) => typeof n === "number" && n >= 1 && n <= DISCOVERY_TOTAL,
      );
      if (!ok) return err("VALIDATION_ERROR", "discoveryProgress values must be 1..4", 400);
    }
    if (patch.activationIntent !== undefined) {
      const ai = patch.activationIntent as ActivationIntent | null;
      if (ai === null || typeof ai !== "object") {
        return err("VALIDATION_ERROR", "activationIntent invalide", 400);
      }
      if (ai.currency !== "XAF" && ai.currency !== "EUR") {
        return err("VALIDATION_ERROR", "currency must be XAF or EUR", 400);
      }
      // universe check
      if (lp.universe === "MONDE") {
        if (ai.offer !== "PASSAGE") return err("VALIDATION_ERROR", "Monde: offer must be PASSAGE", 400);
        if (!ai.cefrLevel || !CEFR.includes(ai.cefrLevel)) {
          return err("VALIDATION_ERROR", "Monde: cefrLevel required", 400);
        }
      } else if (lp.universe === "RACINES") {
        if (ai.racinesOffer !== "SOLO" && ai.racinesOffer !== "FAMILLE") {
          return err("VALIDATION_ERROR", "Racines: racinesOffer must be SOLO or FAMILLE", 400);
        }
        if (ai.racinesPeriod !== "MONTH" && ai.racinesPeriod !== "YEAR") {
          return err("VALIDATION_ERROR", "Racines: racinesPeriod must be MONTH or YEAR", 400);
        }
      }
    }

    const existing = readAnswers(lp);
    const merged = { ...existing, ...patch };

    // Cas particulier : discoveryProgress se merge en UNION triée, pas remplace.
    if (patch.discoveryProgress !== undefined && Array.isArray(existing.discoveryProgress)) {
      const union = new Set<number>([
        ...(existing.discoveryProgress ?? []),
        ...(patch.discoveryProgress as number[]),
      ]);
      merged.discoveryProgress = Array.from(union).sort((a, b) => a - b);
    }

    // currentLevel column mirror pour Monde (permet des queries DB directes).
    let currentLevelUpdate = {};
    if (patch.cefrSelfAssessed && lp.universe === "MONDE") {
      currentLevelUpdate = { currentLevel: patch.cefrSelfAssessed as CefrLevel };
    }

    const updated = await prisma.learningPath.update({
      where: { id: lp.id },
      data: {
        ...currentLevelUpdate,
        onboardingAnswers: merged as Prisma.InputJsonValue,
      },
    });

    const step = deriveFunnelStep({
      hasSupabaseUser: true,
      learningPath: updated,
      hasActiveAccessGrant: false, // pas de nouveau grant possible via PATCH
    });

    return NextResponse.json({
      ok: true,
      step,
      onboardingAnswers: updated.onboardingAnswers,
    });
  } catch (e) {
    console.error("[funnel PATCH] FAIL", e);
    return err("INTERNAL", "internal error", 500);
  }
}
