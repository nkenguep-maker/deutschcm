// Shape partagé pour la zone détail des échelles CECRL et YEMA.
// Portée par MaisonEchelle (state lifted), remplie par CefrSpine et
// YemaSpine via onDetailChange. Un seul objet à la fois — jamais deux
// détails visibles en parallèle.

export type SpineSource = "cefr" | "yema";

export interface SpineDetail {
  source: SpineSource;
  code: string;
  headline: string;
  skills: readonly string[];
  /** Ancre culturelle · YEMA uniquement */
  anchor?: string;
  /** Chip équivalence ACTFL · YEMA uniquement */
  actfl?: string;
  /** Note fine sous les can-do (« ce que vous saurez faire ») */
  fine: string;
}
