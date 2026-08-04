import "server-only";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// P4.6 Lot 4A · résolution de l'acteur Famille (guardian).
//
// Doctrine (brief §1) :
//   IDENTITÉ = User Supabase
//   RÔLE     = ce que le compte administre (ici : PARENT / FAMILY_GUARDIAN)
//   ENTITLEMENT = ce que le compte a payé (résolu séparément via entitlements)
//
// FAMILY_GUARDIAN utilise le rôle applicatif existant `PARENT` (AppRole enum
// — audit Lot 4A a confirmé qu'il couvre déjà la sémantique guardian). Aucun
// nouveau enum créé. Un compte qui n'a JAMAIS de UserAppRole.PARENT est
// considéré potentiellement guardian s'il possède au moins un ChildProfile
// rattaché (fallback historique compatible avec le legacy /famille).

export interface FamilyGuardianActor {
  userId: string;
  supabaseId: string;
  hasParentRole: boolean;
  hasChildProfiles: boolean;
  // ownerOfHouseholdIds · foyers dont l'utilisateur est propriétaire ou
  // membre. Un guardian sans foyer explicite peut exister (parent solo qui
  // a créé un enfant sans opt-in Household). Résolution seat/entitlements
  // gère les deux cas.
  householdIdsOwned: string[];
  householdIdsMember: string[];
}

export async function resolveFamilyGuardianActorOrNull(): Promise<FamilyGuardianActor | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });
  if (!dbUser) return null;

  const [parentRole, childCount, ownedHouseholds, memberHouseholds] = await Promise.all([
    prisma.userAppRole.findFirst({
      where: { userId: dbUser.id, role: "PARENT" },
      select: { id: true },
    }),
    prisma.childProfile.count({ where: { parentUserId: dbUser.id } }),
    prisma.household.findMany({
      where: { ownerUserId: dbUser.id, status: "ACTIVE" },
      select: { id: true },
    }),
    prisma.householdMembership.findMany({
      where: { userId: dbUser.id, status: "ACTIVE" },
      select: { householdId: true },
    }),
  ]);

  const hasParentRole = Boolean(parentRole);
  const hasChildProfiles = childCount > 0;

  // Legacy compat : si aucun rôle PARENT explicit ni enfant, l'utilisateur
  // n'est PAS un guardian. Retour null → dispatch redirige.
  if (!hasParentRole && !hasChildProfiles && ownedHouseholds.length === 0) {
    return null;
  }

  return {
    userId: dbUser.id,
    supabaseId: user.id,
    hasParentRole,
    hasChildProfiles,
    householdIdsOwned: ownedHouseholds.map((h) => h.id),
    householdIdsMember: memberHouseholds.map((m) => m.householdId),
  };
}
