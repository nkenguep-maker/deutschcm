"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

// P4.6-B.1 · souscription Realtime à un canal Broadcast unique.
//
// Contrat ·
//   - Un seul canal par instance de hook · sub/unsub au changement de
//     channelName ou au démontage.
//   - Les events Realtime ne portent aucune donnée sensible · uniquement
//     un ping qui déclenche `onEvent`, lequel doit refetch via API.
//   - Statut de connexion exposé pour désactiver le polling quand
//     Realtime est actif.
//   - Presence optionnel (typing éphémère) · aucun stockage DB.

export type RealtimeStatus = "idle" | "subscribing" | "connected" | "reconnecting" | "dropped";

type PresenceState = Record<string, Array<{ persona?: string; kind?: "typing" }>>;

interface UseMessagingRealtimeOptions {
  channelName: string | null;
  // Handler pour tout event broadcast pertinent · déclenche un refetch.
  onEvent: (payload: { event: string; data: Record<string, unknown> }) => void;
  // Presence pour typing (optionnel).
  presence?: {
    persona: string;
    onSync?: (state: PresenceState) => void;
  };
}

interface UseMessagingRealtimeResult {
  status: RealtimeStatus;
  // Émet un event typing throttled (visible ~5s côté autres participants).
  sendTyping: () => void;
}

const CHANNEL_EVENTS = ["message_created", "read_state_updated"] as const;
const TYPING_THROTTLE_MS = 3_000;

let sharedClient: SupabaseClient | null = null;
function getSupabase(): SupabaseClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  if (!sharedClient) {
    try { sharedClient = createClient() as unknown as SupabaseClient; }
    catch { sharedClient = null; }
  }
  return sharedClient;
}

export function useMessagingRealtime(opts: UseMessagingRealtimeOptions): UseMessagingRealtimeResult {
  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastTypingRef = useRef<number>(0);
  const onEventRef = useRef(opts.onEvent);
  const onSyncRef = useRef(opts.presence?.onSync);

  // Sync refs dans un effet (react-hooks/purity interdit ref.current= en render).
  useEffect(() => {
    onEventRef.current = opts.onEvent;
    onSyncRef.current = opts.presence?.onSync;
  });

  useEffect(() => {
    const sb = getSupabase();
    const name = opts.channelName;
    if (!sb || !name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("idle");
      return;
    }
    setStatus("subscribing");
    const ch = sb.channel(name, {
      config: opts.presence ? { presence: { key: opts.presence.persona } } : {},
    });

    for (const evt of CHANNEL_EVENTS) {
      ch.on("broadcast", { event: evt }, (raw) => {
        onEventRef.current({ event: evt, data: (raw.payload ?? {}) as Record<string, unknown> });
      });
    }
    if (opts.presence) {
      ch.on("presence", { event: "sync" }, () => {
        const state = ch.presenceState() as PresenceState;
        onSyncRef.current?.(state);
      });
    }

    ch.subscribe((s) => {
      if (s === "SUBSCRIBED") setStatus("connected");
      else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") setStatus("reconnecting");
      else if (s === "CLOSED") setStatus("dropped");
    });

    channelRef.current = ch;
    return () => {
      // Cleanup obligatoire · unmount, changement fil, changement persona.
      ch.unsubscribe();
      channelRef.current = null;
      setStatus("idle");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.channelName, opts.presence?.persona]);

  const sendTyping = () => {
    const ch = channelRef.current;
    if (!ch || !opts.presence) return;
    const now = Date.now();
    if (now - lastTypingRef.current < TYPING_THROTTLE_MS) return;
    lastTypingRef.current = now;
    // Presence track · state expiré automatiquement à unsubscribe ; on
    // envoie un heartbeat périodique via re-track pendant que l'user tape.
    void ch.track({ persona: opts.presence.persona, kind: "typing", at: now });
  };

  return { status, sendTyping };
}
