// P4.1 · GET /api/circles/[circleId]
//
// Retourne les métadonnées du Circle si l'utilisateur en est membre ACTIVE.
// Aucune donnée messagerie, aucun contenu enfant fin. Feature flag requis.
//
// Contrat ·
//   200 · { circle: { id, householdId, language, status, activeAt, archivedAt }, membership: { id, role, status } }
//   401 · anonyme
//   403 · non membre ACTIVE
//   404 · circle absent · flag off (produit)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFlag } from "@/lib/flags";
import {
  PermissionError,
  resolveCircleActor,
  assertCircleMembership,
} from "@/lib/permissions/circle";

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ circleId: string }> },
) {
  if (!getFlag("CIRCLE_ENABLED")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { circleId } = await params;
  if (typeof circleId !== "string" || circleId.length < 4) {
    return err("VALIDATION_ERROR", "invalid circle id", 400);
  }

  let actor;
  try {
    actor = await resolveCircleActor();
  } catch (e) {
    if (e instanceof PermissionError) return err(e.code, e.message, e.code === "UNAUTHORIZED" ? 401 : 404);
    throw e;
  }

  let membership;
  try {
    membership = await assertCircleMembership(circleId, actor);
  } catch (e) {
    if (e instanceof PermissionError) return err(e.code, e.message, 403);
    throw e;
  }

  const circle = await prisma.circle.findUnique({
    where: { id: circleId },
    select: {
      id: true,
      householdId: true,
      language: true,
      status: true,
      activeAt: true,
      archivedAt: true,
    },
  });
  if (!circle) return err("NOT_FOUND", "circle not found", 404);

  return NextResponse.json({
    circle,
    membership: { id: membership.id, role: membership.role, status: membership.status },
  });
}
