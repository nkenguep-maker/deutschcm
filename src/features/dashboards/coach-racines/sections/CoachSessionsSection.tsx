"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";

// Séances Coach · Lot 3 : aucun backend session existe (voir audit). Aucune
// migration créée dans ce lot. Rubrique placeholder localisée.
export function CoachSessionsSection() {
  const t = useTranslations("yemaDashboards.coachRacines.sessions");

  return (
    <section id="seances" aria-labelledby="seances-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="seances-title">{t("title")}</span>} />
      <DashboardCard>
        <DashboardEmptyState title={t("soon")} />
      </DashboardCard>
    </section>
  );
}
