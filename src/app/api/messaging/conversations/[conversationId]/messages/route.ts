// P4.6-A · GET / POST /api/messaging/conversations/[conversationId]/messages
// GET  : liste des messages (accès vérifié)
// POST : envoi de message (kind + contenu validés server-side)

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isMessagingEnabled } from "@/lib/flags";
import { resolveMessagingActor } from "@/lib/messaging/actor";
import { listConversationMessages } from "@/lib/messaging/conversations";
import { sendMessage } from "@/lib/messaging/messages";

export const dynamic = "force-dynamic";
function notFound() { return NextResponse.json({ error: "Not found" }, { status: 404 }); }
function badRequest(code: string) { return NextResponse.json({ error: "Bad request", code }, { status: 400 }); }
function forbidden(code: string) { return NextResponse.json({ error: "Forbidden", code }, { status: 403 }); }

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ conversationId: string }> },
) {
  if (!isMessagingEnabled()) return notFound();
  const actor = await resolveMessagingActor();
  if (!actor) return notFound();
  const { conversationId } = await ctx.params;
  const result = await listConversationMessages(actor, conversationId);
  if (!result.ok) return notFound();
  return NextResponse.json({ messages: result.messages });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ conversationId: string }> },
) {
  if (!isMessagingEnabled()) return notFound();
  const actor = await resolveMessagingActor();
  if (!actor) return notFound();
  const { conversationId } = await ctx.params;

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("bad_json"); }
  const b = (body ?? {}) as Record<string, unknown>;

  const kind = String(b.kind ?? "").toUpperCase() as
    | "TEXT" | "AUDIO" | "GUIDED_PHRASE" | "CARD" | "SYSTEM";
  if (!["TEXT", "AUDIO", "GUIDED_PHRASE", "CARD"].includes(kind)) {
    // SYSTEM refusé côté client. Autres valeurs invalides.
    return badRequest("invalid_kind");
  }

  const result = await sendMessage(actor, {
    conversationId,
    kind,
    body: typeof b.body === "string" ? b.body : null,
    guidedPhraseId: typeof b.guidedPhraseId === "string" ? b.guidedPhraseId : null,
    audioAssetId: typeof b.audioAssetId === "string" ? b.audioAssetId : null,
    cardType: (typeof b.cardType === "string" ? b.cardType : null) as never,
    cardPayload: (b.cardPayload ?? null) as Record<string, unknown> | null,
    replyToMessageId: typeof b.replyToMessageId === "string" ? b.replyToMessageId : null,
    idempotencyKey: typeof b.idempotencyKey === "string" ? b.idempotencyKey : null,
  });

  if (!result.ok) {
    if (result.error === "actor_not_allowed" || result.error === "conversation_not_found") {
      return notFound();
    }
    return forbidden(result.error);
  }
  return NextResponse.json({ messageId: result.messageId }, { status: 201 });
}
