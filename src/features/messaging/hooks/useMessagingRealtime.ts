"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

// P4.6-B.1 / .2 · souscription Realtime à un canal Broadcast privé.
//
// Contrat P4.6-B.2 · TOUS les canaux Messagerie sont créés avec
// `config.private: true`. Supabase Realtime refuse alors l'abonnement
// tant que la policy RLS sur realtime.messages (migration 20260731000003)
// n'autorise pas explicitement l'acteur pour ce topic.
//
// Fallback strict · si l'autorisation Realtime échoue (RLS pas encore
// posée, ou acteur non participant), le canal reste en status "dropped"
// et le polling 15s de useConversationSync reste actif. Aucun échec
// visible côté user, aucune fuite côté sécurité.

export type RealtimeStatus = "idle" | "subscribing" | "connected" | "reconnecting" | "dropped";

// P4.6-B.2 · Presence payload minimal · aucune identité, aucun rôle,
// aucun nom, aucun avatar. L'identité affichée dérive de l'abonnement
// authentifié (auth.uid()) côté serveur pour lots ultérieurs · pour
// l'instant on affiche uniquement un compteur "N personnes écrivent".
type PresencePayload = { kind: "typing"; at: number };
type PresenceState = Record<string, Array<Partial<PresencePayload>>>;

interface UseMessagingRealtimeOptions {
  channelName: string | null;
  // Handler pour tout event broadcast pertinent · déclenche un refetch.
  onEvent: (payload: { event: string; data: Record<string, unknown> }) => void;
  // Presence pour typing · si présent, active la souscription presence.
  // La `presenceKey` sert UNIQUEMENT à identifier localement l'entrée
  // presence de l'acteur courant (évite d'ajouter sa propre entrée à
  // typingPersonas). Elle n'est JAMAIS reçue par les autres clients ·
  // Supabase Realtime la garde côté serveur.
  presence?: {
    presenceKey: string;
    onSync?: (state: PresenceState, selfKey: string) => void;
  };
}

interface UseMessagingRealtimeResult {
  status: RealtimeStatus;
  // Émet un event typing throttled · payload minimal { kind, at }.
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
    // P4.6-B.2 · canal privé obligatoire · Realtime consulte les policies
    // RLS sur realtime.messages pour autoriser subscribe/emit.
    const ch = sb.channel(name, {
      config: {
        private: true,
        ...(opts.presence ? { presence: { key: opts.presence.presenceKey } } : {}),
      },
    });

    for (const evt of CHANNEL_EVENTS) {
      ch.on("broadcast", { event: evt }, (raw) => {
        onEventRef.current({ event: evt, data: (raw.payload ?? {}) as Record<string, unknown> });
      });
    }
    if (opts.presence) {
      const key = opts.presence.presenceKey;
      ch.on("presence", { event: "sync" }, () => {
        const state = ch.presenceState() as PresenceState;
        onSyncRef.current?.(state, key);
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
  }, [opts.channelName, opts.presence?.presenceKey]);

  const sendTyping = () => {
    const ch = channelRef.current;
    if (!ch || !opts.presence) return;
    const now = Date.now();
    if (now - lastTypingRef.current < TYPING_THROTTLE_MS) return;
    lastTypingRef.current = now;
    // P4.6-B.2 · payload strictement minimal · aucun persona, aucun rôle,
    // aucun userId. Les autres clients voient uniquement { kind, at }.
    const payload: PresencePayload = { kind: "typing", at: now };
    void ch.track(payload);
  };

  return { status, sendTyping };
}
