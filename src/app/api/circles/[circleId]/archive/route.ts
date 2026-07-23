// P4.1 · POST /api/circles/[circleId]/archive
//
// Archive un Circle (OWNER uniquement). Idempotent · rejoue OK si déjà
// ARCHIVED. Aucune suppression, aucune donnée effacée. Un nouveau Circle
// peut être créé pour la même langue seulement APRÈS archivage (contrainte
// unique conditionnelle `@@unique([householdId, language])`).
//
// **Attention** · notre contrainte DB actuelle est unique sur (householdId,
// language) tous statuts confondus. Q9 valide "nouvelle langue = nouveau
// Circle". Si un OWNER souhaite recréer un Circle sur la MÊME langue après
// archivage, une migration future devra rendre la contrainte conditionnelle
// (WHERE status='ACTIVE'). Pour P4.1 · un archivage est terminal par langue.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFlag } from "@/lib/flags";
import {
  PermissionError,
  resolveCircleActor,
  assertCircleOwner,
} from "@/lib/permissions/circle";
import { writeAuditEvent } from "@/lib/audit/events";

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ circleId: string }> },
) {
  if (!getFlag("CIRCLE_ENABLED")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { circleId } = await params;

  let actor;
  try {
    actor = await resolveCircleActor();
  } catch (e) {
    if (e instanceof PermissionError) return err(e.code, e.message, e.code === "UNAUTHORIZED" ? 401 : 404);
    throw e;
  }

  try {
    await assertCircleOwner(circleId, actor);
  } catch (e) {
    if (e instanceof PermissionError) return err(e.code, e.message, 403);
    throw e;
  }

  const now = new Date();
  const circle = await prisma.$transaction(async (tx) => {
    const before = await tx.circle.findUnique({
      where: { id: circleId },
      select: { id: true, status: true },
    });
    if (!before) throw new PermissionError("NOT_FOUND", "circle not found");
    if (before.status === "ARCHIVED") return before;
    const updated = await tx.circle.update({
      where: { id: circleId },
      data: { status: "ARCHIVED", archivedAt: now },
      select: { id: true, status: true, archivedAt: true },
    });
    await writeAuditEvent(
      {
        actorUserId: actor.userId,
        actorRole: "OWNER",
        action: "CIRCLE_ARCHIVED",
        targetType: "Circle",
        targetId: circleId,
        metadata: { previousStatus: before.status },
      },
      tx,
    );
    return updated;
  });

  return NextResponse.json({ circle });
}
