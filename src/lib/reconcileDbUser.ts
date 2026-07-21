// reconcileDbUser · LE mécanisme unique et idempotent de création /
// réconciliation de la ligne `users` Prisma à partir d'un user Supabase.
//
// Problème historique : plusieurs routes faisaient
//    prisma.user.upsert({ where: { supabaseId }, create: { supabaseId, email } })
// Or `email` est aussi UNIQUE. Un compte Paul qui recréé son compte
// Supabase (nouveau supabaseId) mais dont l'ancienne ligne Prisma existe
// encore avec le MÊME email → upsert ne trouve rien par supabaseId,
// tente de CREATE, se prend un P2002 sur email → 500 opaque, user coincé.
//
// Doctrine : la ligne Prisma est **la référence stable de l'utilisateur**,
// pas le supabaseId qui, lui, peut changer (delete + recreate d'un compte
// de test, rotation d'un compte Supabase, etc.). En cas de conflit email
// avec supabaseId différent, on adopte la nouvelle identité Supabase
// (on n'a qu'un seul user derrière un email, par contrat métier).
//
// Idempotent · re-appelable sans effet de bord :
//   1. si users(supabaseId) existe → renvoie la ligne
//   2. sinon si users(email) existe (orphelin) → met à jour son
//      supabaseId vers la nouvelle valeur, renvoie la ligne
//   3. sinon → CREATE la ligne
// + attache un UserRole STUDENT ACTIVE (via grantRole) — idempotent

import { prisma } from "@/lib/prisma";
import { grantRole } from "@/lib/roles";
import type { User } from "@supabase/supabase-js";
import type { User as DbUser, Role } from "@prisma/client";

export interface ReconcileParams {
  authUser: User;
  /** Rôle par défaut si on doit créer un UserRole. Défaut STUDENT. */
  defaultRole?: Role;
  /** Patch optionnel — passera dans le path "update existante". */
  patch?: {
    fullName?: string | null;
    phone?: string | null;
    city?: string | null;
    country?: string | null;
    onboardingDone?: boolean;
  };
}

/** Résultat structuré : quelle branche a été prise (utile pour tests + logs). */
export type ReconcileResult = {
  user: DbUser;
  path: "matched_supabase_id" | "adopted_orphan_email" | "created_fresh";
};

export async function reconcileDbUser(params: ReconcileParams): Promise<ReconcileResult> {
  const { authUser, defaultRole = "STUDENT", patch = {} } = params;
  if (!authUser.email) {
    // Supabase peut créer un user sans email (auth par téléphone) — pas
    // notre cas actuel. On refuse plutôt que d'improviser.
    throw new ReconcileError("MISSING_EMAIL", "authUser without email");
  }
  const email = authUser.email.toLowerCase();
  const supabaseId = authUser.id;
  const fullName =
    patch.fullName ??
    (authUser.user_metadata?.full_name as string | undefined) ??
    email.split("@")[0] ??
    "Utilisateur";

  // 1) Match par supabaseId (le cas normal)
  const bySupabase = await prisma.user.findUnique({ where: { supabaseId } });
  if (bySupabase) {
    // Applique le patch si fourni, sinon renvoie tel quel.
    if (Object.keys(patch).length > 0) {
      const updated = await prisma.user.update({
        where: { id: bySupabase.id },
        data: cleanPatch(patch),
      });
      await grantRole({ userId: updated.id, role: defaultRole });
      return { user: updated, path: "matched_supabase_id" };
    }
    await grantRole({ userId: bySupabase.id, role: defaultRole });
    return { user: bySupabase, path: "matched_supabase_id" };
  }

  // 2) Match par email (orpheline · ancien supabaseId)
  const byEmail = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (byEmail) {
    // Adopte le nouveau supabaseId + applique le patch éventuel.
    const updated = await prisma.user.update({
      where: { id: byEmail.id },
      data: {
        supabaseId,
        ...(fullName && !byEmail.fullName ? { fullName } : {}),
        ...cleanPatch(patch),
      },
    });
    await grantRole({ userId: updated.id, role: defaultRole });
    return { user: updated, path: "adopted_orphan_email" };
  }

  // 3) Création fraîche
  const created = await prisma.user.create({
    data: {
      supabaseId,
      email,
      fullName,
      role: defaultRole,
      ...cleanPatch(patch),
    },
  });
  await grantRole({ userId: created.id, role: defaultRole });
  return { user: created, path: "created_fresh" };
}

function cleanPatch(p: ReconcileParams["patch"]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!p) return out;
  if (p.fullName !== undefined) out.fullName = p.fullName;
  if (p.phone !== undefined) out.phone = p.phone;
  if (p.city !== undefined) out.city = p.city;
  if (p.country !== undefined) out.country = p.country;
  if (p.onboardingDone !== undefined) out.onboardingDone = p.onboardingDone;
  return out;
}

/** Erreur structurée · toutes les routes API peuvent la mapper vers un
 *  code HTTP + body { error, code } stable. */
export class ReconcileError extends Error {
  readonly code:
    | "MISSING_EMAIL"
    | "DB_CONFLICT"
    | "UNKNOWN";
  constructor(code: ReconcileError["code"], message?: string) {
    super(message ?? code);
    this.code = code;
  }
}
