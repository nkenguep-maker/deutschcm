// P4.6-A · GET /api/messaging/admin/metadata
// Projection Metadata Super Admin. Aucune donnée sensible (body,
// transcript, storageKey). IDs hashés. Gate 404 + rôle YEMA_ADMIN.

import { NextResponse } from "next/server";
import { isMessagingEnabled } from "@/lib/flags";
import { resolveMessagingActor } from "@/lib/messaging/actor";
import { getAdminMetadataProjection } from "@/lib/messaging/adminProjection";

export const dynamic = "force-dynamic";
function notFound() { return NextResponse.json({ error: "Not found" }, { status: 404 }); }

export async function GET() {
  if (!isMessagingEnabled()) return notFound();
  const actor = await resolveMessagingActor();
  if (!actor || actor.persona !== "super_admin") return notFound();
  const rows = await getAdminMetadataProjection(100);
  return NextResponse.json({ metadata: rows });
}
