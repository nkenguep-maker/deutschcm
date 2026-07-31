// P4.6-C.2 · MIME negotiation pour MediaRecorder navigateur.
//
// Ordre de préférence brief §3 · ne PAS envoyer le paramètre codecs
// comme mime canonique métier · le serveur normalise via magic bytes.

const PREFERRED = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
] as const;

// Mapping vers le MIME canonique métier (aligné validation serveur).
const CANONICAL = new Map<string, string>([
  ["audio/webm;codecs=opus", "audio/webm"],
  ["audio/ogg;codecs=opus", "audio/ogg"],
  ["audio/mp4", "audio/mp4"],
  ["audio/webm", "audio/webm"],
  ["audio/ogg", "audio/ogg"],
]);

export interface MimeChoice {
  recorderMime: string;   // à passer à new MediaRecorder(..., { mimeType })
  canonicalMime: string;  // à annoncer au Blob type et au business (mais serveur revalide)
}

export function negotiateMimeType(): MimeChoice | null {
  if (typeof window === "undefined") return null;
  const MR = (globalThis as unknown as { MediaRecorder?: typeof MediaRecorder }).MediaRecorder;
  if (!MR || typeof MR.isTypeSupported !== "function") return null;
  for (const rec of PREFERRED) {
    if (MR.isTypeSupported(rec)) {
      return { recorderMime: rec, canonicalMime: CANONICAL.get(rec) ?? "audio/webm" };
    }
  }
  return null;
}
