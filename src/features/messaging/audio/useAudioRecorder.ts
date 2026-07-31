"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { negotiateMimeType } from "./mimeNegotiation";

// P4.6-C.2 · état de l'enregistreur audio · brief §2.
//
// Transitions autorisées ·
//   IDLE                  → REQUESTING_PERMISSION | ERROR
//   REQUESTING_PERMISSION → RECORDING | ERROR | IDLE
//   RECORDING             → RECORDED | IDLE (cancel) | ERROR
//   RECORDED              → UPLOADING | IDLE (discard)
//   UPLOADING             → SENT | ERROR
//   SENT                  → IDLE
//   ERROR                 → IDLE (reset)
//
// Un seul recorder actif par instance de hook. Cleanup obligatoire au
// unmount ou à un changement de conversationId (côté caller).

export type RecorderState =
  | "IDLE"
  | "REQUESTING_PERMISSION"
  | "RECORDING"
  | "RECORDED"
  | "UPLOADING"
  | "SENT"
  | "ERROR";

export type RecorderErrorReason =
  | "unsupported"          // MediaRecorder absent ou aucun MIME compatible
  | "permission_denied"
  | "no_microphone"
  | "device_busy"
  | "insecure_context"
  | "unknown";

export interface RecorderSnapshot {
  state: RecorderState;
  errorReason: RecorderErrorReason | null;
  durationMs: number;      // temps enregistré (mis à jour ~250ms)
  hasBlob: boolean;
  previewUrl: string | null;
  canonicalMime: string | null;
  byteSize: number;
}

interface RecorderInternal {
  state: RecorderState;
  errorReason: RecorderErrorReason | null;
  durationMs: number;
  blob: Blob | null;
  previewUrl: string | null;
  canonicalMime: string | null;
}

type Action =
  | { type: "REQ" }
  | { type: "RECORDING_START"; mime: string }
  | { type: "TICK"; ms: number }
  | { type: "RECORDED"; blob: Blob; previewUrl: string; mime: string }
  | { type: "UPLOADING" }
  | { type: "SENT" }
  | { type: "ERROR"; reason: RecorderErrorReason }
  | { type: "RESET" };

function reducer(s: RecorderInternal, a: Action): RecorderInternal {
  switch (a.type) {
    case "REQ":
      return { ...s, state: "REQUESTING_PERMISSION", errorReason: null };
    case "RECORDING_START":
      return { ...s, state: "RECORDING", durationMs: 0, canonicalMime: null, blob: null, previewUrl: null };
    case "TICK":
      if (s.state !== "RECORDING") return s;
      return { ...s, durationMs: a.ms };
    case "RECORDED":
      return { ...s, state: "RECORDED", blob: a.blob, previewUrl: a.previewUrl, canonicalMime: a.mime };
    case "UPLOADING":
      return { ...s, state: "UPLOADING" };
    case "SENT":
      return { ...s, state: "SENT" };
    case "ERROR":
      return { ...s, state: "ERROR", errorReason: a.reason };
    case "RESET":
      return { state: "IDLE", errorReason: null, durationMs: 0, blob: null, previewUrl: null, canonicalMime: null };
  }
}

export interface UseAudioRecorderOptions {
  maxDurationMs: number;
  onError?: (reason: RecorderErrorReason) => void;
}

export interface UseAudioRecorderApi {
  snapshot: RecorderSnapshot;
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
  discard: () => void;
  markUploading: () => void;
  markSent: () => void;
  markError: () => void;
  reset: () => void;
  takeBlob: () => Blob | null;
}

const TICK_MS = 250;

