// activation · état d'un order pour l'écran de passage (post-paiement).
//
// La vérité vient TOUJOURS des données : payments.confirmedAt pour le paiement,
// access_grants existants + status ACTIVE pour chaque droit attendu.
// Le mapping produit → étapes humaines est encodé ici (une seule fois) pour
// que l'écran reste bête (rendu pur).
//
// Cap : max 5 étapes affichées. Si l'agrégation dépasse, on tronque en gardant
// paiement + les étapes prioritaires du package principal.

import { prisma } from "@/lib/prisma";
import type { LanguageCode, CefrLevel, ProductCode, Universe } from "@prisma/client";

export type ActivationDroit = {
  /** Clé i18n stable — ex. "passage_cours". Le client résout via activation.droits.<cle>. */
  cle: string;
  /** Paramètres d'interpolation (langue, niveau) — clients i18n. */
  params: Record<string, string>;
  /** true ssi la source de vérité côté DB confirme que ce droit est acquis. */
  pret: boolean;
};

export type ActivationTitre = {
  cle: string;
  params: Record<string, string>;
};

export type ActivationStatus = {
  orderId: string;
  paiement_confirme: boolean;
  droits: ActivationDroit[];
  tout_pret: boolean;
  /** Chemin nu (jamais préfixé par la locale). Le client localise via <Link>/redirect next-intl. */
  espace_cible: string;
  titre: ActivationTitre;
  /** "world" | "sources" — ambiance à appliquer. */
  ambiance: "world" | "sources";
  /** Statut d'échec réel — le client affiche l'écran d'erreur si présent. */
  echec: null | { kind: "PAYMENT_FAILED" | "ORDER_CANCELLED" };

  // Champs legacy conservés pour rétro-compat (endpoint utilisé aussi par le noyau)
  orderStatus: string;
  paid: boolean;
};

const MAX_DROITS = 5;

/** Étapes ajoutées par un `order_item` selon son produit. */
function stepsForProduct(
  code: ProductCode,
  variant: { language: LanguageCode | null; level: CefrLevel | null },
  grantsCount: number,
): Array<{ cle: string; params: Record<string, string> }> {
  const params: Record<string, string> = {};
  if (variant.language) params.langue = variant.language;
  if (variant.level) params.niveau = variant.level;

  switch (code) {
    case "PASSAGE":
      return [
        { cle: "passage_cours", params },
        { cle: "passage_examens", params: {} },
      ];
    case "TEACHER_ADDON":
      return [
        { cle: "teacher_salle", params: {} },
        { cle: "teacher_fil", params: {} },
      ];
    case "CAREER_COACH_ADDON":
      return [
        { cle: "coach_salle", params: {} },
        { cle: "coach_fil", params: {} },
      ];
    case "ROOTS_SOLO":
      return [{ cle: "roots_parcours", params }];
    case "ROOTS_FAMILY":
      return [
        { cle: "roots_parcours", params },
        { cle: "roots_famille", params: {} },
      ];
    case "ROOTS_FOLLOWUP_ADDON":
      return [
        { cle: "roots_accompagnant", params },
        { cle: "roots_salle_fil", params: {} },
      ];
    case "COMPANION":
      return grantsCount > 0 ? [{ cle: "companion_place", params: {} }] : [];
    default:
      return [];
  }
}

/** Titre à afficher — dérivé de la composition du panier. */
function titleForOrder(
  codes: ProductCode[],
  variant: { language: LanguageCode | null; level: CefrLevel | null },
): ActivationTitre {
  const has = (c: ProductCode) => codes.includes(c);
  const params: Record<string, string> = {};
  if (variant.language) params.langue = variant.language;
  if (variant.level) params.niveau = variant.level;

  if (has("PASSAGE") && has("TEACHER_ADDON")) return { cle: "passage_prof", params };
  if (has("PASSAGE") && has("CAREER_COACH_ADDON")) return { cle: "passage_coach", params };
  if (has("PASSAGE")) return { cle: "passage_seul", params };
  if (has("ROOTS_FAMILY") && has("ROOTS_FOLLOWUP_ADDON")) return { cle: "roots_famille_prof", params };
  if (has("ROOTS_FAMILY")) return { cle: "roots_famille", params };
  if (has("ROOTS_SOLO") && has("ROOTS_FOLLOWUP_ADDON")) return { cle: "roots_solo_prof", params };
  if (has("ROOTS_SOLO")) return { cle: "roots_solo", params };
  if (has("COMPANION")) return { cle: "companion", params };
  return { cle: "generique", params };
}

