// P4.3b · GET /api/teacher/schedule · LOCK_HONESTLY.
//
// Aucun modèle de planning persistant n'existe côté schéma actuel. Cette
// route retourne un contrat stable `{ available: false }` que l'UI convertit
// en placeholder honnête. Elle n'invente aucun horaire.

import { NextResponse } from "next/server";
import { isTeacherWorkspaceActive } from "@/lib/flags";
import { resolveTeacherActor } from "@/lib/permissions/teacher";
import { getTeacherSchedule } from "@/lib/teacher/queries";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function GET() {
  if (!isTeacherWorkspaceActive()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const actor = await resolveTeacherActor();
    const schedule = await getTeacherSchedule(actor.teacherId);
    return NextResponse.json({ schedule });
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
