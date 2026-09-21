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

/** Source de vérité des surfaces publiques YEMA. Les paiements restent
 * séparés de la visibilité commerciale : une offre peut être LIVE sans
 * checkout actif. */
export const PUBLIC_SURFACE: Record<PublicSurfaceId, PublicSurfaceDefinition> = {
  languages: { status: "LIVE", publicPath: "/langues", note: "Catalogue public des langues et des deux univers YEMA." },
  method: { status: "LIVE", publicPath: "/methode", note: "Présentation publique de la méthode YEMA." },
  auth: { status: "LIVE", publicPath: "/register", note: "Inscription et connexion, soumises au gate bêta quand celui-ci est actif." },
  teachers: { status: "BETA", publicPath: "/enseignants", note: "Entrée enseignant disponible en bêta." },
  centers: { status: "BETA", publicPath: "/landing", note: "Acquisition centres visible en bêta ; validation humaine avant activation." },
  pricing: { status: "LIVE", publicPath: "/pricing", note: "Offres et tarifs publics. Les moyens de paiement seront connectés séparément." },
  qa: { status: "PRIVATE", publicPath: "/qa", note: "Routes de test manuelles, non destinées à la navigation publique." },
};

export function isPubliclyLinked(surface: PublicSurfaceId): boolean {
  const status = PUBLIC_SURFACE[surface].status;
  return status === "LIVE" || status === "BETA";
}

export function isProductionHiddenPath(canonicalPath: string): boolean {
  return (Object.entries(PUBLIC_SURFACE) as Array<[PublicSurfaceId, PublicSurfaceDefinition]>).some(
    ([, definition]) => definition.status === "HIDDEN" && (canonicalPath === definition.publicPath || canonicalPath.startsWith(`${definition.publicPath}/`)),
  );
}
