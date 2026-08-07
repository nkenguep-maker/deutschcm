export type PublicSurfaceStatus = "LIVE" | "BETA" | "PRIVATE" | "HIDDEN";

export type PublicSurfaceId =
  | "languages"
  | "method"
  | "auth"
  | "teachers"
  | "centers"
  | "pricing"
  | "qa";

export type PublicSurfaceDefinition = {
  status: PublicSurfaceStatus;
  publicPath: string;
  note: string;
};

/**
 * Source de vérité pour ce que YEMA expose depuis sa surface publique.
 *
 * LIVE    = utilisable et publiquement promu.
 * BETA    = utilisable, peut être publiquement lié avec une attente bêta.
 * PRIVATE = conservé pour test/équipe, jamais lié depuis la surface publique.
 * HIDDEN  = route legacy conservée mais volontairement masquée.
 */
export const PUBLIC_SURFACE: Record<PublicSurfaceId, PublicSurfaceDefinition> = {
  languages: {
    status: "LIVE",
    publicPath: "/langues",
    note: "Catalogue public des langues et des deux univers YEMA.",
  },
  method: {
    status: "LIVE",
    publicPath: "/methode",
    note: "Présentation publique de la méthode YEMA.",
  },
  auth: {
    status: "LIVE",
    publicPath: "/register",
    note: "Inscription et connexion publiques.",
  },
  teachers: {
    status: "BETA",
    publicPath: "/enseignants",
    note: "Entrée enseignant conservée en bêta pendant le durcissement des espaces pro.",
  },
  centers: {
    status: "PRIVATE",
    publicPath: "/landing",
    note: "Landing centre gardée pour test interne jusqu'à alignement complet des promesses produit.",
  },
  pricing: {
    status: "HIDDEN",
    publicPath: "/pricing",
    note: "Tarifs et paiement hors périmètre du chantier technique actuel.",
  },
  qa: {
    status: "PRIVATE",
    publicPath: "/qa",
    note: "Routes de test manuelles, non destinées à la navigation publique.",
  },
};

export function isPubliclyLinked(surface: PublicSurfaceId): boolean {
  const status = PUBLIC_SURFACE[surface].status;
  return status === "LIVE" || status === "BETA";
}

export function isProductionHiddenPath(canonicalPath: string): boolean {
  return (Object.entries(PUBLIC_SURFACE) as Array<[PublicSurfaceId, PublicSurfaceDefinition]>).some(
    ([, definition]) => {
      if (definition.status !== "HIDDEN") return false;
      return canonicalPath === definition.publicPath || canonicalPath.startsWith(`${definition.publicPath}/`);
    },
  );
}
