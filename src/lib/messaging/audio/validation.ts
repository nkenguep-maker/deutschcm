import "server-only";
import { parseBuffer } from "music-metadata";
import { AUDIO_ALLOWED_MIMES, AUDIO_MIME_TO_EXTENSION } from "./limits";

// P4.6-C.1 · validation audio server-only · magic bytes + parse durée.
//
// Ne JAMAIS faire confiance à ·
//   - l'extension du fichier ;
//   - le nom du fichier ;
//   - le Content-Type envoyé par le navigateur ;
//   - la durée déclarée par le client.
//
// La MIME retenue vient uniquement du magic byte détecté ci-dessous +
// confirmé par music-metadata (pure JS, aucun binaire ffmpeg).

export type AudioValidationDenial =
  | "empty"
  | "too_large"
  | "unsupported_container"
  | "mime_container_mismatch"
  | "unreadable"
  | "duration_missing"
  | "duration_exceeded";

export interface AudioValidationOk {
  ok: true;
  mimeType: string;                 // canonique (jamais celui du client)
  extension: string;                // canonique
  byteSize: number;
  durationMs: number;
}

export interface AudioValidationFail {
  ok: false;
  error: AudioValidationDenial;
}

export type AudioValidationResult = AudioValidationOk | AudioValidationFail;

// Signatures magic bytes minimales.
function detectMimeFromMagic(buf: Buffer): string | null {
  if (buf.length < 4) return null;
  // WebM / Matroska · EBML header 0x1A 0x45 0xDF 0xA3
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return "audio/webm";
  }
  // OGG · "OggS"
  if (buf[0] === 0x4f && buf[1] === 0x67 && buf[2] === 0x67 && buf[3] === 0x53) {
    return "audio/ogg";
  }
  // WAV · "RIFF" + "WAVE" at byte 8
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x41 && buf[10] === 0x56 && buf[11] === 0x45
  ) {
    return "audio/wav";
  }
  // MP3 · "ID3" header ou frame sync 0xFF 0xFB/0xFA/0xF3/0xF2
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return "audio/mpeg";
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return "audio/mpeg";
  // MP4 / M4A · "ftyp" à byte 4
  if (
    buf.length >= 12 &&
    buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70
  ) {
    return "audio/mp4";
  }
  return null;
}

/**
 * Valide un buffer audio · retourne mime/extension canoniques + durée
 * réelle. Fail-closed si ambiguïté.
 *
 * @param buf   contenu binaire complet du fichier (déjà borné à la limite)
 * @param maxSizeBytes taille max acceptée · sera re-vérifiée ici
 * @param maxDurationMs durée max acceptée · sera re-vérifiée ici
 */
export async function validateAudioBuffer(
  buf: Buffer,
  maxSizeBytes: number,
  maxDurationMs: number,
): Promise<AudioValidationResult> {
  if (buf.length === 0) return { ok: false, error: "empty" };
  if (buf.length > maxSizeBytes) return { ok: false, error: "too_large" };

  const magicMime = detectMimeFromMagic(buf);
  if (!magicMime || !AUDIO_ALLOWED_MIMES.includes(magicMime)) {
    return { ok: false, error: "unsupported_container" };
  }

  // music-metadata inspecte le container plus finement · confirme cohérence.
  let meta;
  try {
    meta = await parseBuffer(buf, { mimeType: magicMime, size: buf.length }, { duration: true });
  } catch {
    return { ok: false, error: "unreadable" };
  }

  const parsedMime = normalizeMime(meta.format?.container, magicMime);
  if (parsedMime && parsedMime !== magicMime && !areCompatible(parsedMime, magicMime)) {
    return { ok: false, error: "mime_container_mismatch" };
  }

  const durationSec = meta.format?.duration;
  if (typeof durationSec !== "number" || !Number.isFinite(durationSec) || durationSec <= 0) {
    return { ok: false, error: "duration_missing" };
  }
  const durationMs = Math.round(durationSec * 1000);
  if (durationMs > maxDurationMs) {
    return { ok: false, error: "duration_exceeded" };
  }

  return {
    ok: true,
    mimeType: magicMime,
    extension: AUDIO_MIME_TO_EXTENSION[magicMime]!,
    byteSize: buf.length,
    durationMs,
  };
}

function normalizeMime(container: string | undefined, fallback: string): string | null {
  if (!container) return fallback;
  const c = container.toLowerCase();
  if (c.includes("webm")) return "audio/webm";
  if (c.includes("ogg")) return "audio/ogg";
  if (c.includes("wave") || c === "wav") return "audio/wav";
  if (c === "mpeg" || c === "mp3") return "audio/mpeg";
  if (c.includes("mp4") || c.includes("m4a") || c.includes("isom") || c.includes("iso")) return "audio/mp4";
  return null;
}

// Certains conteneurs sont interchangeables · e.g. music-metadata peut
// annoncer "ogg" pour un webm audio codec Opus. On accepte quelques
// paires équivalentes strictes.
function areCompatible(a: string, b: string): boolean {
  const pairs: Array<[string, string]> = [
    ["audio/webm", "audio/ogg"],
    ["audio/ogg", "audio/webm"],
  ];
  return pairs.some(([x, y]) => x === a && y === b);
}
