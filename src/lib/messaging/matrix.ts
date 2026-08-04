import "server-only";
import type { ConversationType, MessagingMessageKind, MessagingParticipantRole } from "@prisma/client";

// P4.6-A · matrice de permissions Messagerie · SOURCE UNIQUE server-only.
//
// Cette table décrit ce que chaque type de conversation autorise :
//   - quels persona identifiers peuvent être MEMBER/MODERATOR/OBSERVER
//   - quels kinds de messages peuvent être envoyés selon l'actor
//   - quels contexts métier sont requis (centerId, classroomId, etc.)
//   - quelle supervision parentale s'applique
//
// Aucune duplication ailleurs · les services (assertConversationAccess,
// assertCanSendMessage) et les composants Admin (Matrice des échanges)
// consomment cette source.

export type PersonaId =
  | "super_admin"
  | "teacher"
  | "coach"
  | "center_admin"
  | "student_monde"
  | "student_racines"
  | "family"
  | "child_monde"
  | "child_racines";

export type ContextRequirement =
  | "centerId"
  | "classroomId"
  | "householdId"
  | "assignmentId"
  | "submissionId"
  | "feedbackId"
  | "invoiceId";

export interface ConversationTypeRule {
  // Personas qui peuvent être ajoutés comme MEMBER actif de ce type.
  memberPersonas: PersonaId[];
  // Personas qui peuvent être MODERATOR (souvent 1, parfois plusieurs).
  moderatorPersonas: PersonaId[];
  // Personas qui deviennent GUARDIAN_OBSERVER (lecture seule, PARENT_COPY
  // automatique). Typiquement `family` sur les fils enfants.
  guardianObserverPersonas: PersonaId[];
  // Personas qui peuvent lire mais pas écrire (broadcast destinataires).
  readOnlyPersonas: PersonaId[];
  // Kinds de messages autorisés par actorType.
  allowedKindsForUser: MessagingMessageKind[];
  allowedKindsForChildProfile: MessagingMessageKind[];
  // Contexts métier requis à la création.
  requiredContexts: ContextRequirement[];
  // Peut-on répondre dans ce fil ? PLATFORM_BROADCAST = false.
  supportsReplies: boolean;
}

