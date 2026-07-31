import "server-only";

// P4.6-C.1 · constantes server-only pour audio messagerie.
// Toutes les limites sont enforcées côté serveur, jamais confiées au client.

export const AUDIO_LIMITS = {
  ADULT: {
    maxDurationMs: 180_000,           // 180s
    maxSizeBytes: 8 * 1024 * 1024,    // 8 MiB
    maxUploadsPerHour: 20,
  },
  CHILD: {
    maxDurationMs: 60_000,            // 60s
    maxSizeBytes: 4 * 1024 * 1024,    // 4 MiB
    maxUploadsPerHour: 10,
  },
} as const;

// Bucket size bound aligned to adult limit (Supabase enforces at bucket level).
export const AUDIO_BUCKET_MAX_BYTES = AUDIO_LIMITS.ADULT.maxSizeBytes;

// P4.6-C.1 · MIME → extension canonique (utilisée dans storageKey).
// L'extension du fichier client N'EST JAMAIS lue · seul le magic byte
// détecté côté serveur choisit l'extension.
export const AUDIO_MIME_TO_EXTENSION: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg":  "ogg",
  "audio/mp4":  "m4a",
  "audio/mpeg": "mp3",
  "audio/wav":  "wav",
};

export const AUDIO_ALLOWED_MIMES: readonly string[] = Object.keys(AUDIO_MIME_TO_EXTENSION);

// Canonical bucket name · doit rester privé sur Supabase.
export const AUDIO_BUCKET_NAME = "yema-messaging-audio-private";

// Retention window borne (jours). Lue via YEMA_MESSAGE_AUDIO_RETENTION_DAYS.
export const AUDIO_RETENTION_MIN_DAYS = 30;
export const AUDIO_RETENTION_MAX_DAYS = 730;
export const AUDIO_RETENTION_DEFAULT_DAYS = 365;

// TTL max pour URL signée playback (secondes). Brief §7.
export const AUDIO_SIGNED_URL_TTL_SECONDS = 300;

export function getRetentionDays(): number {
  const raw = process.env.YEMA_MESSAGE_AUDIO_RETENTION_DAYS;
  if (!raw) return AUDIO_RETENTION_DEFAULT_DAYS;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return AUDIO_RETENTION_DEFAULT_DAYS;
  if (n < AUDIO_RETENTION_MIN_DAYS) return AUDIO_RETENTION_MIN_DAYS;
  if (n > AUDIO_RETENTION_MAX_DAYS) return AUDIO_RETENTION_MAX_DAYS;
  return n;
}

export function limitsForActor(actorType: "USER" | "CHILD_PROFILE") {
  return actorType === "CHILD_PROFILE" ? AUDIO_LIMITS.CHILD : AUDIO_LIMITS.ADULT;
}
