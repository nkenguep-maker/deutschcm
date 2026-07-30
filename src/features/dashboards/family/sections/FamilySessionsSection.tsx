"use client";

import { useTranslations } from "next-intl";
import { DashboardCard, DashboardEmptyState, DashboardSectionHeader } from "@/features/dashboards/shared";

export function FamilySessionsSection() {
  const t = useTranslations("yemaDashboards.family.sessions");
  return (
    <section id="seances" aria-labelledby="family-seances-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="family-seances-title">{t("title")}</span>} />
      <DashboardCard>
        <DashboardEmptyState title={t("empty")} description={t("soon")} />
      </DashboardCard>
    </section>
  );
}
