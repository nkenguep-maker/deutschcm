// P4.2 · GET /api/circles/[circleId]/members
//
// Retourne la liste des memberships ACTIVE du cercle · projection selon
// le rôle du caller :
//   - OWNER / ADULT · voit rôle, statut, prénom user ou child, coach.
//   - CHILD (via profil actif) · voit seulement son cercle et sa liste
//     minimale (owner name + coach).
//   - COACH · voit prénom / animal / âge des CHILD, rôle des adultes.
// Toute lecture nécessite membership ACTIVE.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFlag } from "@/lib/flags";
import {
  PermissionError,
  resolveCircleActor,
  assertCircleMembership,
} from "@/lib/permissions/circle";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ circleId: string }> },
) {
  if (!getFlag("CIRCLE_ENABLED")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { circleId } = await params;
  try {
    const actor = await resolveCircleActor();
    const callerMembership = await assertCircleMembership(circleId, actor);

    const memberships = await prisma.circleMembership.findMany({
      where: { circleId, status: "ACTIVE" },
      select: {
        id: true, role: true, status: true, joinedAt: true,
        user: { select: { id: true, fullName: true } },
        childProfile: { select: { id: true, prenom: true, avatarAnimal: true, age: true } },
      },
    });

    const isCoach = callerMembership.role === "COACH";
    const isChild = callerMembership.role === "CHILD";
    const projected = memberships.map((m) => {
      // COACH · voit prénom / animal / âge pour CHILD, rôle pour adultes.
      if (isCoach) {
        return {
          id: m.id, role: m.role, status: m.status,
          displayName: m.childProfile?.prenom ?? m.user?.fullName?.split(" ")[0] ?? null,
          avatarAnimal: m.childProfile?.avatarAnimal ?? null,
          age: m.childProfile?.age ?? null,
        };
      }
      // CHILD · voit uniquement rôle + prénom, pas les IDs adultes.
      if (isChild) {
        return {
          role: m.role,
          displayName: m.childProfile?.prenom ?? m.user?.fullName?.split(" ")[0] ?? null,
        };
      }
      // OWNER / ADULT · vue complète mais sans PII sensibles.
      return {
        id: m.id, role: m.role, status: m.status, joinedAt: m.joinedAt,
        user: m.user ? { id: m.user.id, fullName: m.user.fullName } : null,
        childProfile: m.childProfile,
      };
    });
    return NextResponse.json({ memberships: projected });
  } catch (e) {
    if (e instanceof PermissionError) return mapErrorToResponse(e);
    return mapErrorToResponse(e);
  }
}
