// P4.6 Lot 4A · POST /api/family/children/register
// Création enfant enrichie (PIN + seat check) — NOUVEAU endpoint dédié à la
// refonte YEMA. L'ancien POST /api/family/children reste intact pour le
// legacy /famille.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveFamilyGuardianActorOrNull } from "@/lib/family/actor";
import { createChildProfile } from "@/lib/family/children";

export const dynamic = "force-dynamic";

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveFamilyGuardianActorOrNull();
    if (!actor) return err("UNAUTHORIZED", "Family guardian role required", 401);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return err("BAD_JSON", "Invalid JSON body", 400);
    }
    const b = (body ?? {}) as Record<string, unknown>;

    const result = await createChildProfile(actor, {
      prenom: (b.prenom as string) ?? "",
      age: (b.age as number) ?? -1,
      avatarAnimal: (b.avatarAnimal as string) ?? "",
      activeLangue: (b.activeLangue as string | null | undefined) ?? null,
      langues: (b.langues as unknown[]) ?? [],
      pin: typeof b.pin === "string" ? b.pin : null,
    });

    if (!result.ok) {
      const status =
        result.error === "no_seat_available" ? 409 :
        result.error === "invalid_pin" ? 400 :
        400;
      return err(result.error.toUpperCase(), result.error, status);
    }

    return NextResponse.json({ child: result.child }, { status: 201 });
  } catch (e) {
    console.error("[family/children/register] FAIL", e);
    return err("INTERNAL", "internal error", 500);
  }
}
