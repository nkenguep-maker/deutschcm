// GET /api/activation-status?orderId=xxx
// Retourne l'état d'activation d'un order — utilisé par /[locale]/activation
// pour poller après un paiement. Payload enrichi (droits + tout_pret +
// espace_cible + titre + ambiance) tout en conservant les champs legacy.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getActivationStatus } from "@/lib/entitlements/activation";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "user profile not found" }, { status: 404 });

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true } });
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });
  if (order.userId !== dbUser.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const status = await getActivationStatus(orderId);
  if (!status) return NextResponse.json({ error: "order not found" }, { status: 404 });

  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-store, must-revalidate" },
  });
}
