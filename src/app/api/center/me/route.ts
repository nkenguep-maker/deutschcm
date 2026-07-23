// P4.3a · GET /api/center/me
// Retourne le centre géré par l'utilisateur courant (projection minimale).

import { NextResponse } from "next/server";
import { isCenterRealDataActive } from "@/lib/flags";
import { resolveCenterActor } from "@/lib/permissions/center";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function GET() {
  if (!isCenterRealDataActive()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const actor = await resolveCenterActor();
    return NextResponse.json({ center: actor.center, actorRole: actor.actorRole });
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
