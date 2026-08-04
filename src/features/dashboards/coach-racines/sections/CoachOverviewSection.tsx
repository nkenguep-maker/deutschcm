"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardMetric,
  DashboardProgress,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";
import type { CoachDashboardStats } from "../types";

type Props = {
  stats: CoachDashboardStats;
};

export function CoachOverviewSection({ stats }: Props) {
  const t = useTranslations("yemaDashboards.coachRacines.overview");

  return (
    <section id="tableau-de-bord" aria-labelledby="tableau-de-bord-title" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <DashboardSectionHeader title={<span id="tableau-de-bord-title">{t("title")}</span>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        <DashboardCard>
          <div className="yema-mono" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--yema-text-muted)" }}>
            {t("capacityCirclesTitle")}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--yema-text-muted)" }}>
            {t("capacityCirclesHelp", { active: stats.activeCircleCount, max: stats.circleCapacityMax })}
          </div>
          <div style={{ marginTop: 12 }}>
            <DashboardProgress
              value={stats.activeCircleCount}
              max={stats.circleCapacityMax || 1}
              ariaLabel={t("capacityCirclesTitle")}
            />
          </div>
        </DashboardCard>

        <DashboardCard>
          <div className="yema-mono" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--yema-text-muted)" }}>
            {t("capacityChildrenTitle")}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--yema-text-muted)" }}>
            {t("capacityChildrenHelp", { active: stats.activeChildProfileCount, max: stats.profileCapacityMax })}
          </div>
          <div style={{ marginTop: 12 }}>
            <DashboardProgress
              value={stats.activeChildProfileCount}
              max={stats.profileCapacityMax || 1}
              ariaLabel={t("capacityChildrenTitle")}
            />
          </div>
        </DashboardCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <DashboardCard>
          <h3 style={{ margin: "0 0 12px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>
            {t("languagesTitle")}
          </h3>
          {stats.languageBreakdown.length === 0 ? (
            <DashboardEmptyState title={t("languagesEmpty")} />
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.languageBreakdown.map((row) => (
                <li key={row.language} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 13, color: "var(--yema-text)" }}>{row.language}</span>
                  <span className="yema-mono" style={{ fontSize: 12, color: "var(--yema-text-muted)" }}>
                    {row.activeCircleCount} · {row.activeChildCount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard>
          <h3 style={{ margin: "0 0 12px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>
            {t("todaySessionsTitle")}
          </h3>
          <DashboardEmptyState title={t("todaySessionsEmpty")} />
        </DashboardCard>

        <DashboardCard>
          <h3 style={{ margin: "0 0 12px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>
            {t("notesToDraftTitle")}
          </h3>
          <DashboardEmptyState title={t("notesToDraftEmpty")} />
        </DashboardCard>
      </div>

      <DashboardMetric
        label={t("capacityCirclesTitle")}
        value={`${stats.activeCircleCount} / ${stats.circleCapacityMax}`}
        hint={t("capacityChildrenHelp", { active: stats.activeChildProfileCount, max: stats.profileCapacityMax })}
      />
    </section>
  );
}
