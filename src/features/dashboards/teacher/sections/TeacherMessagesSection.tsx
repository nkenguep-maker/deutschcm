"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";

// Messages · Lot 3 : placeholder strict. Aucune fausse conversation, aucun
// faux compteur, aucun faux audio. Vraie messagerie prévue Lot 6/7.
export function TeacherMessagesSection() {
  const t = useTranslations("yemaDashboards.teacher.messages");

  return (
    <section id="messages" aria-labelledby="teacher-messages-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="teacher-messages-title">{t("title")}</span>} />
      <DashboardCard>
        <DashboardEmptyState title={t("soon")} />
      </DashboardCard>
    </section>
  );
}
