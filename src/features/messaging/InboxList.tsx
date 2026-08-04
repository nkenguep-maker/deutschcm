"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { InboxItem } from "./types";
import { useMessagingRealtime } from "./hooks/useMessagingRealtime";

type Props = {
  filter: string;
  activeConversationId: string | null;
  onSelect: (id: string) => void;
};

export function InboxList({ filter, activeConversationId, onSelect }: Props) {
  const t = useTranslations("yemaMessaging");
  const tTypes = useTranslations("yemaMessaging.types");
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [inboxChannel, setInboxChannel] = useState<string | null>(null);

  const refetch = useCallback(() => {
    fetch(`/api/messaging/inbox?filter=${encodeURIComponent(filter)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("http"))))
      .then((json: { conversations: InboxItem[] }) => setItems(json.conversations))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [filter]);

  // Résout une seule fois le canal inbox de l'acteur courant.
  // P4.6-B.2 · channelName peut être null (enfant sans auth Supabase) ·
  // dans ce cas useMessagingRealtime skip la souscription et le polling
  // fast (15s) rattrape les événements.
  useEffect(() => {
    fetch("/api/messaging/self", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("http"))))
      .then((json: { channelName: string | null }) => setInboxChannel(json.channelName ?? null))
      .catch(() => setInboxChannel(null));
  }, []);

  // Realtime inbox · un canal unique par acteur. Cleanup au changement
  // de persona (channelName change) ou démontage.
  useMessagingRealtime({
    channelName: inboxChannel,
    onEvent: () => refetch(),
  });

  useEffect(() => {
    // Fetch on mount / filter change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  if (loading) return <div style={{ padding: 12, color: "var(--yema-text-muted)" }}>{t("loading")}</div>;
  if (error) return <div style={{ padding: 12, color: "var(--yema-alert)" }}>{t("error")}</div>;
  if (items.length === 0) {
    return (
      <div style={{ padding: 20, color: "var(--yema-text-muted)", fontSize: 13 }}>
        {filter === "all" ? t("empty") : t("emptyFilter")}
      </div>
    );
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }} role="list" aria-label={t("title")}>
      {items.map((item) => {
        const active = item.id === activeConversationId;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={active ? "true" : undefined}
              style={{
                width: "100%",
                minHeight: 64,
                textAlign: "left",
                padding: "10px 14px",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                background: active ? "var(--yema-gold-glow)" : "transparent",
                border: "none",
                borderBottom: "1px solid var(--yema-border)",
                color: "var(--yema-text)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tTypes(item.type)}
                  </span>
                  {item.unreadCount > 0 ? (
                    <span
                      className="yema-mono"
                      aria-label={t("unreadBadge", { count: item.unreadCount })}
                      style={{
                        background: "var(--yema-gold)",
                        color: "#1a1108",
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 8px",
                        minWidth: 20,
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      {item.unreadCount > 99 ? "99+" : item.unreadCount}
                    </span>
                  ) : null}
                </div>
                {item.lastPreview?.body ? (
                  <div style={{ fontSize: 12, color: "var(--yema-text-muted)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.lastPreview.body}
                  </div>
                ) : null}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
