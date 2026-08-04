// Lot 7A · adaptateur MondePath · source unique de vérité.
//
// Le champ persisté est actuellement `User.learningGoal` (String,
// free-form). Aucune migration Prisma ajoutée dans ce lot · l'adaptateur
// mappe la chaîne vers la MondePath canonique. null si aucun match.
//
// Utilisé par le dashboard Student Monde uniquement · JAMAIS dupliqué
// ailleurs. Toute évolution (ajout d'une enum Prisma dédiée par exemple)
// se fait ici puis se propage sans toucher aux composants.

export type MondePath =
  | "STUDIES"
  | "WORK"
  | "TRAVEL"
  | "EXAM"
  | "DAILY_LIFE";

export const MONDE_PATHS: readonly MondePath[] = ["STUDIES", "WORK", "TRAVEL", "EXAM", "DAILY_LIFE"];

/**
 * Résout la MondePath depuis les données onboarding disponibles.
 *
 * Contrat ·
 *   - retourne null si aucune information ne permet de conclure ·
 *     le dashboard affiche alors l'état "Aucun parcours" avec une
 *     seule action "Définir mon objectif" (brief §12·A) ;
 *   - ne devine JAMAIS silencieusement ·
 *   - accepte plusieurs formats historiques (learningGoal string,
 *     targetPath explicite si un jour ajouté).
 */
export interface MondePathInput {
  learningGoal?: string | null;
  // Extensions futures possibles · si une colonne enum est ajoutée un
  // jour à User (ex. mondePath: MondePath), la lire ici en priorité.
  mondePath?: MondePath | null;
}

export function resolveMondePath(input: MondePathInput): MondePath | null {
  if (input.mondePath && MONDE_PATHS.includes(input.mondePath)) return input.mondePath;

  const goal = (input.learningGoal ?? "").trim().toLowerCase();
  if (!goal) return null;

  // 1. Correspondance EXACTE à une valeur canonique · priorité absolue.
  //    L'onboarding peut un jour envoyer directement "STUDIES", "WORK"...
  const upper = goal.toUpperCase();
  if ((MONDE_PATHS as readonly string[]).includes(upper)) return upper as MondePath;

  // 2. Correspondance à un tag stable (préfixe long, jamais un mot court).
  //    Volontairement STRICT · un texte libre qui parle de "test" (n'importe
  //    quel test) ou de "family" (n'importe quel contexte familial) ou de
  //    "work" (parle du travail scolaire par exemple) ne DOIT PAS produire
  //    un parcours faux positif. On exige des marqueurs sans ambiguïté.
  //    Lot 7A.2 · resserré · brief §3.
  const kw = {
    STUDIES:    ["étudier à", "étudier en", "study abroad", "études supérieures",
                 "universität", "university", "college abroad"],
    TRAVEL:     ["voyager à", "voyager en", "travel to", "reise nach", "préparer mon voyage",
                 "preparing my trip", "vacances à"],
    WORK:       ["travailler à", "travailler en", "work in", "arbeiten in",
                 "entretien d'embauche", "job interview", "trouver un emploi",
                 "finding a job", "recrutement"],
    EXAM:       ["passer le goethe", "passer telc", "passer testdaf", "goethe zertifikat",
                 "goethe certificate", "telc exam", "testdaf exam", "examen goethe",
                 "examen telc", "examen testdaf", "exam preparation", "préparer l'examen"],
    DAILY_LIFE: ["belle-famille", "belle famille", "in-laws", "vie quotidienne",
                 "daily life", "alltag mit", "parler avec ma famille",
                 "speak with my family", "quotidien allemand", "everyday german"],
  } as const;
  // Ordre de résolution · TRAVEL avant WORK pour désambiguïser "travel".
  const order: readonly MondePath[] = ["STUDIES", "TRAVEL", "WORK", "EXAM", "DAILY_LIFE"];

  for (const path of order) {
    if (kw[path].some((k) => goal.includes(k))) return path;
  }
  return null;
}

/**
 * État métier du parcours (brief §12).
 */
export type PathState =
  | "no_pathway"          // A · aucune donnée onboarding
  | "incomplete_goal"     // B · parcours défini mais date/ville/examen manquant
  | "active"              // C · variante complète
  | "completed";          // D · récapitulatif terminal

export interface PathStatus {
  path: MondePath | null;
  state: PathState;
  targetDate: string | null;   // ISO · brief §8 pour TRAVEL et §9 EXAM
  targetCity: string | null;   // brief §12·B
  progressPct: number;         // 0..100
}

export function derivePathStatus(input: {
  path: MondePath | null;
  targetDate?: string | null;
  targetCity?: string | null;
  progressPct?: number;
  completed?: boolean;
}): PathStatus {
  const path = input.path;
  const progressPct = clamp(input.progressPct ?? 0, 0, 100);
  const targetDate = input.targetDate ?? null;
  const targetCity = input.targetCity ?? null;

  if (!path) return { path: null, state: "no_pathway", targetDate, targetCity, progressPct };
  if (input.completed || progressPct >= 100) {
    return { path, state: "completed", targetDate, targetCity, progressPct };
  }
  // Incomplete goal · TRAVEL/EXAM ont besoin d'une date ; sinon manque de contexte.
  if ((path === "TRAVEL" || path === "EXAM") && !targetDate) {
    return { path, state: "incomplete_goal", targetDate, targetCity, progressPct };
  }
  if ((path === "STUDIES" || path === "WORK") && !targetCity) {
    return { path, state: "incomplete_goal", targetDate, targetCity, progressPct };
  }
  return { path, state: "active", targetDate, targetCity, progressPct };
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
