// P4.6-B · GET /api/messaging/inbox
// Enrichi (P4.6-A → P4.6-B) : preview last message + unread count dérivé
// server-side + filtre persona (source unique dans lib/messaging/filters.ts).
// Gate 404 stable si YEMA_MESSAGING_ENABLED=false.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isMessagingEnabled } from "@/lib/flags";
import { resolveMessagingActor } from "@/lib/messaging/actor";
import { listInboxRowsForActor } from "@/lib/messaging/inbox";
import { getDefaultFilter, getFiltersForPersona, type MessagingFilterKey } from "@/lib/messaging/filters";

export const dynamic = "force-dynamic";
function notFound() { return NextResponse.json({ error: "Not found" }, { status: 404 }); }

export async function GET(req: NextRequest) {
  if (!isMessagingEnabled()) return notFound();
  const actor = await resolveMessagingActor();
  if (!actor) return notFound();

  const url = new URL(req.url);
  const filterKey = (url.searchParams.get("filter") ?? "") as MessagingFilterKey | "";
  const filters = getFiltersForPersona(actor.persona);
  const filter = filters.find((f) => f.key === filterKey) ?? getDefaultFilter(actor.persona);

  const conversations = await listInboxRowsForActor(actor, filter);
  return NextResponse.json({
    persona: actor.persona,
    filter: filter.key,
    conversations,
    availableFilters: filters.map((f) => ({ key: f.key })),
  });
}
