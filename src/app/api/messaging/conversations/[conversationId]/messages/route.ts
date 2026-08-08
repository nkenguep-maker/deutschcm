// P4.6-A · GET / POST /api/messaging/conversations/[conversationId]/messages
// GET  : liste des messages (accès vérifié)
// POST : envoi de message texte/guidé uniquement. L'audio passe par
//        /api/messaging/conversations/[conversationId]/audio et les CARD/SYSTEM
//        sont réservés aux actions serveur de domaine.

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
function rateLimited() {
  return NextResponse.json(
    { error: "Too many requests", code: "rate_limited" },
    { status: 429, headers: { "Retry-After": "300" } },
  );
}

const BAD_REQUEST_DENIALS = new Set([
  "text_required_missing",
  "text_too_long",
  "guided_phrase_missing_or_inactive",
  "guided_phrase_wrong_scope",
  "idempotency_key_invalid",
]);

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

  const kind = String(b.kind ?? "").toUpperCase() as "TEXT" | "GUIDED_PHRASE";
  if (!["TEXT", "GUIDED_PHRASE"].includes(kind)) {
    // AUDIO a son endpoint multipart dédié. CARD et SYSTEM sont émis par
    // des actions serveur de domaine, jamais par un payload client générique.
    return badRequest("invalid_kind");
  }

  const result = await sendMessage(actor, {
    conversationId,
    kind,
    body: typeof b.body === "string" ? b.body : null,
    guidedPhraseId: typeof b.guidedPhraseId === "string" ? b.guidedPhraseId : null,
    idempotencyKey: typeof b.idempotencyKey === "string" ? b.idempotencyKey : null,
  });

  if (!result.ok) {
    if (result.error === "actor_not_allowed" || result.error === "conversation_not_found") {
      return notFound();
    }
    if (result.error === "rate_limited") return rateLimited();
    if (BAD_REQUEST_DENIALS.has(result.error)) return badRequest(result.error);
    return forbidden(result.error);
  }
  return NextResponse.json({ messageId: result.messageId }, { status: 201 });
}
