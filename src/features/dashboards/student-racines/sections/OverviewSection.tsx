"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
  DashboardButtonLink,
} from "@/features/dashboards/shared";
import type { RacinesDashboardData } from "../types";

type Props = {
  data: RacinesDashboardData;
};

export function OverviewSection({ data }: Props) {
  const t = useTranslations("yemaDashboards.studentRacines.overview");

  const isFamilyEmpty = data.mode === "FAMILY" && data.household.childrenCount === 0;
  const showContentSoon =
    (!data.anyLanguageReady || data.langStatus !== "READY") &&
    data.mode !== "NO_ACCESS" &&
    !isFamilyEmpty;

  return (
    <section id="mon-tableau-de-bord" aria-labelledby="mon-tableau-de-bord-title" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <DashboardSectionHeader
        title={<span id="mon-tableau-de-bord-title">{t("title")}</span>}
      />

      {data.mode === "NO_ACCESS" ? (
        <DashboardCard>
          <DashboardEmptyState
            title={t("noAccessTitle")}
            description={t("noAccessBody")}
            action={<DashboardButtonLink variant="primary" href="/activation-intent">{t("noAccessCta")}</DashboardButtonLink>}
          />
        </DashboardCard>
      ) : null}

      {isFamilyEmpty ? (
        <DashboardCard>
          <DashboardEmptyState
            title={t("familyEmptyTitle")}
            description={t("familyEmptyBody")}
            action={<DashboardButtonLink variant="primary" href="/famille">{t("familyEmptyCta")}</DashboardButtonLink>}
          />
        </DashboardCard>
      ) : null}

      {showContentSoon ? (
        <DashboardCard tone="gold">
          <DashboardEmptyState
            title={t("contentSoonTitle")}
            description={t("contentSoonBody")}
          />
        </DashboardCard>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <DashboardCard>
          <h3 style={{ margin: "0 0 12px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>
            {t("sequenceTitle")}
          </h3>
          <DashboardEmptyState title={t("sequenceEmpty")} />
        </DashboardCard>

        <DashboardCard>
          <h3 style={{ margin: "0 0 12px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>
            {t("coachNextTitle")}
          </h3>
          <DashboardEmptyState title={t("coachNextEmpty")} />
        </DashboardCard>

        <DashboardCard>
          <h3 style={{ margin: "0 0 12px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>
            {t("circleTitle")}
          </h3>
          <DashboardEmptyState title={t("circleSoon")} />
        </DashboardCard>
      </div>
    </section>
  );
}
