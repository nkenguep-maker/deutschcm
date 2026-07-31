// P4.6-B.1 · GET /api/messaging/self
// Retourne le nom du canal Realtime "inbox" à écouter pour l'acteur courant.
// Aucun contenu · uniquement l'identifiant opaque du canal.
// Gate 404 stable si flag off.

import { NextResponse } from "next/server";
import { isMessagingEnabled } from "@/lib/flags";
import { resolveMessagingActor } from "@/lib/messaging/actor";
import {
  inboxChildChannelName,
  inboxUserChannelName,
} from "@/lib/messaging/realtimePublisher";

export const dynamic = "force-dynamic";
function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET() {
  if (!isMessagingEnabled()) return notFound();
  const actor = await resolveMessagingActor();
  if (!actor) return notFound();

  const channelName =
    actor.actorType === "USER"
      ? inboxUserChannelName(actor.userId!)
      : inboxChildChannelName(actor.childProfileId!);

  return NextResponse.json({ channelName });
}
