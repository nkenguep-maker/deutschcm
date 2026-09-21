"use client";

import { useTranslations } from "next-intl";
import { DashboardCard, DashboardSectionHeader } from "@/features/dashboards/shared";
import { MessagesInboxLink } from "@/features/messaging/MessagesInboxLink";

export function TeacherMessagesSection() {
  const t = useTranslations("yemaDashboards.teacher.messages");
  return (
    <section id="messages" aria-labelledby="teacher-messages-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="teacher-messages-title">{t("title")}</span>} />
      <DashboardCard>
        <MessagesInboxLink />
      </DashboardCard>
    </section>
  );
}
