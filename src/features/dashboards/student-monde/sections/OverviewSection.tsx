"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardProgress,
  DashboardSectionHeader,
  DashboardStatusChip,
  DashboardButtonLink,
} from "@/features/dashboards/shared";
import type { AssignmentsAvailability, MondeDashboardData } from "../types";

type Props = {
  data: MondeDashboardData;
  assignments: AssignmentsAvailability;
};

type HeroState = "ACTIVE_START" | "ACTIVE_RESUME" | "ACTIVE_DONE" | "EXPIRED" | "NO_ACCESS";

function resolveHero(data: MondeDashboardData): HeroState {
  const active = data.access.status === "ACTIVE";
  if (!active) return data.access.status === "EXPIRED" ? "EXPIRED" : "NO_ACCESS";
  if (data.overallPct >= 100) return "ACTIVE_DONE";
  return data.overallPct === 0 ? "ACTIVE_START" : "ACTIVE_RESUME";
}

export function OverviewSection({ data, assignments }: Props) {
  const t = useTranslations("yemaDashboards.studentMonde.overview");
  const tStatus = useTranslations("yemaDashboards.studentMonde.assignments.status");
  const hero = resolveHero(data);

  const heroSub =
    hero === "ACTIVE_START" ? t("continueSubStart") :
    hero === "ACTIVE_RESUME" ? t("continueSubResume") :
    hero === "ACTIVE_DONE" ? t("continueSubDone") :
    hero === "EXPIRED" ? t("continueSubExpired") :
    t("continueSubNoAccess");

  const heroCta =
    hero === "ACTIVE_START" && data.nextModule
      ? { label: t("start"), href: `/courses/${data.nextModule.courseId}/modules/${data.nextModule.moduleId}` as const }
      : hero === "ACTIVE_RESUME" && data.nextModule
        ? { label: t("resume"), href: `/courses/${data.nextModule.courseId}/modules/${data.nextModule.moduleId}` as const }
        : hero === "ACTIVE_DONE"
          ? { label: t("review"), href: "/progress" as const }
          : hero === "EXPIRED"
            ? { label: t("seeOffers"), href: "/activation-intent" as const }
            : { label: t("activate"), href: "/activation-intent" as const };

  const upcoming = assignments.kind === "available"
    ? assignments.assignments.filter((a) => a.status === "PUBLISHED").slice(0, 3)
    : [];

  return (
    <section id="mon-tableau-de-bord" aria-labelledby="mon-tableau-de-bord-title" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <DashboardSectionHeader
        eyebrow={t("continueEyebrow")}
        title={<span id="mon-tableau-de-bord-title">{t("title")}</span>}
      />

      <DashboardCard tone="gold">
        <div className="yema-mono" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--yema-gold-light)" }}>
          {t("progressPct", { pct: Math.round(data.overallPct) })} · {t("progressLabel")}
        </div>
        <div style={{ marginTop: 10, marginBottom: 12 }}>
          <DashboardProgress value={data.overallPct} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "var(--yema-text)" }}>
          {t("continueTitle")}
        </div>
        <div style={{ fontSize: 13.5, color: "var(--yema-text-muted)", marginTop: 4, marginBottom: 14 }}>
          {heroSub}
        </div>
        <DashboardButtonLink variant="primary" href={heroCta.href}>
          {heroCta.label}
          {(hero === "ACTIVE_START" || hero === "ACTIVE_RESUME") && data.nextModule ? (
            <span style={{ opacity: 0.85, fontWeight: 500 }}> · {data.nextModule.label}</span>
          ) : null}
        </DashboardButtonLink>
      </DashboardCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <DashboardCard>
          <h3 style={{ margin: "0 0 12px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>
            {t("nextAssignmentsTitle")}
          </h3>
          {assignments.kind === "unavailable" ? (
            <DashboardEmptyState title={t("nextAssignmentsUnavailable")} />
          ) : upcoming.length === 0 ? (
            <DashboardEmptyState title={t("nextAssignmentsEmpty")} />
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {upcoming.map((a) => (
                <li key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 13.5, color: "var(--yema-text)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.title}
                  </span>
                  <DashboardStatusChip tone={a.status === "PUBLISHED" ? "gold" : "muted"}>
                    {a.status === "PUBLISHED" ? tStatus("published") : tStatus("closed")}
                  </DashboardStatusChip>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard>
          <h3 style={{ margin: "0 0 12px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>
            {t("recentActivityTitle")}
          </h3>
          <DashboardEmptyState title={t("recentActivityEmpty")} />
        </DashboardCard>
      </div>
    </section>
  );
}
