"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";

export function CoachSection() {
  const t = useTranslations("yemaDashboards.studentRacines.coach");

  return (
    <section id="mon-coach" aria-labelledby="mon-coach-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="mon-coach-title">{t("title")}</span>} />
      <DashboardCard>
        <DashboardEmptyState title={t("soon")} description={t("empty")} />
      </DashboardCard>
    </section>
  );
}