/** Ambiance dérivée : sources dès qu'un produit RACINES est présent, sinon world. */
function ambianceForOrder(universes: Array<Universe | null>): "world" | "sources" {
  return universes.some((u) => u === "RACINES") ? "sources" : "world";
}

/** Le grant d'un order_item est "prêt" ssi il existe au moins un grant ACTIVE non expiré. */
function itemGrantReady(
  grants: Array<{ status: string; endsAt: Date | null }>,
  now: Date,
): boolean {
  return grants.some(
    (g) => g.status === "ACTIVE" && (g.endsAt === null || g.endsAt > now),
  );
}

/**
 * getActivationStatus · lit l'état RÉEL d'un order pour l'écran de passage.
 * Retourne null si l'order n'existe pas (l'appelant fait 404).
 */
export async function getActivationStatus(orderId: string): Promise<ActivationStatus | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          productVariant: { include: { product: true } },
          grants: { select: { status: true, endsAt: true } },
        },
      },
      payments: { select: { status: true, confirmedAt: true } },
    },
  });
  if (!order) return null;

  const now = new Date();
  const paiement_confirme = order.payments.some(
    (p) => p.status === "CONFIRMED" && p.confirmedAt !== null,
  );
  const payment_failed = order.payments.some((p) => p.status === "FAILED");

  // Détermine l'échec (le plus grave gagne)
  let echec: ActivationStatus["echec"] = null;
  if (order.status === "CANCELLED") echec = { kind: "ORDER_CANCELLED" };
  else if (payment_failed && !paiement_confirme) echec = { kind: "PAYMENT_FAILED" };

  // Compose les étapes par item
  const codes: ProductCode[] = [];
  const universes: Array<Universe | null> = [];
  let primaryVariant: { language: LanguageCode | null; level: CefrLevel | null } = {
    language: null,
    level: null,
  };
  const droitsFromItems: ActivationDroit[] = [];

  for (const item of order.items) {
    const code = item.productVariant.product.code;
    codes.push(code);
    universes.push(item.productVariant.product.universe);
    // Le variant du produit principal (PASSAGE ou ROOTS_*) porte langue/niveau du titre.
    if (
      (code === "PASSAGE" || code === "ROOTS_SOLO" || code === "ROOTS_FAMILY") &&
      primaryVariant.language === null
    ) {
      primaryVariant = {
        language: item.productVariant.language,
        level: item.productVariant.level,
      };
    }
    const pret = itemGrantReady(item.grants, now);
    const steps = stepsForProduct(
      code,
      { language: item.productVariant.language, level: item.productVariant.level },
      item.grants.length,
    );
    for (const step of steps) {
      droitsFromItems.push({ ...step, pret });
    }
  }

  // 1re étape toujours : le paiement
  const droits: ActivationDroit[] = [
    { cle: "paiement", params: {}, pret: paiement_confirme },
    ...droitsFromItems,
  ];

  // Tronque à MAX_DROITS en gardant paiement + tête
  const droitsTronques = droits.slice(0, MAX_DROITS);

  const tout_pret = paiement_confirme && droitsTronques.every((d) => d.pret);

  return {
    orderId: order.id,
    paiement_confirme,
    droits: droitsTronques,
    tout_pret,
    espace_cible: "/dashboard",
    titre: titleForOrder(codes, primaryVariant),
    ambiance: ambianceForOrder(universes),
    echec,
    orderStatus: order.status,
    paid: paiement_confirme,
  };
}
