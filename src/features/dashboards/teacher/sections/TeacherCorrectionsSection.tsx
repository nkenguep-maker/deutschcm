"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";

// Corrections · Lot 3 : agrégation cross-classroom des submissions
// non-corrigées n'est pas exposée par une API existante ; les submissions
// individuelles restent accessibles via /api/teacher/assignments/[id]/submissions
// et /api/teacher/submissions/[id]. Tant qu'un endpoint d'agrégation n'existe
// pas, on montre un état neutre + rappel du contrat feedback (invisible tant
// qu'il n'est pas publié). Aucune fausse file de correction.
export function TeacherCorrectionsSection() {
  const t = useTranslations("yemaDashboards.teacher.corrections");

  return (
    <section id="corrections" aria-labelledby="corrections-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader
        title={<span id="corrections-title">{t("title")}</span>}
        description={t("description")}
      />
      <DashboardCard>
        <DashboardEmptyState
          title={t("empty")}
          description={t("invisibleUntilPublished")}
        />
      </DashboardCard>
    </section>
  );
}
