// GET /api/activation-status?orderId=xxx
// Retourne l'état d'activation d'un order : items + grants créés.
// Utilisé par l'écran d'attribution (à venir) pour poller après un paiement.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getOrderActivationStatus } from "@/lib/entitlements";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Vérifie que l'order appartient bien à cet user (par supabaseId → users.id)
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "user profile not found" }, { status: 404 });

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true } });
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });
  if (order.userId !== dbUser.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const status = await getOrderActivationStatus(orderId);
  if (!status) return NextResponse.json({ error: "order not found" }, { status: 404 });

  return NextResponse.json(status);
}
