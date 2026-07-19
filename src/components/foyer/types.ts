// Types partagés · Sprint « Le Foyer » — refonte premium.
// Rend le shape de /api/me/foyer réutilisable par les 8 composants
// du foyer + par la page /dashboard qui les compose.

export type Cap = "franchir" | "grandir" | "transmettre" | "moi";

export interface FoyerLangue {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  territory: "world" | "sources";
  scale: "cefr" | "yema";
  level: string | null;
  levels: readonly string[];
}

export interface FoyerBraise {
  jours: number;
  activeAujourdhui: boolean;
}

export interface FoyerClasse {
  name: string;
  teacherName: string;
}

export interface FoyerLessonRef {
  id: string;
  title: string;
}
export interface FoyerModuleRef {
  id: string;
  kind: string;
}

export type CapContext =
  | { kind: "franchir"; examenBlancLevel: string; leconsRestantes: number | null }
  | { kind: "grandir"; step: string; dossiersCompletes: number | null; dossiersTotal: number | null }
  | { kind: "transmettre"; conteId: string; conteTitre: string; minutes: number; soirsCetteSemaine: number }
  | { kind: "moi"; rythme: string };

export interface FoyerNextLesson {
  lesson: FoyerLessonRef | null;
  module: FoyerModuleRef | null;
  minutes: number;
  /** Progression 0-100 du niveau actif (modules complétés / total du niveau). */
  pct: number | null;
  capContext: CapContext | null;
}

export interface FoyerData {
  prenom: string;
  avatarUrl: string | null;
  cap: Cap | null;
  personalGoal: string | null;
  langues: FoyerLangue[];
  activeLangue: FoyerLangue;
  braise: FoyerBraise;
  classe: FoyerClasse | null;
  nextLesson: FoyerNextLesson;
}
