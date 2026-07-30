// P4.6-A · POST /api/messaging/conversations/[conversationId]/read
// Marque une conversation lue jusqu'à lastReadMessageId inclus.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isMessagingEnabled } from "@/lib/flags";
import { resolveMessagingActor } from "@/lib/messaging/actor";
import { markConversationReadForActor } from "@/lib/messaging/conversations";

export const dynamic = "force-dynamic";
function notFound() { return NextResponse.json({ error: "Not found" }, { status: 404 }); }
function badRequest(code: string) { return NextResponse.json({ error: "Bad request", code }, { status: 400 }); }

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
  const lastReadMessageId = typeof b.lastReadMessageId === "string" ? b.lastReadMessageId : null;
  if (!lastReadMessageId) return badRequest("missing_lastReadMessageId");

  const result = await markConversationReadForActor(actor, conversationId, lastReadMessageId);
  if (!result.ok) return notFound();
  return NextResponse.json({ ok: true });
}
