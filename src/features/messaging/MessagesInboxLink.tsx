"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

// P4.6-B · CTA + badge non-lus consommable par les 9 dashboards.
// Quand YEMA_MESSAGING_ENABLED=false → l'API renvoie 404 · le composant
// affiche null · le placeholder legacy prend seul l'espace.
// Quand true → CTA vers /[locale]/messages + badge non-lus réel.

export function MessagesInboxLink() {
  const t = useTranslations("yemaMessaging");
  const locale = useLocale();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [unread, setUnread] = useState<number>(0);

  useEffect(() => {
    fetch("/api/messaging/unread-summary", { cache: "no-store" })
      .then((r) => {
        if (r.status === 404) {
          setAvailable(false);
          return null;
        }
        return r.json();
      })
      .then((data: { totalUnread: number } | null) => {
        if (!data) return;
        setAvailable(true);
        setUnread(data.totalUnread ?? 0);
      })
      .catch(() => setAvailable(false));
  }, []);

  if (available !== true) return null;

  return (
    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
      <Link
        href={`/${locale}/messages`}
        style={{
          minHeight: 44,
          padding: "10px 18px",
          borderRadius: "var(--yema-r-pill)",
          border: "1px solid var(--yema-gold-edge)",
          background: "var(--yema-gold-glow)",
          color: "var(--yema-gold-light)",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {t("openMessages")}
        {unread > 0 ? (
          <span
            className="yema-mono"
            aria-label={t("unreadBadge", { count: unread })}
            style={{
              background: "var(--yema-gold)",
              color: "#1a1108",
              borderRadius: 999,
              padding: "1px 8px",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
