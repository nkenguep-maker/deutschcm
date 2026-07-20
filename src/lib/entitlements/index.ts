// getEntitlements · LA fonction unique qui autorise (ou refuse) une action.
//
// Doctrine (rappel) : le profil oriente · le package finance · le grant prouve
// · l'entitlement autorise. Aucun accès ad hoc dans les routes.
//
// Usage :
//   const r = await getEntitlements({ userId, learningPathId, capability: "AI_TEXT" });
//   if (!r.allowed) return NextResponse.json({ error: r.reason }, { status: 403 });
//
// Règles serveur absolues :
//   · universe === RACINES → deny AI_TEXT & AI_VOICE, quel que soit le grant
//   · actor.type === DEPENDENT_PROFILE → deny THREAD_POST
//   · gratuits (sans grant) : MONDE = test/1re leçon/AI 5min ; RACINES = 1re leçon/veillée/conte, jamais IA
//
// Retourne { allowed, limits?, reason? } — le caller décide la réponse HTTP.

import { prisma } from "@/lib/prisma";
import type {
  Capability,
  LearningPath,
  AccessGrant,
  ProductVariant,
  ProductEntitlementRule,
  BeneficiaryType,
} from "@prisma/client";

export type ActorType = "USER" | "DEPENDENT_PROFILE";

export type EntitlementRequest = {
  userId: string;
  learningPathId?: string;
  capability: Capability;
  resourceId?: string;
  actorType?: ActorType;
};

export type EntitlementResult = {
  allowed: boolean;
  reason?: string;
  limits?: {
    /** Minutes/uses restantes ce mois-ci pour les capacités limitées (IA gratuite). */
    remaining?: number;
    /** Cap total accordé (source de la limite). */
    max?: number;
    /** Grant source-of-truth pour la capacité accordée (null si gratuit). */
    grantId?: string;
  };
};

/** Cap de minutes d'IA offerts gratuitement en univers MONDE. */
export const FREE_MONDE_AI_MINUTES = 5;

/** Capacités accordées gratuitement en univers MONDE.
 *  Correspond à : test niveau · 1re leçon · mini-rapport. */
const FREE_MONDE_CAPS: Capability[] = ["COURSE_ACCESS"];
/** Capacités accordées gratuitement en univers RACINES.
 *  Correspond à : 1re leçon · une Veillée · un conte audio. */
const FREE_RACINES_CAPS: Capability[] = ["COURSE_ACCESS", "VEILLEE_CONTENT"];

function deny(reason: string): EntitlementResult {
  return { allowed: false, reason };
}
function allow(limits?: EntitlementResult["limits"]): EntitlementResult {
  return { allowed: true, limits };
}

type GrantWithVariantAndRules = AccessGrant & {
  productVariant: ProductVariant & {
    product: { entitlementRules: ProductEntitlementRule[] };
  };
};

/** Filtre : grant actif (statut ACTIVE, non expiré). */
function isActive(g: GrantWithVariantAndRules, now: Date): boolean {
  if (g.status !== "ACTIVE") return false;
  if (g.startsAt > now) return false;
  if (g.endsAt && g.endsAt <= now) return false;
  return true;
}

/** Le grant accorde-t-il cette capability, sur cette langue/ce niveau (si scopé) ? */
function grantAccordsCapability(
  g: GrantWithVariantAndRules,
  capability: Capability,
  path: LearningPath | null,
): boolean {
  const rule = g.productVariant.product.entitlementRules.find((r) => r.capability === capability);
  if (!rule) return false;

  // Si la variante a une langue/niveau, le path doit matcher (scoping)
  if (path) {
    if (g.productVariant.language && g.productVariant.language !== path.language) return false;
    if (g.productVariant.level && path.currentLevel && g.productVariant.level !== path.currentLevel) return false;
  }
  return true;
}

/** IDs bénéficiaires possibles pour ce user (self + households + learning_path). */
async function resolveBeneficiaryIds(userId: string, learningPathId?: string) {
  const memberships = await prisma.householdMembership.findMany({
    where: { userId, status: "ACTIVE" },
    select: { householdId: true },
  });
  const householdIds = memberships.map((m) => m.householdId);

  const owned = await prisma.household.findMany({
    where: { ownerUserId: userId, status: "ACTIVE" },
    select: { id: true },
  });
  for (const h of owned) if (!householdIds.includes(h.id)) householdIds.push(h.id);

  return {
    userIds: [userId],
    householdIds,
    learningPathIds: learningPathId ? [learningPathId] : [],
  };
}

/**
 * getEntitlements — la seule route vers un droit.
 * Retourne { allowed, reason?, limits? } ; jamais throw sur un déni.
 */
