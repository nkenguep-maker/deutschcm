// P4.6 Lot 5 · session enfant · endpoints server-side.
//
//   POST   /api/child-session · body { childProfileId, pin }
//          → parent (Supabase auth) doit être propriétaire du profil
//          → verifyChildPin server-side · JAMAIS envoyer pinHash au client
//          → set cookie HttpOnly signé (30 min TTL)
//
//   GET    /api/child-session
//          → retourne { active: bool, childProfileId?: string } sans
//            aucune donnée sensible
//
//   DELETE /api/child-session
//          → efface le cookie (mode enfant terminé)
//
// Sécurité :
//   - Aucun childId arbitraire accepté sans vérification ownership.
//   - Aucun parentUserId reçu du client.
//   - Aucune fuite pinHash / parentUserId / householdId dans les réponses.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveFamilyGuardianActorOrNull } from "@/lib/family/actor";
import { prisma } from "@/lib/prisma";
import { verifyChildPin } from "@/lib/security/childPin";
import {
  childPinRateLimitConfig,
  isChildPinRateLimited,
  recordInvalidChildPinAttempt,
} from "@/lib/security/childPinRateLimit";
import {
  CHILD_SESSION_COOKIE_NAME,
  CHILD_SESSION_TTL_SECONDS,
  encodeChildSession,
  verifyChildSession,
} from "@/lib/security/childSession";

export const dynamic = "force-dynamic";

function err(code: string, status: number) {
  return NextResponse.json({ error: code }, { status });
}

function pinRateLimited() {
  const retryAfter = childPinRateLimitConfig().windowMinutes * 60;
  return NextResponse.json(
    { error: "PIN_RATE_LIMITED" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export async function POST(req: NextRequest) {
  // 1. Parent authentifié requis.
  const actor = await resolveFamilyGuardianActorOrNull();
  if (!actor) return err("UNAUTHORIZED", 401);

  // 2. Body strict.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("BAD_JSON", 400);
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const childProfileId = typeof b.childProfileId === "string" ? b.childProfileId : null;
  const pin = typeof b.pin === "string" ? b.pin : null;
  if (!childProfileId || !pin) return err("MISSING_FIELDS", 400);

  // 3. Vérification ownership + PIN côté serveur.
  const child = await prisma.childProfile.findFirst({
    where: { id: childProfileId, parentUserId: actor.userId },
    select: { id: true, pinHash: true, pinUpdatedAt: true },
  });
  if (!child) return err("NOT_FOUND", 404);
  if (!child.pinHash) return err("PIN_NOT_SET", 409);

  // P4.7 · limite distribuée par parent + enfant. Les échecs sont comptés
  // dans AuditEvent, jamais dans un compteur mémoire serverless.
  if (await isChildPinRateLimited(actor.userId, child.id)) return pinRateLimited();

  const ok = await verifyChildPin(pin, child.pinHash);
  if (!ok) {
    const limited = await recordInvalidChildPinAttempt(actor.userId, child.id);
    if (limited) return pinRateLimited();
    return err("PIN_INVALID", 401);
  }

  // 4. Émission cookie signé · version PIN incluse (Lot 5.1) pour
  // invalider automatiquement toute session antérieure après changement.
  const cookieValue = encodeChildSession(child.id, child.pinUpdatedAt);
  if (!cookieValue) return err("SECRET_UNAVAILABLE", 500);

  const jar = await cookies();
  jar.set(CHILD_SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CHILD_SESSION_TTL_SECONDS,
  });

  return NextResponse.json({ active: true, childProfileId: child.id });
}

export async function GET() {
  const jar = await cookies();
  const cookie = jar.get(CHILD_SESSION_COOKIE_NAME)?.value;
  if (!cookie) return NextResponse.json({ active: false });
  const check = verifyChildSession(cookie);
  if (!check.ok) return NextResponse.json({ active: false });
  return NextResponse.json({ active: true, childProfileId: check.payload.childProfileId });
}

export async function DELETE() {
  const jar = await cookies();
  jar.set(CHILD_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ active: false });
}
