"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  DashboardButtonLink,
  DashboardCard,
  DashboardEmptyState,
  DashboardMetric,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/features/dashboards/shared";
import type { FamilyDashboardResponse } from "../types";

type Props = {
  data: FamilyDashboardResponse;
};

export function FamilyOverviewSection({ data }: Props) {
  const t = useTranslations("yemaDashboards.family.overview");
  const locale = useLocale();
  const noSeatLabel = locale === "en"
    ? "Adding another child is temporarily unavailable during the beta."
    : "L’ajout d’un autre profil enfant est temporairement indisponible pendant la bêta.";

  return (
    <section id="accueil" aria-labelledby="accueil-title" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <DashboardSectionHeader title={<span id="accueil-title">{t("title")}</span>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <DashboardMetric label={t("kpisChildrenTitle")} value={data.totalChildrenLinked} />
        <DashboardMetric label={t("kpisSeatsTitle")} value={data.totalChildSeatsAvailable} />
        <DashboardMetric
          label={t("kpisAdultTitle")}
          value={
            data.adultAccess.hasAnyAdultAccess
              ? [
                  data.adultAccess.monde ? t("kpisAdultMonde") : null,
                  data.adultAccess.racines ? t("kpisAdultRacines") : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "—"
          }
          hint={!data.adultAccess.hasAnyAdultAccess ? t("kpisAdultNone") : undefined}
        />
      </div>

      {data.totalChildrenLinked === 0 ? (
        <DashboardCard tone="gold">
          <DashboardEmptyState
            title={t("noChildrenTitle")}
            description={t("noChildrenBody")}
            action={
              data.canAddChild ? (
                <DashboardButtonLink variant="primary" href="#mes-enfants">
                  {t("addChildCta")}
                </DashboardButtonLink>
              ) : (
                <DashboardStatusChip tone="muted">{noSeatLabel}</DashboardStatusChip>
              )
            }
          />
        </DashboardCard>
      ) : null}

      <DashboardCard>
        <h3 style={{ margin: "0 0 12px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>
          {t("recentTitle")}
        </h3>
        <DashboardEmptyState title={t("recentEmpty")} />
      </DashboardCard>
    </section>
  );
}
