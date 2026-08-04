"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// P4.6-C.2 · playback via URL signée obtenue au clic.
//
// Brief §9 · une seule lecture simultanée · cache mémoire limité au TTL
// (avec marge 15s) · pas de préchargement. Aucun log de signed URL, de
// storageKey, ni de token.

// Registre global (module-scope) des HTMLAudioElement actifs · sert à
// mettre en pause les autres lors d'un nouveau play. Aucun contenu
// stocké, uniquement des refs.
const activePlayers: Set<HTMLAudioElement> = new Set();
function pauseOthers(current: HTMLAudioElement) {
  for (const a of activePlayers) {
    if (a !== current && !a.paused) { try { a.pause(); } catch { /* noop */ } }
  }
}

interface CachedUrl { url: string; expiresAtMs: number; }
const CACHE_MARGIN_MS = 15_000;
const cache = new Map<string, CachedUrl>();

export interface PlaybackState {
  playing: boolean;
  loading: boolean;
  error: "unauthorized" | "gone" | "network" | null;
  currentTimeMs: number;
  durationMs: number | null;
}

export interface UsePlaybackApi {
  state: PlaybackState;
  toggle: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export function useAudioPlayback(assetId: string, hintedDurationMs: number | null): UsePlaybackApi {
  const [state, setState] = useState<PlaybackState>({
    playing: false, loading: false, error: null,
    currentTimeMs: 0, durationMs: hintedDurationMs,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryUsedRef = useRef<boolean>(false);

  const ensureUrl = useCallback(async (): Promise<string | null> => {
    const cached = cache.get(assetId);
    if (cached && cached.expiresAtMs - CACHE_MARGIN_MS > Date.now()) return cached.url;
    try {
      const r = await fetch(`/api/messaging/audio/${assetId}/playback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        cache: "no-store",
      });
      if (r.status === 401 || r.status === 403) { setState((s) => ({ ...s, error: "unauthorized", loading: false })); return null; }
      if (r.status === 404 || r.status === 410) { setState((s) => ({ ...s, error: "gone", loading: false })); return null; }
      if (!r.ok) { setState((s) => ({ ...s, error: "network", loading: false })); return null; }
      const data = await r.json() as { url: string; expiresAt: string; durationMs: number | null };
      const expiresAtMs = new Date(data.expiresAt).getTime();
      cache.set(assetId, { url: data.url, expiresAtMs });
      if (typeof data.durationMs === "number") setState((s) => ({ ...s, durationMs: data.durationMs }));
      return data.url;
    } catch {
      setState((s) => ({ ...s, error: "network", loading: false }));
      return null;
    }
  }, [assetId]);

  const toggle = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;
    if (state.playing) { try { el.pause(); } catch { /* noop */ } return; }
    setState((s) => ({ ...s, loading: true, error: null }));
    const url = await ensureUrl();
    if (!url) return;
    if (el.src !== url) el.src = url;
    pauseOthers(el);
    activePlayers.add(el);
    try {
      await el.play();
      setState((s) => ({ ...s, loading: false, error: null, playing: true }));
    } catch (e) {
      // retry unique après erreur.
      const err = e as { name?: string };
      if (!retryUsedRef.current && err?.name !== "NotAllowedError") {
        retryUsedRef.current = true;
        cache.delete(assetId);
        const refreshed = await ensureUrl();
        if (refreshed && el) {
          el.src = refreshed;
          try { await el.play(); setState((s) => ({ ...s, loading: false, playing: true })); return; }
          catch { /* fall through */ }
        }
      }
      setState((s) => ({ ...s, loading: false, error: "network" }));
    }
  }, [state.playing, ensureUrl, assetId]);

  // Wire native events.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => setState((s) => ({ ...s, playing: true }));
    const onPause = () => setState((s) => ({ ...s, playing: false }));
    const onEnded = () => {
      activePlayers.delete(el);
      setState((s) => ({ ...s, playing: false, currentTimeMs: 0 }));
    };
    const onTime = () => setState((s) => ({ ...s, currentTimeMs: Math.round(el.currentTime * 1000) }));
    const onLoaded = () => {
      if (Number.isFinite(el.duration)) setState((s) => ({ ...s, durationMs: Math.round(el.duration * 1000) }));
    };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onLoaded);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onLoaded);
      try { el.pause(); } catch { /* noop */ }
      activePlayers.delete(el);
    };
  }, []);

  return { state, toggle, audioRef };
}
