"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";

export function CircleSection() {
  const t = useTranslations("yemaDashboards.studentRacines.circleSection");

  return (
    <section id="cercle" aria-labelledby="cercle-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="cercle-title">{t("title")}</span>} />
      <DashboardCard>
        <DashboardEmptyState title={t("soon")} description={t("empty")} />
      </DashboardCard>
    </section>
  );
}
