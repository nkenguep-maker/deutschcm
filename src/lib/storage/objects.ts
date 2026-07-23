// P4.1 · Storage privé · métadonnées + URLs signées.
//
// Doctrine · YEMA_P4_THREAT_MODEL.md §4-5. Aucune URL publique permanente
// pour les productions enfants. TTL courts (5 min upload · 10 min lecture).
// MIME allowlist strict côté serveur. Aucune ouverture d'endpoint upload
// en P4.1 — ce module est prêt à être appelé par P4.5 (submissions) et
// P4.6 (messages).

import type { StorageObjectPurpose } from "@prisma/client";

export const SIGNED_UPLOAD_TTL_SECONDS = 300; // 5 min
export const SIGNED_READ_TTL_SECONDS = 600; // 10 min

export const MAX_AUDIO_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_AUDIO_DURATION_SECONDS = 180; // 3 min (doctrine Suivi Racines + Q6)

export const AUDIO_MIME_ALLOWLIST = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
]);

export const ATTACHMENT_MIME_ALLOWLIST = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

export type Bucket =
  | "class-audio"
  | "class-attachment"
  | "circle-audio"
  | "circle-attachment"
  | "submission-audio"
  | "feedback-audio";

export const BUCKETS: readonly Bucket[] = [
  "class-audio",
  "class-attachment",
  "circle-audio",
  "circle-attachment",
  "submission-audio",
  "feedback-audio",
] as const;

/** Chemin de stockage canonique · jamais issu du filename client. */
export function storagePathFor(input: {
  purpose: StorageObjectPurpose;
  circleId?: string | null;
  classId?: string | null;
  membershipId?: string | null;
  submissionId?: string | null;
  feedbackId?: string | null;
  sha256Prefix: string; // 12 hex chars minimum
  ext: string; // "webm" · "mp3" · "pdf" · ...
}): string {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  const safeExt = input.ext.replace(/[^a-z0-9]/gi, "").slice(0, 6).toLowerCase();
  const safePrefix = input.sha256Prefix.replace(/[^a-f0-9]/gi, "").slice(0, 12).toLowerCase();
  const rand = Math.random().toString(36).slice(2, 8);
  const filename = `${safePrefix}-${rand}.${safeExt}`;
  switch (input.purpose) {
    case "CIRCLE_MESSAGE_AUDIO":
      if (!input.circleId || !input.membershipId) throw new Error("missing_scope_ids");
      return `${month}/circle/${input.circleId}/member/${input.membershipId}/${filename}`;
    case "CLASS_MESSAGE_AUDIO":
      if (!input.classId || !input.membershipId) throw new Error("missing_scope_ids");
      return `${month}/class/${input.classId}/member/${input.membershipId}/${filename}`;
    case "SUBMISSION_AUDIO":
      if (!input.submissionId) throw new Error("missing_scope_ids");
      return `${month}/submission/${input.submissionId}/${filename}`;
    case "FEEDBACK_AUDIO":
      if (!input.feedbackId) throw new Error("missing_scope_ids");
      return `${month}/feedback/${input.feedbackId}/${filename}`;
    case "ATTACHMENT":
      if (input.circleId) {
        if (!input.membershipId) throw new Error("missing_scope_ids");
        return `${month}/circle/${input.circleId}/member/${input.membershipId}/${filename}`;
      }
      if (input.classId) {
        if (!input.membershipId) throw new Error("missing_scope_ids");
        return `${month}/class/${input.classId}/member/${input.membershipId}/${filename}`;
      }
      throw new Error("missing_scope_ids");
  }
}

export function bucketFor(purpose: StorageObjectPurpose, scope: "circle" | "class"): Bucket {
  switch (purpose) {
    case "CIRCLE_MESSAGE_AUDIO":
      return "circle-audio";
    case "CLASS_MESSAGE_AUDIO":
      return "class-audio";
    case "SUBMISSION_AUDIO":
      return "submission-audio";
    case "FEEDBACK_AUDIO":
      return "feedback-audio";
    case "ATTACHMENT":
      return scope === "circle" ? "circle-attachment" : "class-attachment";
  }
}

export function isAudioMimeAllowed(mime: string): boolean {
  return AUDIO_MIME_ALLOWLIST.has(mime.toLowerCase());
}

export function isAttachmentMimeAllowed(mime: string): boolean {
  return ATTACHMENT_MIME_ALLOWLIST.has(mime.toLowerCase());
}

/**
 * Calcule la date de rétention automatique par purpose. Q7 validée ·
 * 90 jours audio Circle, 12 mois pour productions/feedbacks.
 */
export function retentionUntilFor(purpose: StorageObjectPurpose, now = new Date()): Date {
  const d = new Date(now);
  switch (purpose) {
    case "CIRCLE_MESSAGE_AUDIO":
      d.setDate(d.getDate() + 90);
      return d;
    case "CLASS_MESSAGE_AUDIO":
      d.setMonth(d.getMonth() + 12);
      return d;
    case "SUBMISSION_AUDIO":
    case "FEEDBACK_AUDIO":
      d.setMonth(d.getMonth() + 12);
      return d;
    case "ATTACHMENT":
      d.setMonth(d.getMonth() + 12);
      return d;
  }
}
