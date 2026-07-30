// P4.6-A · GET /api/messaging/matrix
// Projection publique de la matrice des permissions Messagerie.
// Gate 404 stable si YEMA_MESSAGING_ENABLED=false.

import { NextResponse } from "next/server";
import { isMessagingEnabled } from "@/lib/flags";
import { getMessagingMatrixProjection } from "@/lib/messaging/matrix";

export const dynamic = "force-dynamic";

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET() {
  if (!isMessagingEnabled()) return notFound();
  return NextResponse.json({ matrix: getMessagingMatrixProjection() });
}
