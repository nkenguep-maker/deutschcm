// P4.6-B · types miroir des réponses API (aucune importation Prisma
// côté client).

export type PersonaId =
  | "super_admin" | "center_admin" | "teacher" | "coach"
  | "student_monde" | "student_racines" | "family"
  | "child_monde" | "child_racines";

export type ConversationType =
  | "WORLD_STUDENT_TEACHER" | "WORLD_CLASS_GROUP"
  | "ROOTS_STUDENT_COACH" | "ROOTS_PALABRE_GROUP"
  | "CHILD_WORLD_GUIDED" | "CHILD_ROOTS_GUIDED"
  | "FAMILY_TEACHER" | "FAMILY_CENTER_BILLING" | "FAMILY_COACH"
  | "CENTER_TEACHER_INTERNAL" | "CENTER_COACH_INTERNAL"
  | "CENTER_PLATFORM_SUPPORT" | "PLATFORM_BROADCAST";

export type MessageKind = "TEXT" | "AUDIO" | "GUIDED_PHRASE" | "CARD" | "SYSTEM";

export interface InboxItem {
  id: string;
  type: ConversationType;
  status: string;
  lastMessageAt: string | null;
  lastPreview: {
    kind: string;
    body: string | null;
    senderType: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export interface MessageRow {
  id: string;
  kind: MessageKind;
  body: string | null;
  guidedPhraseId: string | null;
  cardType: string | null;
  cardPayload: Record<string, unknown> | null;
  audioAssetId: string | null;
  replyToMessageId: string | null;
  senderType: "USER" | "CHILD_PROFILE";
  senderUserId: string | null;
  senderChildProfileId: string | null;
  createdAt: string;
  publishedAt: string | null;
  moderationState: string;
}

export interface GuidedPhrase {
  id: string;
  text: string;
  category: string | null;
  ordering: number;
}

export interface MatrixRow {
  type: ConversationType;
  memberPersonas: PersonaId[];
  moderatorPersonas: PersonaId[];
  guardianObserverPersonas: PersonaId[];
  readOnlyPersonas: PersonaId[];
  allowedKindsForUser: MessageKind[];
  allowedKindsForChildProfile: MessageKind[];
  requiredContexts: string[];
  supportsReplies: boolean;
}
