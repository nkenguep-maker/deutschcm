// P4.1 · POST /api/circles
//
// Crée un Circle sous un Household (owner uniquement).
// Feature flag `CIRCLE_ENABLED` requis → 404 côté produit si off.
//
// Contrat ·
//   body · { householdId: string, language: LanguageCode }
//   200  · { circle: { id, householdId, language, status, activeAt } }
//   400  · validation
//   401  · anonyme
//   403  · pas owner du household · flag off
//   404  · household inexistant
//   409  · circle_language_already_active

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { LanguageCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getFlag } from "@/lib/flags";
import {
  PermissionError,
  resolveCircleActor,
  assertHouseholdOwnership,
} from "@/lib/permissions/circle";
import {
  CapacityError,
  assertUniqueActiveHouseholdLanguageCircle,
} from "@/lib/circles/capacity";
import { writeAuditEvent } from "@/lib/audit/events";

const LANG_CODES = new Set([
  "DEUTSCH",
  "WOLOF",
  "DOUALA",
  "LINGALA",
  "BAMBARA",
  "YORUBA",
  "SWAHILI",
]);

function err(code: string, message: string, status: number, detail?: unknown) {
  return NextResponse.json({ error: message, code, ...(detail ? { detail } : {}) }, { status });
}

export async function POST(request: NextRequest) {
  if (!getFlag("CIRCLE_ENABLED")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let actor;
  try {
    actor = await resolveCircleActor();
  } catch (e) {
    if (e instanceof PermissionError) return err(e.code, e.message, e.code === "UNAUTHORIZED" ? 401 : 404);
    throw e;
  }

  const body = await request.json().catch(() => ({}));
  const householdId = typeof body?.householdId === "string" ? body.householdId : null;
  const language = typeof body?.language === "string" ? body.language : null;
  if (!householdId || !language) return err("VALIDATION_ERROR", "householdId and language required", 400);
  if (!LANG_CODES.has(language)) return err("VALIDATION_ERROR", "unsupported language", 400);

  try {
    await assertHouseholdOwnership(householdId, actor);
  } catch (e) {
    if (e instanceof PermissionError) return err(e.code, e.message, e.code === "FORBIDDEN" ? 403 : 404);
    throw e;
  }

  try {
    const circle = await prisma.$transaction(
      async (tx) => {
        await assertUniqueActiveHouseholdLanguageCircle(tx, householdId, language);
        const created = await tx.circle.create({
          data: {
            householdId,
            language: language as LanguageCode,
            status: "ACTIVE",
            createdByUserId: actor.userId,
          },
          select: { id: true, householdId: true, language: true, status: true, activeAt: true },
        });
        // Auto-crée la membership OWNER pour le créateur.
        await tx.circleMembership.create({
          data: {
            circleId: created.id,
            role: "OWNER",
            status: "ACTIVE",
            userId: actor.userId,
            invitedByUserId: actor.userId,
            joinedAt: new Date(),
          },
        });
        await writeAuditEvent(
          {
            actorUserId: actor.userId,
            actorRole: "OWNER",
            action: "CIRCLE_CREATED",
            targetType: "Circle",
            targetId: created.id,
            scopeType: "Household",
            scopeId: householdId,
            metadata: { language },
          },
          tx,
        );
        return created;
      },
      { isolationLevel: "Serializable" },
    );
    return NextResponse.json({ circle });
  } catch (e) {
    if (e instanceof CapacityError) {
      return err(e.code, e.message, 409, e.detail);
    }
    console.error("[POST /api/circles] FAIL", e);
    return err("INTERNAL", "internal error", 500);
  }
}
