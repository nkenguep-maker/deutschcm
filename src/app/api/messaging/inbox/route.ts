// P4.6-A · GET /api/messaging/inbox
// Liste des conversations dont l'acteur est participant ACTIF.
// Aucun body, aucun contenu · projection minimale.

import { NextResponse } from "next/server";
import { isMessagingEnabled } from "@/lib/flags";
import { resolveMessagingActor } from "@/lib/messaging/actor";
import { listInboxForActor } from "@/lib/messaging/conversations";

export const dynamic = "force-dynamic";
function notFound() { return NextResponse.json({ error: "Not found" }, { status: 404 }); }

export async function GET() {
  if (!isMessagingEnabled()) return notFound();
  const actor = await resolveMessagingActor();
  if (!actor) return notFound();
  const conversations = await listInboxForActor(actor);
  return NextResponse.json({ conversations });
}
