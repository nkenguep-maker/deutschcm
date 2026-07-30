// P4.6 Lot 4A · GET /api/family/dashboard
// Retourne l'agrégat du dashboard Family (enfants, sièges, accès adulte).
// Jamais de pinHash exposé.

import { NextResponse } from "next/server";
import { resolveFamilyGuardianActorOrNull } from "@/lib/family/actor";
import { getFamilyDashboard } from "@/lib/family/queries";

export const dynamic = "force-dynamic";

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function GET() {
  try {
    const actor = await resolveFamilyGuardianActorOrNull();
    if (!actor) return err("UNAUTHORIZED", "Family guardian role required", 401);
    const data = await getFamilyDashboard(actor);
    return NextResponse.json(data);
  } catch (e) {
    console.error("[family/dashboard] FAIL", e);
    return err("INTERNAL", "internal error", 500);
  }
}
