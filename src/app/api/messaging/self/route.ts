// P4.6-B.1 / .2 · GET /api/messaging/self
//
// Retourne le nom du canal Realtime "inbox" pour l'acteur courant.
// Aucun contenu · uniquement l'identifiant opaque du canal.
// Gate 404 stable si flag off.
//
// P4.6-B.2 · session enfant · aucun `auth.uid()` côté Supabase
// (cookie HMAC custom). Les policies RLS sur realtime.messages ne
// peuvent pas autoriser un ChildProfile. Le canal enfant est donc
// server-only et le client enfant reçoit `channelName: null` ·
// InboxList/MessagesInboxLink skip la souscription Realtime · seul le
// polling 15s (useConversationSync fast) rattrape les événements.

import { NextResponse } from "next/server";
import { isMessagingEnabled } from "@/lib/flags";
import { resolveMessagingActor } from "@/lib/messaging/actor";
import { inboxUserChannelName } from "@/lib/messaging/realtimePublisher";

export const dynamic = "force-dynamic";
function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET() {
  if (!isMessagingEnabled()) return notFound();
  const actor = await resolveMessagingActor();
  if (!actor) return notFound();

  // P4.6-B.2 · seuls les acteurs USER (Supabase Auth) reçoivent un
  // channelName pour Realtime privé · les enfants passent en polling.
  if (actor.actorType !== "USER") {
    return NextResponse.json({ channelName: null, realtimeAvailable: false });
  }

  return NextResponse.json({
    channelName: inboxUserChannelName(actor.userId!),
    realtimeAvailable: true,
  });
}
