"use client";

import { useEffect, useRef, useState } from "react";
import type { MessageRow } from "../types";

// P4.6-B · Realtime hook · polling-fallback discipliné.
//
// La DB reste la source de vérité (brief §7). Pas de trust au payload
// event. Comportement :
//   - Fetch initial des messages.
//   - Polling toutes les 15s en fond (fallback si Realtime absent).
//   - Rafraîchit sur focus tab (visibilitychange).
//   - Dédup par messageId · préserve ordre createdAt+id.
//   - On error : conserve la liste précédente, expose connectionDropped.
//
// Le brief autorise ce fallback en attendant l'intégration Supabase
// Realtime channel. L'infra channel est prête (indexes messaging_messages
// conversationId+createdAt), pas de dépendance côté client aujourd'hui.

const POLL_INTERVAL_MS = 15_000;

export interface ConversationSyncState {
  messages: MessageRow[];
  isLoading: boolean;
  isError: boolean;
  connectionDropped: boolean;
  refetch: () => void;
}

export function useConversationSync(conversationId: string | null): ConversationSyncState {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isError, setError] = useState<boolean>(false);
  const [connectionDropped, setDropped] = useState<boolean>(false);
  const inFlight = useRef<AbortController | null>(null);

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
        // Dédup par messageId · ordre createdAt+id.
        const map = new Map<string, MessageRow>();
        for (const m of json.messages) map.set(m.id, m);
        const list = Array.from(map.values()).sort((a, b) => {
          const t = a.createdAt.localeCompare(b.createdAt);
          if (t !== 0) return t;
          return a.id.localeCompare(b.id);
        });
        setMessages(list);
        setError(false);
        setDropped(false);
      })
      .catch((e: Error) => {
        if (e.name === "AbortError") return;
        setError(true);
        setDropped(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!conversationId) {
      // Reset explicite quand aucune conversation active · état vide propre.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
      return;
    }
    fetchMessages();
    const t = setInterval(fetchMessages, POLL_INTERVAL_MS);
    const onFocus = () => {
      if (document.visibilityState === "visible") fetchMessages();
    };
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onFocus);
      inFlight.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return { messages, isLoading, isError, connectionDropped, refetch: fetchMessages };
}
