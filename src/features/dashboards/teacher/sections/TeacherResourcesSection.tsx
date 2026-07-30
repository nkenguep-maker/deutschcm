"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";

// Ressources · Lot 3 : aucun backend fonctionnel (ni table Prisma ni API).
// Rubrique placeholder tant qu'une source de vérité n'est pas définie.
export function TeacherResourcesSection() {
  const t = useTranslations("yemaDashboards.teacher.resources");

  return (
    <section id="ressources" aria-labelledby="ressources-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="ressources-title">{t("title")}</span>} />
      <DashboardCard>
        <DashboardEmptyState title={t("soon")} />
      </DashboardCard>
    </section>
  );
}
