import type { MondePath } from "./mondePath";

// Lot 7B · priorité pédagogique · pure présentation (brief §6).
//
// N'agit JAMAIS sur les données · ne modifie pas une note, une progression,
// n'assigne rien, n'envoie aucun message. Retourne uniquement une clé
// d'i18n qui décrit ce sur quoi l'apprenant devrait concentrer son travail.
//
// Consommé par le dashboard Teacher (chip discret dans la file de
// correction) et par le dashboard Family (recommandation calme).

export type PathwayPriorityKey =
  | "priority.studies_written"
  | "priority.work_oral"
  | "priority.travel_situations"
  | "priority.exam_skill"
  | "priority.daily_conversation"
  | "priority.unknown";

export function priorityForPath(path: MondePath | null): PathwayPriorityKey {
  if (!path) return "priority.unknown";
  switch (path) {
    case "STUDIES":    return "priority.studies_written";
    case "WORK":       return "priority.work_oral";
    case "TRAVEL":     return "priority.travel_situations";
    case "EXAM":       return "priority.exam_skill";
    case "DAILY_LIFE": return "priority.daily_conversation";
  }
}
