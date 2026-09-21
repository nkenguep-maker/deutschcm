"use client";

import { useTranslations } from "next-intl";
import { DashboardCard, DashboardSectionHeader } from "@/features/dashboards/shared";
import { MessagesInboxLink } from "@/features/messaging/MessagesInboxLink";

export function FamilyMessagesSection() {
  const t = useTranslations("yemaDashboards.family.messages");
  return (
    <section id="messages" aria-labelledby="family-messages-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="family-messages-title">{t("title")}</span>} />
      <DashboardCard>
        <MessagesInboxLink />
      </DashboardCard>
    </section>
  );
}
