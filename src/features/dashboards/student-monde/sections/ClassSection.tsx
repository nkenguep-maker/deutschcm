"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";

// Ma classe · Lot 2 : aucun resolver "classroom info côté élève" n'est encore
// exposé. Les classroomId présents dans les assignments sont des UUID internes
// qui ne doivent JAMAIS être rendus dans le HTML — ils restent disponibles
// côté data (via /api/student/assignments) pour de futurs liens/appels serveur.
// Tant qu'aucun vrai resolver n'est branché, on affiche un état neutre localisé,
// jamais un identifiant. Aucun prop nécessaire dans ce lot.
export function ClassSection() {
  const t = useTranslations("yemaDashboards.studentMonde.classSection");

  return (
    <section id="ma-classe" aria-labelledby="ma-classe-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="ma-classe-title">{t("title")}</span>} />
      <DashboardCard>
        <DashboardEmptyState title={t("classroomsSoon")} />
      </DashboardCard>
    </section>
  );
}