export async function getEntitlements(req: EntitlementRequest): Promise<EntitlementResult> {
  const { userId, learningPathId, capability, actorType = "USER" } = req;
  const now = new Date();

  // 1) Règle serveur absolue : dependent_profile ne peut pas poster
  if (actorType === "DEPENDENT_PROFILE" && capability === "THREAD_POST") {
    return deny("dependent_profiles cannot post messages");
  }

  // 2) Charge le learning path (si demandé)
  let path: LearningPath | null = null;
  if (learningPathId) {
    path = await prisma.learningPath.findUnique({ where: { id: learningPathId } });
    if (!path || path.userId !== userId) return deny("learning path not found or not owned");
    if (path.status !== "ACTIVE") return deny("learning path archived");
  }

  // 3) Règle serveur absolue : univers racines ne peut jamais utiliser l'IA
  if (path?.universe === "RACINES" && (capability === "AI_TEXT" || capability === "AI_VOICE")) {
    return deny("AI capabilities are never granted for racines learning paths");
  }

  // 4) Charge tous les grants candidats (user + households + learning_path)
  const beneficiaries = await resolveBeneficiaryIds(userId, learningPathId);
  const orClauses: Array<{ beneficiaryType: BeneficiaryType; beneficiaryId: { in: string[] } }> = [];
  if (beneficiaries.userIds.length) {
    orClauses.push({ beneficiaryType: "USER", beneficiaryId: { in: beneficiaries.userIds } });
  }
  if (beneficiaries.householdIds.length) {
    orClauses.push({ beneficiaryType: "HOUSEHOLD", beneficiaryId: { in: beneficiaries.householdIds } });
  }
  if (beneficiaries.learningPathIds.length) {
    orClauses.push({ beneficiaryType: "LEARNING_PATH", beneficiaryId: { in: beneficiaries.learningPathIds } });
  }

  const grants = orClauses.length
    ? await prisma.accessGrant.findMany({
        where: { OR: orClauses, status: "ACTIVE" },
        include: {
          productVariant: {
            include: { product: { include: { entitlementRules: true } } },
          },
        },
      })
    : [];

  // 5) Est-ce qu'un grant actif accorde cette capability sur ce path ?
  for (const g of grants) {
    if (!isActive(g, now)) continue;
    if (grantAccordsCapability(g, capability, path)) {
      return allow({ grantId: g.id });
    }
  }

  // 6) Fallback : gratuits. On n'ouvre les gratuits QUE si un learning path est fourni
  //    (l'accès gratuit est TOUJOURS scopé à un parcours).
  if (path) {
    if (path.universe === "MONDE") {
      if (FREE_MONDE_CAPS.includes(capability)) return allow();
      if (capability === "AI_TEXT" || capability === "AI_VOICE") {
        // TODO(v1.1) · compter la conso réelle via une table free_ai_usage
        return allow({ remaining: FREE_MONDE_AI_MINUTES, max: FREE_MONDE_AI_MINUTES });
      }
    }
    if (path.universe === "RACINES") {
      if (FREE_RACINES_CAPS.includes(capability)) return allow();
    }
  }

  return deny("no active grant covers this capability");
}

/**
 * Utilitaire · résume les grants d'un order (source unique pour /api/activation-status).
 */
export async function getOrderActivationStatus(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          productVariant: { include: { product: true } },
          grants: true,
        },
      },
      payments: true,
    },
  });
  if (!order) return null;

  const anyConfirmed = order.payments.some((p) => p.status === "CONFIRMED");
  return {
    orderId: order.id,
    orderStatus: order.status,
    paid: anyConfirmed,
    items: order.items.map((it) => ({
      productCode: it.productVariant.product.code,
      language: it.productVariant.language,
      level: it.productVariant.level,
      beneficiaryType: it.beneficiaryType,
      beneficiaryId: it.beneficiaryId,
      grants: it.grants.map((g) => ({
        id: g.id,
        status: g.status,
        startsAt: g.startsAt,
        endsAt: g.endsAt,
      })),
      hasGrant: it.grants.length > 0,
    })),
  };
}

/**
 * Utilitaire · valide qu'un achat d'add-on est légitime (a le package prérequis actif).
 * À appeler DANS le flux d'achat, avant de créer l'order_item.
 */
export async function validateAddonPurchase(params: {
  userId: string;
  addonProductCode: "TEACHER_ADDON" | "CAREER_COACH_ADDON" | "ROOTS_FOLLOWUP_ADDON";
  language?: string;
  level?: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const beneficiaries = await resolveBeneficiaryIds(params.userId);
  const now = new Date();

  const requiredProductCode =
    params.addonProductCode === "ROOTS_FOLLOWUP_ADDON" ? ["ROOTS_SOLO", "ROOTS_FAMILY"] : ["PASSAGE"];

  const grants = await prisma.accessGrant.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { beneficiaryType: "USER", beneficiaryId: { in: beneficiaries.userIds } },
        { beneficiaryType: "HOUSEHOLD", beneficiaryId: { in: beneficiaries.householdIds } },
      ],
      productVariant: {
        product: { code: { in: requiredProductCode as Array<"PASSAGE" | "ROOTS_SOLO" | "ROOTS_FAMILY"> } },
      },
    },
    include: { productVariant: true },
  });

  const match = grants.find((g) => {
    if (g.startsAt > now) return false;
    if (g.endsAt && g.endsAt <= now) return false;
    if (requiredProductCode.includes("PASSAGE")) {
      if (params.language && g.productVariant.language !== params.language) return false;
      if (params.level && g.productVariant.level !== params.level) return false;
    }
    return true;
  });

  if (!match) {
    return { ok: false, reason: `Prérequis manquant : ${requiredProductCode.join(" ou ")} actif` };
  }
  return { ok: true };
}
