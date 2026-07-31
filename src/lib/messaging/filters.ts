import type { ConversationType } from "@prisma/client";
import type { PersonaId } from "./matrix";

// P4.6-B · filtres inbox par persona · source UNIQUE.
//
// Aucun composant ne recopie ce contenu · UI desktop et mobile
// consomment cette table.

export type MessagingFilterKey =
  | "all"
  | "unread"
  | "class"
  | "family"
  | "children"
  | "internal"
  | "support"
  | "billing"
  | "school"
  | "sessions"
  | "child_copies"
  | "audio"
  | "group"
  | "broadcast"
  | "journal";

export interface MessagingFilter {
  key: MessagingFilterKey;
  // Types de conversation acceptés · vide = pas de filtre par type
  conversationTypes: readonly ConversationType[];
  // Filtre spécial "unread" · le service applique un where distinct
  unreadOnly?: boolean;
  // Filtre spécial "audio" · uniquement les fils avec messages AUDIO
  audioOnly?: boolean;
  // Filtre spécial "children" · uniquement les fils enfants du parent
  childOnly?: boolean;
  // Filtre spécial "journal" · projection metadata Super Admin (jamais
  // inbox de conversations)
  metadataProjection?: boolean;
}

const ALL_TYPES: readonly ConversationType[] = [];
// Note · listes explicites par persona · aucune inférence dynamique
// pour rester lisible et vérifiable par les tests.

export const PERSONA_FILTERS: Record<PersonaId, readonly MessagingFilter[]> = {
  super_admin: [
    { key: "all", conversationTypes: ["CENTER_PLATFORM_SUPPORT", "PLATFORM_BROADCAST"] },
    { key: "support", conversationTypes: ["CENTER_PLATFORM_SUPPORT"] },
    { key: "broadcast", conversationTypes: ["PLATFORM_BROADCAST"] },
    { key: "journal", conversationTypes: ALL_TYPES, metadataProjection: true },
  ],
  center_admin: [
    { key: "all", conversationTypes: ["CENTER_TEACHER_INTERNAL", "CENTER_COACH_INTERNAL", "CENTER_PLATFORM_SUPPORT", "PLATFORM_BROADCAST", "FAMILY_CENTER_BILLING"] },
    { key: "unread", conversationTypes: ["CENTER_TEACHER_INTERNAL", "CENTER_COACH_INTERNAL", "CENTER_PLATFORM_SUPPORT", "PLATFORM_BROADCAST", "FAMILY_CENTER_BILLING"], unreadOnly: true },
    { key: "family", conversationTypes: ["FAMILY_CENTER_BILLING"] },
    { key: "internal", conversationTypes: ["CENTER_TEACHER_INTERNAL", "CENTER_COACH_INTERNAL"] },
    { key: "support", conversationTypes: ["CENTER_PLATFORM_SUPPORT"] },
    { key: "broadcast", conversationTypes: ["PLATFORM_BROADCAST"] },
  ],
  teacher: [
    { key: "all", conversationTypes: ["WORLD_STUDENT_TEACHER", "WORLD_CLASS_GROUP", "CHILD_WORLD_GUIDED", "FAMILY_TEACHER", "CENTER_TEACHER_INTERNAL"] },
    { key: "unread", conversationTypes: ["WORLD_STUDENT_TEACHER", "WORLD_CLASS_GROUP", "CHILD_WORLD_GUIDED", "FAMILY_TEACHER", "CENTER_TEACHER_INTERNAL"], unreadOnly: true },
    { key: "class", conversationTypes: ["WORLD_STUDENT_TEACHER", "WORLD_CLASS_GROUP"] },
    { key: "family", conversationTypes: ["FAMILY_TEACHER"] },
    { key: "children", conversationTypes: ["CHILD_WORLD_GUIDED"] },
    { key: "internal", conversationTypes: ["CENTER_TEACHER_INTERNAL"] },
  ],
  coach: [
    { key: "all", conversationTypes: ["ROOTS_STUDENT_COACH", "ROOTS_PALABRE_GROUP", "CHILD_ROOTS_GUIDED", "FAMILY_COACH", "CENTER_COACH_INTERNAL"] },
    { key: "unread", conversationTypes: ["ROOTS_STUDENT_COACH", "ROOTS_PALABRE_GROUP", "CHILD_ROOTS_GUIDED", "FAMILY_COACH", "CENTER_COACH_INTERNAL"], unreadOnly: true },
    { key: "audio", conversationTypes: ["ROOTS_STUDENT_COACH", "ROOTS_PALABRE_GROUP", "CHILD_ROOTS_GUIDED"], audioOnly: true },
    { key: "family", conversationTypes: ["FAMILY_COACH"] },
    { key: "children", conversationTypes: ["CHILD_ROOTS_GUIDED"] },
    { key: "internal", conversationTypes: ["CENTER_COACH_INTERNAL"] },
  ],
  student_monde: [
    { key: "all", conversationTypes: ["WORLD_STUDENT_TEACHER", "WORLD_CLASS_GROUP"] },
    { key: "unread", conversationTypes: ["WORLD_STUDENT_TEACHER", "WORLD_CLASS_GROUP"], unreadOnly: true },
    { key: "group", conversationTypes: ["WORLD_CLASS_GROUP"] },
    { key: "audio", conversationTypes: ["WORLD_STUDENT_TEACHER", "WORLD_CLASS_GROUP"], audioOnly: true },
  ],
  student_racines: [
    { key: "all", conversationTypes: ["ROOTS_STUDENT_COACH", "ROOTS_PALABRE_GROUP"] },
    { key: "unread", conversationTypes: ["ROOTS_STUDENT_COACH", "ROOTS_PALABRE_GROUP"], unreadOnly: true },
    { key: "group", conversationTypes: ["ROOTS_PALABRE_GROUP"] },
    { key: "audio", conversationTypes: ["ROOTS_STUDENT_COACH", "ROOTS_PALABRE_GROUP"], audioOnly: true },
  ],
  child_monde: [
    { key: "all", conversationTypes: ["CHILD_WORLD_GUIDED"] },
  ],
  child_racines: [
    { key: "all", conversationTypes: ["CHILD_ROOTS_GUIDED"] },
  ],
  family: [
    { key: "all", conversationTypes: ["FAMILY_TEACHER", "FAMILY_CENTER_BILLING", "FAMILY_COACH", "CHILD_WORLD_GUIDED", "CHILD_ROOTS_GUIDED"] },
    { key: "unread", conversationTypes: ["FAMILY_TEACHER", "FAMILY_CENTER_BILLING", "FAMILY_COACH", "CHILD_WORLD_GUIDED", "CHILD_ROOTS_GUIDED"], unreadOnly: true },
    { key: "billing", conversationTypes: ["FAMILY_CENTER_BILLING"] },
    { key: "school", conversationTypes: ["FAMILY_TEACHER"] },
    { key: "sessions", conversationTypes: ["FAMILY_COACH"] },
    { key: "child_copies", conversationTypes: ["CHILD_WORLD_GUIDED", "CHILD_ROOTS_GUIDED"], childOnly: true },
  ],
};

export function getFiltersForPersona(persona: PersonaId): readonly MessagingFilter[] {
  return PERSONA_FILTERS[persona];
}

export function getDefaultFilter(persona: PersonaId): MessagingFilter {
  const filters = PERSONA_FILTERS[persona];
  return filters[0];
}
