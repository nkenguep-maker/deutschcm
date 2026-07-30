"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";

// Messages Coach · Lot 3 : placeholder strict. Aucune fausse conversation,
// aucun faux audio. Vraie messagerie vocale prévue Lot 6/7.
export function CoachMessagesSection() {
  const t = useTranslations("yemaDashboards.coachRacines.messages");

  return (
    <section id="messages" aria-labelledby="coach-messages-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="coach-messages-title">{t("title")}</span>} />
      <DashboardCard>
        <DashboardEmptyState title={t("soon")} />
      </DashboardCard>
    </section>
  );
}
