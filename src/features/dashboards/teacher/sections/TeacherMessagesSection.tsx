"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";
import { MessagesInboxLink } from "@/features/messaging/MessagesInboxLink";

// Messages Enseignant · Lot 3 placeholder · P4.6-B CTA + badge non-lus.
// MessagesInboxLink retourne null quand YEMA_MESSAGING_ENABLED=false.
export function TeacherMessagesSection() {
  const t = useTranslations("yemaDashboards.teacher.messages");

  return (
    <section id="messages" aria-labelledby="teacher-messages-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="teacher-messages-title">{t("title")}</span>} />
      <DashboardCard>
        <DashboardEmptyState title={t("soon")} />
        <MessagesInboxLink />
      </DashboardCard>
    </section>
  );
}
