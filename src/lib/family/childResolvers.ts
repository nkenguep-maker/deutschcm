import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  CHILD_SESSION_COOKIE_NAME,
  pinVersionMatches,
  verifyChildSession,
} from "@/lib/security/childSession";

// P4.6 Lot 5 (+ 5.1) · resolveur central de la session enfant (server-only).
//
// Contrôles empilés (échec silencieux → null) :
//   1. Cookie présent
//   2. Signature HMAC valide + non expiré
//   3. ChildProfile existe en DB
//   4. Version PIN dans le cookie = ChildProfile.pinUpdatedAt actuel
//      (Lot 5.1 · invalidation immédiate après changement PIN)
//   5. ChildProfile.universe défini (Lot 5.1 · fail-closed : aucun
//      enfant non backfillé ne peut entrer en session)
//
// L'univers est lu depuis ChildProfile.universe (colonne explicite Lot
// 5.1 · plus aucune inférence depuis la liste de langues). Aucun
// pinHash ni pinUpdatedAt n'est jamais retourné dans le shape public.

export interface ChildSessionActor {
  childProfileId: string;
  parentUserId: string;
  prenom: string;
  avatarAnimal: string;
  age: number;
  activeLangue: string | null;
  langues: unknown[];
  householdId: string | null;
  universe: "MONDE" | "RACINES";
}

export async function resolveActiveChildSession(): Promise<ChildSessionActor | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(CHILD_SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;

  const check = verifyChildSession(cookie);
  if (!check.ok) return null;

  const child = await prisma.childProfile.findUnique({
    where: { id: check.payload.childProfileId },
    select: {
      id: true,
      parentUserId: true,
      prenom: true,
      avatarAnimal: true,
      age: true,
      activeLangue: true,
      langues: true,
      householdId: true,
      universe: true,
      pinUpdatedAt: true,
    },
  });
  if (!child) return null;

  // Lot 5.1 · rejet immédiat si le PIN a été changé depuis émission.
  if (!pinVersionMatches(check.payload.pv, child.pinUpdatedAt)) return null;

  // Lot 5.1 · fail-closed sur l'univers · un enfant non backfillé n'entre
  // dans aucun dashboard tant qu'il n'a pas de valeur explicite.
  if (child.universe !== "MONDE" && child.universe !== "RACINES") return null;

  return {
    childProfileId: child.id,
    parentUserId: child.parentUserId,
    prenom: child.prenom,
    avatarAnimal: child.avatarAnimal,
    age: child.age,
    activeLangue: child.activeLangue,
    langues: (child.langues as unknown[]) ?? [],
    householdId: child.householdId,
    universe: child.universe,
  };
}
