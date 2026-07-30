import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  CHILD_SESSION_COOKIE_NAME,
  verifyChildSession,
} from "@/lib/security/childSession";

// P4.6 Lot 5 · resolveur central de la session enfant (server-only).
//
// Retourne le ChildProfile réel ou null. Vérifie systématiquement la
// signature HMAC, l'expiration, et l'existence du profil en DB. Aucun
// pinHash n'est jamais retourné.

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

// Mapping langue → univers · aligné sur src/lib/languages.ts (native →
// RACINES, foreign → MONDE). Approximation minimale ; à raffiner si la
// détection d'univers devient plus complexe.
function inferUniverse(activeLangue: string | null, langues: unknown[]): "MONDE" | "RACINES" {
  const RACINES_LANGS = new Set(["wolof", "douala", "lingala", "bambara", "yoruba", "swahili"]);
  if (activeLangue && RACINES_LANGS.has(activeLangue)) return "RACINES";
  if (Array.isArray(langues)) {
    for (const l of langues) {
      const langName = (l as { langue?: string } | null)?.langue;
      if (typeof langName === "string" && RACINES_LANGS.has(langName)) return "RACINES";
    }
  }
  return "MONDE";
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
    },
  });
  if (!child) return null;

  return {
    childProfileId: child.id,
    parentUserId: child.parentUserId,
    prenom: child.prenom,
    avatarAnimal: child.avatarAnimal,
    age: child.age,
    activeLangue: child.activeLangue,
    langues: (child.langues as unknown[]) ?? [],
    householdId: child.householdId,
    universe: inferUniverse(child.activeLangue, (child.langues as unknown[]) ?? []),
  };
}
