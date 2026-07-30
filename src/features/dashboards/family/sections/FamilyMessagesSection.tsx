"use client";

import { useTranslations } from "next-intl";
import { DashboardCard, DashboardEmptyState, DashboardSectionHeader } from "@/features/dashboards/shared";

// Placeholder strict (brief §7 Lot 4A + doctrine no-fake-messaging depuis
// Lot 2). Vraie messagerie prévue Lot 6/7.
export function FamilyMessagesSection() {
  const t = useTranslations("yemaDashboards.family.messages");
  return (
    <section id="messages" aria-labelledby="family-messages-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="family-messages-title">{t("title")}</span>} />
      <DashboardCard>
        <DashboardEmptyState title={t("soon")} />
      </DashboardCard>
    </section>
  );
}
