// P4.6-B · GET /api/messaging/unread-summary
// Retourne { totalUnread, conversationsWithUnread } · consommé par les
// badges dashboards. Gate 404 stable si flag off.

import { NextResponse } from "next/server";
import { isMessagingEnabled } from "@/lib/flags";
import { resolveMessagingActor } from "@/lib/messaging/actor";
import { getUnreadMessagingSummaryForActor } from "@/lib/messaging/inbox";

export const dynamic = "force-dynamic";
function notFound() { return NextResponse.json({ error: "Not found" }, { status: 404 }); }

export async function GET() {
  if (!isMessagingEnabled()) return notFound();
  const actor = await resolveMessagingActor();
  if (!actor) return notFound();
  const summary = await getUnreadMessagingSummaryForActor(actor);
  return NextResponse.json(summary);
}
