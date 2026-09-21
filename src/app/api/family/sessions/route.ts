import { NextResponse } from "next/server";
import { resolveFamilyGuardianActorOrNull } from "@/lib/family/actor";
import { listFamilyRootsSessions } from "@/lib/rootsCoach/sessions";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await resolveFamilyGuardianActorOrNull();
  if (!actor) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const items = await listFamilyRootsSessions(actor.userId);
  return NextResponse.json({ items });
}
