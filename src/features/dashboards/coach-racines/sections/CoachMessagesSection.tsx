"use client";

import { useTranslations } from "next-intl";
import { DashboardCard, DashboardSectionHeader } from "@/features/dashboards/shared";
import { MessagesInboxLink } from "@/features/messaging/MessagesInboxLink";

export function CoachMessagesSection() {
  const t = useTranslations("yemaDashboards.coachRacines.messages");
  return (
    <section id="messages" aria-labelledby="coach-messages-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="coach-messages-title">{t("title")}</span>} />
      <DashboardCard>
        <MessagesInboxLink />
      </DashboardCard>
    </section>
  );
}
