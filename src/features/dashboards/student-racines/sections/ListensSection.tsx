"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";

type Props = {
  anyLanguageReady: boolean;
};

export function ListensSection({ anyLanguageReady }: Props) {
  const t = useTranslations("yemaDashboards.studentRacines.listens");

  return (
    <section id="ecoutes" aria-labelledby="ecoutes-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader
        title={<span id="ecoutes-title">{t("title")}</span>}
        description={t("description")}
      />
      <DashboardCard>
        <DashboardEmptyState title={anyLanguageReady ? t("empty") : t("soon")} />
      </DashboardCard>
    </section>
  );
}
