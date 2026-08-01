"use client";

import { useTranslations } from "next-intl";
import "@/features/dashboards/student-monde/ivory/tokens.css";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";
import {
  distributePathways,
  type PathwayDistributionRow,
} from "@/features/dashboards/student-monde/ivory";
import { PathwayDistributionCard } from "@/features/dashboards/monde-context";
import type { TeacherStudentRow } from "../types";

// Lot 7B.1 · contexte parcours Monde côté Teacher · DISTRIBUTION SEULE.
// La preview par apprenant a été retirée · le contexte parcours vit
// désormais directement dans la file de correction (source unique).
//
// Les students sont fournis par le parent TeacherDashboard · aucun
// fetch client ici, aucun scope divergent.

type Props = {
  students: TeacherStudentRow[];
};

export function TeacherMondeContextSection({ students }: Props) {
  const t = useTranslations("yemaDashboards.mondeContext.teacher");
  const rows: readonly PathwayDistributionRow[] = distributePathways(students);
  const totalStudents = students.length;

  return (
    <section
      id="monde-context"
      aria-labelledby="monde-context-title"
      data-monde-ivory
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <DashboardSectionHeader
        title={<span id="monde-context-title">{t("title")}</span>}
        description={t("description")}
      />
      {totalStudents === 0 ? (
        <DashboardCard>
          <DashboardEmptyState title={t("empty.title")} description={t("empty.description")} />
        </DashboardCard>
      ) : (
        <PathwayDistributionCard rows={rows} />
      )}
    </section>
  );
}
