"use client";

import { useEffect, useRef, useState } from "react";
import type { MessageRow } from "../types";

// P4.6-B.1 · sync conversation active · Realtime + polling adaptatif.
//
// La DB reste la seule source de vérité (brief §2). Les événements
// Realtime ne portent aucun contenu · ils déclenchent uniquement un
// refetch qui re-vérifie l'accès côté serveur.
//
// Cadence polling ·
//   - realtimeConnected=true  → polling espacé (60s) en filet de sécurité
//   - realtimeConnected=false → polling actif (15s) en fallback
//   - unmount / conv change   → cleanup (un seul timer à la fois)
//
// Dédup par messageId · préserve ordre createdAt+id.

const POLL_FAST_MS = 15_000;
const POLL_SLOW_MS = 60_000;

export interface ConversationSyncState {
  messages: MessageRow[];
  isLoading: boolean;
  isError: boolean;
  connectionDropped: boolean;
  refetch: () => void;
}

interface UseConversationSyncOptions {
  realtimeConnected?: boolean;
}

export function useConversationSync(
  conversationId: string | null,
  options: UseConversationSyncOptions = {},
): ConversationSyncState {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isError, setError] = useState<boolean>(false);
  const inFlight = useRef<AbortController | null>(null);
  const realtimeConnected = options.realtimeConnected ?? false;

  const fetchMessages = () => {
    if (!conversationId) return;
    inFlight.current?.abort();
    const ctrl = new AbortController();
    inFlight.current = ctrl;
    setLoading(true);
    fetch(`/api/messaging/conversations/${conversationId}/messages`, {
      cache: "no-store",
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json: { messages: MessageRow[] }) => {
        // Dédup par messageId · ordre createdAt+id (stable).
        const map = new Map<string, MessageRow>();
        for (const m of json.messages) map.set(m.id, m);
        const list = Array.from(map.values()).sort((a, b) => {
          const t = a.createdAt.localeCompare(b.createdAt);
          if (t !== 0) return t;
          return a.id.localeCompare(b.id);
        });
        setMessages(list);
        setError(false);
      })
      .catch((e: Error) => {
        if (e.name === "AbortError") return;
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  // Fetch initial + refetch à chaque changement de conversation.
  useEffect(() => {
    if (!conversationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
      return;
    }
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Polling adaptatif · un seul timer selon la disponibilité Realtime.
  useEffect(() => {
    if (!conversationId) return;
    const interval = realtimeConnected ? POLL_SLOW_MS : POLL_FAST_MS;
    const t = setInterval(fetchMessages, interval);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, realtimeConnected]);

  // Refetch au retour de focus tab.
  useEffect(() => {
    if (!conversationId) return;
    const onFocus = () => {
      if (document.visibilityState === "visible") fetchMessages();
    };
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Cleanup in-flight au démontage complet.
  useEffect(() => () => inFlight.current?.abort(), []);

  return {
    messages,
    isLoading,
    isError,
    connectionDropped: !realtimeConnected && isError,
    refetch: fetchMessages,
  };
}
