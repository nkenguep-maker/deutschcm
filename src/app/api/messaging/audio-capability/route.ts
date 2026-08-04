// P4.6-C.2 · GET /api/messaging/audio-capability
// Retourne { enabled: boolean } · reflet server-only de
// YEMA_MESSAGE_AUDIO_ENABLED. AUCUN NEXT_PUBLIC · le client interroge
// cet endpoint côté navigateur pour savoir s'il doit activer le mic.
//
// 404 si YEMA_MESSAGING_ENABLED lui-même est off (aucun endpoint
// messaging visible).

import { NextResponse } from "next/server";
import { isMessagingAudioEnabled, isMessagingEnabled } from "@/lib/flags";
import { resolveMessagingActor } from "@/lib/messaging/actor";

export const dynamic = "force-dynamic";
function notFound() { return NextResponse.json({ error: "Not found" }, { status: 404 }); }

export async function GET() {
  if (!isMessagingEnabled()) return notFound();
  const actor = await resolveMessagingActor();
  if (!actor) return notFound();
  return NextResponse.json({ enabled: isMessagingAudioEnabled() });
}