// ─── Rôles autorisés par ConversationType (13 types métier) ────────
export const MESSAGING_MATRIX: Record<ConversationType, ConversationTypeRule> = {
  WORLD_STUDENT_TEACHER: {
    memberPersonas: ["student_monde", "teacher"],
    moderatorPersonas: ["teacher"],
    guardianObserverPersonas: [],
    readOnlyPersonas: [],
    allowedKindsForUser: ["TEXT", "AUDIO", "CARD", "SYSTEM"],
    allowedKindsForChildProfile: [],
    requiredContexts: ["classroomId"],
    supportsReplies: true,
  },
  WORLD_CLASS_GROUP: {
    memberPersonas: ["student_monde", "teacher"],
    moderatorPersonas: ["teacher"],
    guardianObserverPersonas: [],
    readOnlyPersonas: [],
    allowedKindsForUser: ["TEXT", "AUDIO", "CARD", "SYSTEM"],
    allowedKindsForChildProfile: [],
    requiredContexts: ["classroomId"],
    supportsReplies: true,
  },
  ROOTS_STUDENT_COACH: {
    memberPersonas: ["student_racines", "coach"],
    moderatorPersonas: ["coach"],
    guardianObserverPersonas: [],
    readOnlyPersonas: [],
    allowedKindsForUser: ["TEXT", "AUDIO", "CARD", "SYSTEM"],
    allowedKindsForChildProfile: [],
    requiredContexts: [],
    supportsReplies: true,
  },
  ROOTS_PALABRE_GROUP: {
    memberPersonas: ["student_racines", "coach"],
    moderatorPersonas: ["coach"],
    guardianObserverPersonas: [],
    readOnlyPersonas: [],
    allowedKindsForUser: ["TEXT", "AUDIO", "CARD", "SYSTEM"],
    allowedKindsForChildProfile: [],
    requiredContexts: [],
    supportsReplies: true,
  },
  CHILD_WORLD_GUIDED: {
    memberPersonas: ["child_monde", "teacher"],
    moderatorPersonas: ["teacher"],
    guardianObserverPersonas: ["family"],
    readOnlyPersonas: [],
    // Adulte : TEXT libre + audio + carte + système. Enfant : GUIDED
    // uniquement + AUDIO (le TEXT libre enfant est refusé par le service).
    allowedKindsForUser: ["TEXT", "AUDIO", "CARD", "SYSTEM"],
    allowedKindsForChildProfile: ["GUIDED_PHRASE", "AUDIO"],
    requiredContexts: [],
    supportsReplies: true,
  },
  CHILD_ROOTS_GUIDED: {
    memberPersonas: ["child_racines", "coach"],
    moderatorPersonas: ["coach"],
    guardianObserverPersonas: ["family"],
    readOnlyPersonas: [],
    allowedKindsForUser: ["TEXT", "AUDIO", "CARD", "SYSTEM"],
    allowedKindsForChildProfile: ["GUIDED_PHRASE", "AUDIO"],
    requiredContexts: [],
    supportsReplies: true,
  },
  FAMILY_TEACHER: {
    memberPersonas: ["family", "teacher"],
    moderatorPersonas: ["teacher"],
    guardianObserverPersonas: [],
    readOnlyPersonas: [],
    allowedKindsForUser: ["TEXT", "AUDIO", "CARD", "SYSTEM"],
    allowedKindsForChildProfile: [],
    requiredContexts: [],
    supportsReplies: true,
  },
  FAMILY_CENTER_BILLING: {
    memberPersonas: ["family", "center_admin"],
    moderatorPersonas: ["center_admin"],
    guardianObserverPersonas: [],
    readOnlyPersonas: [],
    allowedKindsForUser: ["TEXT", "CARD", "SYSTEM"],
    allowedKindsForChildProfile: [],
    // householdId + centerId requis. invoiceId requis UNIQUEMENT quand
    // un vrai backend de facture existe (validation service métier · brief §7).
    requiredContexts: ["householdId", "centerId"],
    supportsReplies: true,
  },
  FAMILY_COACH: {
    memberPersonas: ["family", "coach"],
    moderatorPersonas: ["coach"],
    guardianObserverPersonas: [],
    readOnlyPersonas: [],
    allowedKindsForUser: ["TEXT", "AUDIO", "CARD", "SYSTEM"],
    allowedKindsForChildProfile: [],
    requiredContexts: [],
    supportsReplies: true,
  },
  CENTER_TEACHER_INTERNAL: {
    memberPersonas: ["center_admin", "teacher"],
    moderatorPersonas: ["center_admin"],
    guardianObserverPersonas: [],
    readOnlyPersonas: [],
    allowedKindsForUser: ["TEXT", "AUDIO", "CARD", "SYSTEM"],
    allowedKindsForChildProfile: [],
    requiredContexts: ["centerId"],
    supportsReplies: true,
  },
  CENTER_COACH_INTERNAL: {
    memberPersonas: ["center_admin", "coach"],
    moderatorPersonas: ["center_admin"],
    guardianObserverPersonas: [],
    readOnlyPersonas: [],
    allowedKindsForUser: ["TEXT", "AUDIO", "CARD", "SYSTEM"],
    allowedKindsForChildProfile: [],
    requiredContexts: ["centerId"],
    supportsReplies: true,
  },
  CENTER_PLATFORM_SUPPORT: {
    memberPersonas: ["center_admin", "super_admin"],
    moderatorPersonas: ["super_admin"],
    guardianObserverPersonas: [],
    readOnlyPersonas: [],
    allowedKindsForUser: ["TEXT", "CARD", "SYSTEM"],
    allowedKindsForChildProfile: [],
    requiredContexts: ["centerId"],
    supportsReplies: true,
  },
  PLATFORM_BROADCAST: {
    memberPersonas: ["super_admin"],
    moderatorPersonas: ["super_admin"],
    guardianObserverPersonas: [],
    readOnlyPersonas: ["center_admin"],
    // Aucune réponse dans le broadcast · brief §17.
    allowedKindsForUser: ["CARD", "SYSTEM"],
    allowedKindsForChildProfile: [],
    requiredContexts: [],
    supportsReplies: false,
  },
};

export function getRule(type: ConversationType): ConversationTypeRule {
  return MESSAGING_MATRIX[type];
}

export function isPersonaAllowedAsMember(type: ConversationType, persona: PersonaId): boolean {
  return getRule(type).memberPersonas.includes(persona);
}

export function isPersonaAllowedAsGuardianObserver(
  type: ConversationType,
  persona: PersonaId,
): boolean {
  return getRule(type).guardianObserverPersonas.includes(persona);
}

export function isKindAllowedForActor(
  type: ConversationType,
  actorType: "USER" | "CHILD_PROFILE",
  kind: MessagingMessageKind,
): boolean {
  const rule = getRule(type);
  const allowed = actorType === "USER" ? rule.allowedKindsForUser : rule.allowedKindsForChildProfile;
  return allowed.includes(kind);
}

export function personaRoleFor(
  type: ConversationType,
  persona: PersonaId,
): MessagingParticipantRole | null {
  const rule = getRule(type);
  if (rule.moderatorPersonas.includes(persona)) return "MODERATOR";
  if (rule.memberPersonas.includes(persona)) return "MEMBER";
  if (rule.guardianObserverPersonas.includes(persona)) return "GUARDIAN_OBSERVER";
  if (rule.readOnlyPersonas.includes(persona)) return "READ_ONLY";
  return null;
}

// Projection JSON pour la Matrice des échanges (Super Admin) et les
// composants publics de documentation. Aucune donnée sensible.
export function getMessagingMatrixProjection() {
  return Object.entries(MESSAGING_MATRIX).map(([type, rule]) => ({
    type,
    memberPersonas: rule.memberPersonas,
    moderatorPersonas: rule.moderatorPersonas,
    guardianObserverPersonas: rule.guardianObserverPersonas,
    readOnlyPersonas: rule.readOnlyPersonas,
    allowedKindsForUser: rule.allowedKindsForUser,
    allowedKindsForChildProfile: rule.allowedKindsForChildProfile,
    requiredContexts: rule.requiredContexts,
    supportsReplies: rule.supportsReplies,
  }));
}
