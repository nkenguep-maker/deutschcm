"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";

// Lot 2 · aucune fausse conversation, aucune interaction. Vraie messagerie
// arrive Lot 6/7.
export function MessagesPlaceholderSection() {
  const t = useTranslations("yemaDashboards");

  return (
    <section id="messages" aria-labelledby="messages-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="messages-title">{t("studentRacines.nav.messages")}</span>} />
      <DashboardCard>
        <DashboardEmptyState
          title={t("common.messagesSoon")}
          description={t("common.messagesSoonHelp")}
        />
      </DashboardCard>
    </section>
  );
}
