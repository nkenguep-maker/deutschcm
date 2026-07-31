// P4.6-B · GET /api/messaging/guided-phrases?type=X&locale=fr|en
// Retourne les phrases guidées actives pour un type de conversation +
// locale. Utilisé UNIQUEMENT par le composer enfant. Aucune fuite entre
// univers (query where scope strict).

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { ConversationType } from "@prisma/client";
import { isMessagingEnabled } from "@/lib/flags";
import { resolveMessagingActor } from "@/lib/messaging/actor";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
function notFound() { return NextResponse.json({ error: "Not found" }, { status: 404 }); }

const ALLOWED_TYPES: ReadonlySet<ConversationType> = new Set([
  "CHILD_WORLD_GUIDED",
  "CHILD_ROOTS_GUIDED",
] as const);

export async function GET(req: NextRequest) {
  if (!isMessagingEnabled()) return notFound();
  const actor = await resolveMessagingActor();
  if (!actor) return notFound();

  const url = new URL(req.url);
  const rawType = url.searchParams.get("type") as ConversationType | null;
  const locale = url.searchParams.get("locale") === "en" ? "en" : "fr";
  if (!rawType || !ALLOWED_TYPES.has(rawType)) return notFound();

  // Sécurité · l'univers de l'enfant doit correspondre au type demandé.
  if (actor.actorType === "CHILD_PROFILE") {
    if (actor.persona === "child_monde" && rawType !== "CHILD_WORLD_GUIDED") return notFound();
    if (actor.persona === "child_racines" && rawType !== "CHILD_ROOTS_GUIDED") return notFound();
  }

  const phrases = await prisma.messagingGuidedPhrase.findMany({
    where: { conversationType: rawType, locale, isActive: true },
    orderBy: [{ ordering: "asc" }, { createdAt: "asc" }],
    select: { id: true, text: true, category: true, ordering: true },
  });
  return NextResponse.json({ phrases });
}