export function useAudioRecorder(opts: UseAudioRecorderOptions): UseAudioRecorderApi {
  const [state, dispatch] = useReducer(reducer, {
    state: "IDLE",
    errorReason: null,
    durationMs: 0,
    blob: null,
    previewUrl: null,
    canonicalMime: null,
  });

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const onErrorRef = useRef(opts.onError);
  // Sync ref dans un effet (react-hooks/purity interdit ref.current = ... en render).
  useEffect(() => { onErrorRef.current = opts.onError; });

  const cleanupTracks = useCallback(() => {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) {
        try { t.stop(); } catch { /* noop */ }
      }
      streamRef.current = null;
    }
    if (tickTimerRef.current) { clearInterval(tickTimerRef.current); tickTimerRef.current = null; }
    if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null; }
    recorderRef.current = null;
  }, []);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      try { URL.revokeObjectURL(previewUrlRef.current); } catch { /* noop */ }
      previewUrlRef.current = null;
    }
  }, []);

  const raiseError = useCallback((reason: RecorderErrorReason) => {
    dispatch({ type: "ERROR", reason });
    onErrorRef.current?.(reason);
    cleanupTracks();
    revokePreview();
  }, [cleanupTracks, revokePreview]);

  const start = useCallback(async () => {
    // Refuse le double start.
    if (state.state === "RECORDING" || state.state === "REQUESTING_PERMISSION" || state.state === "UPLOADING") return;

    // 1. MediaRecorder + MIME negotiation.
    const mime = negotiateMimeType();
    if (!mime) { raiseError("unsupported"); return; }
    if (typeof window === "undefined" || !window.isSecureContext) {
      raiseError("insecure_context"); return;
    }
    const nav = navigator as unknown as { mediaDevices?: { getUserMedia?: MediaDevices["getUserMedia"] } };
    if (!nav.mediaDevices?.getUserMedia) { raiseError("no_microphone"); return; }

    dispatch({ type: "REQ" });
    let stream: MediaStream;
    try {
      stream = await nav.mediaDevices.getUserMedia!({ audio: true });
    } catch (e) {
      // Distinguer permission_denied / no_microphone / device_busy.
      const err = e as { name?: string };
      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") raiseError("permission_denied");
      else if (err?.name === "NotFoundError") raiseError("no_microphone");
      else if (err?.name === "NotReadableError") raiseError("device_busy");
      else raiseError("unknown");
      return;
    }
    streamRef.current = stream;

    try {
      const rec = new MediaRecorder(stream, { mimeType: mime.recorderMime });
      recorderRef.current = rec;
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      dispatch({ type: "RECORDING_START", mime: mime.canonicalMime });

      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        // Si on est en cancel, l'état a déjà été remis à IDLE et blob ignoré.
        // Sinon, on construit le Blob + preview URL.
        if (state.state === "IDLE") return;
        const blob = new Blob(chunksRef.current, { type: mime.canonicalMime });
        chunksRef.current = [];
        revokePreview();
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        dispatch({ type: "RECORDED", blob, previewUrl: url, mime: mime.canonicalMime });
        cleanupTracks();
      };
      rec.start(500); // chunks toutes les 500ms

      // Tick timer pour affichage durée.
      tickTimerRef.current = setInterval(() => {
        const ms = Date.now() - startedAtRef.current;
        dispatch({ type: "TICK", ms });
      }, TICK_MS);

      // Auto-stop à maxDurationMs.
      maxTimerRef.current = setTimeout(() => {
        if (recorderRef.current && recorderRef.current.state === "recording") {
          try { recorderRef.current.stop(); } catch { /* noop */ }
        }
      }, opts.maxDurationMs);
    } catch {
      raiseError("unknown");
    }
  }, [state.state, cleanupTracks, revokePreview, raiseError, opts.maxDurationMs]);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      try { recorderRef.current.stop(); } catch { /* noop */ }
    }
  }, []);

  const cancel = useCallback(() => {
    // Annule sans produire de Blob · nettoie tout.
    if (recorderRef.current) {
      try { recorderRef.current.ondataavailable = null; recorderRef.current.onstop = null; recorderRef.current.stop(); } catch { /* noop */ }
    }
    chunksRef.current = [];
    cleanupTracks();
    revokePreview();
    dispatch({ type: "RESET" });
  }, [cleanupTracks, revokePreview]);

  const discard = useCallback(() => {
    // Supprime le Blob local après RECORDED.
    chunksRef.current = [];
    revokePreview();
    dispatch({ type: "RESET" });
  }, [revokePreview]);

  const markUploading = useCallback(() => dispatch({ type: "UPLOADING" }), []);
  const markSent = useCallback(() => dispatch({ type: "SENT" }), []);
  const markError = useCallback(() => dispatch({ type: "ERROR", reason: "unknown" }), []);
  const reset = useCallback(() => {
    chunksRef.current = [];
    cleanupTracks();
    revokePreview();
    dispatch({ type: "RESET" });
  }, [cleanupTracks, revokePreview]);

  // Cleanup au démontage.
  useEffect(() => {
    return () => {
      chunksRef.current = [];
      cleanupTracks();
      revokePreview();
    };
  }, [cleanupTracks, revokePreview]);

  const takeBlob = useCallback(() => state.blob, [state.blob]);

  const snapshot: RecorderSnapshot = {
    state: state.state,
    errorReason: state.errorReason,
    durationMs: state.durationMs,
    hasBlob: state.blob !== null,
    previewUrl: state.previewUrl,
    canonicalMime: state.canonicalMime,
    byteSize: state.blob?.size ?? 0,
  };

  return { snapshot, start, stop, cancel, discard, markUploading, markSent, markError, reset, takeBlob };
}
