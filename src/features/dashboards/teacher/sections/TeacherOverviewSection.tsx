"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardMetric,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";
import type { TeacherDashboardResponse } from "../types";

type Props = {
  data: TeacherDashboardResponse;
};

export function TeacherOverviewSection({ data }: Props) {
  const t = useTranslations("yemaDashboards.teacher.overview");
  const stats = data.stats;
  const anyMetric = stats.classroomCount + stats.activeStudentCount + stats.pendingRequestCount > 0;

  return (
    <section id="tableau-de-bord" aria-labelledby="tableau-de-bord-title" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <DashboardSectionHeader title={<span id="tableau-de-bord-title">{t("title")}</span>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <DashboardMetric label={t("kpis.classes")} value={stats.classroomCount} />
        <DashboardMetric label={t("kpis.students")} value={stats.activeStudentCount} />
        <DashboardMetric label={t("kpis.pending")} value={stats.pendingRequestCount} />
      </div>

      {!anyMetric ? (
        <DashboardCard>
          <div style={{ fontSize: 13, color: "var(--yema-text-muted)" }}>{t("kpisEmptyHelp")}</div>
        </DashboardCard>
      ) : null}

      {!data.teacher.isVerified ? (
        <DashboardCard tone="gold">
          <div style={{ fontSize: 13, color: "var(--yema-text)" }}>{t("unverifiedHelp")}</div>
        </DashboardCard>
      ) : null}
    </section>
  );
}
