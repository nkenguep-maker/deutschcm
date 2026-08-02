import "server-only";
import { prisma } from "@/lib/prisma";
import { hashChildPin, normalizePin } from "@/lib/security/childPin";
import type { FamilyGuardianActor } from "./actor";
import { assertCanAddChildProfile, type SeatUniverse } from "./seats";

// P4.6 Lot 4A · création d'un enfant sous un guardian.
//
// Contraintes brief §5 :
//   - aucun email enfant obligatoire ;
//   - aucun childId accepté sans vérification serveur ;
//   - PIN hashé (scrypt canonique) ;
//   - seat vérifié via assertCanAddChildProfile ;
//   - aucune activation adulte Monde par ce flux.

const AVATAR_ANIMALS = ["chouette", "tortue", "panda", "elephant", "girafe", "renard"] as const;
type AvatarAnimal = (typeof AVATAR_ANIMALS)[number];

export interface CreateChildInput {
  prenom: string;
  age: number;
  avatarAnimal: string;
  activeLangue?: string | null;
  langues?: unknown[];
  pin?: string | null; // optionnel : si présent, hashé et stocké
  // Lot 7C.4 · univers obligatoire · exigé par le service canonique.
  universe: SeatUniverse;
  learningGoal?: string | null;
}

export type CreateChildResult =
  | { ok: true; child: { id: string; prenom: string; hasPin: boolean } }
  | { ok: false; error: "invalid_prenom" | "invalid_age" | "invalid_avatar" | "invalid_pin" | "invalid_universe" | "no_seat_available" };

function validatePrenom(p: unknown): string | null {
  if (typeof p !== "string") return null;
  const s = p.trim();
  if (s.length < 1 || s.length > 24) return null;
  return s;
}

function validateAge(a: unknown): number | null {
  if (typeof a !== "number" || !Number.isInteger(a)) return null;
  if (a < 3 || a > 17) return null;
  return a;
}

function isAvatar(x: string): x is AvatarAnimal {
  return (AVATAR_ANIMALS as readonly string[]).includes(x);
}

export async function createChildProfile(
  actor: FamilyGuardianActor,
  input: CreateChildInput,
): Promise<CreateChildResult> {
  const prenom = validatePrenom(input.prenom);
  if (!prenom) return { ok: false, error: "invalid_prenom" };

  const age = validateAge(input.age);
  if (age === null) return { ok: false, error: "invalid_age" };

  if (typeof input.avatarAnimal !== "string" || !isAvatar(input.avatarAnimal)) {
    return { ok: false, error: "invalid_avatar" };
  }

  let pinHash: string | null = null;
  if (input.pin !== undefined && input.pin !== null && input.pin !== "") {
    const norm = normalizePin(input.pin);
    if (!norm) return { ok: false, error: "invalid_pin" };
    pinHash = await hashChildPin(norm);
  }

  // Lot 7C.4 · univers exigé + fail-closed sur mismatch.
  if (input.universe !== "MONDE" && input.universe !== "RACINES") {
    return { ok: false, error: "invalid_universe" };
  }
  const gate = await assertCanAddChildProfile(actor, input.universe);
  if (!gate.ok) return { ok: false, error: "no_seat_available" };

  // learningGoal Monde interdit sur RACINES · normalisé null silencieusement.
  const learningGoal = input.universe === "MONDE" ? (input.learningGoal ?? null) : null;

  const created = await prisma.childProfile.create({
    data: {
      parentUserId: actor.userId,
      prenom,
      avatarAnimal: input.avatarAnimal,
      age,
      langues: (input.langues ?? []) as never,
      activeLangue: input.activeLangue ?? null,
      pinHash,
      pinUpdatedAt: pinHash ? new Date() : null,
      universe: input.universe,
      learningGoal,
    },
    select: { id: true, prenom: true, pinHash: true },
  });

  return {
    ok: true,
    child: { id: created.id, prenom: created.prenom, hasPin: Boolean(created.pinHash) },
  };
}
