"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";
import { MessagesInboxLink } from "@/features/messaging/MessagesInboxLink";

// Messages Coach · Lot 3 placeholder · P4.6-B CTA vocal-first bientôt.
// Le MessagesInboxLink retourne null quand YEMA_MESSAGING_ENABLED=false.
export function CoachMessagesSection() {
  const t = useTranslations("yemaDashboards.coachRacines.messages");

  return (
    <section id="messages" aria-labelledby="coach-messages-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="coach-messages-title">{t("title")}</span>} />
      <DashboardCard>
        <DashboardEmptyState title={t("soon")} />
        <MessagesInboxLink />
      </DashboardCard>
    </section>
  );
}
