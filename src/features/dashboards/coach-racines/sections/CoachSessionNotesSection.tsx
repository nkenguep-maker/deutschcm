"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";

// Notes de séance · Lot 3 : aucun modèle Prisma ni API existant (voir audit).
// Rubrique placeholder localisée.
export function CoachSessionNotesSection() {
  const t = useTranslations("yemaDashboards.coachRacines.sessionNotes");

  return (
    <section id="notes-de-seance" aria-labelledby="notes-de-seance-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="notes-de-seance-title">{t("title")}</span>} />
      <DashboardCard>
        <DashboardEmptyState title={t("soon")} />
      </DashboardCard>
    </section>
  );
}
