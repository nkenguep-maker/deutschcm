"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";
import { MessagesInboxLink } from "@/features/messaging/MessagesInboxLink";

// Lot 2 · placeholder textuel · Lot P4.6-B · CTA + badge non-lus quand
// YEMA_MESSAGING_ENABLED=true (composant MessagesInboxLink retourne null
// quand l'API est 404).
export function MessagesPlaceholderSection() {
  const t = useTranslations("yemaDashboards");

  return (
    <section id="messages" aria-labelledby="messages-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="messages-title">{t("studentMonde.nav.messages")}</span>} />
      <DashboardCard>
        <DashboardEmptyState
          title={t("common.messagesSoon")}
          description={t("common.messagesSoonHelp")}
        />
        <MessagesInboxLink />
      </DashboardCard>
    </section>
  );
}
