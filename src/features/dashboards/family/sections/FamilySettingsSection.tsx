"use client";

import { useTranslations } from "next-intl";
import { DashboardCard, DashboardEmptyState, DashboardSectionHeader } from "@/features/dashboards/shared";

export function FamilySettingsSection() {
  const t = useTranslations("yemaDashboards.family.settings");
  return (
    <section id="parametres" aria-labelledby="parametres-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader
        title={<span id="parametres-title">{t("title")}</span>}
        description={t("description")}
      />

      <DashboardCard>
        <h3 style={{ margin: "0 0 8px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>
          {t("guardiansTitle")}
        </h3>
        <DashboardEmptyState title={t("guardiansEmpty")} />
      </DashboardCard>

      <DashboardCard>
        <h3 style={{ margin: "0 0 8px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>
          {t("payerTitle")}
        </h3>
        <DashboardEmptyState title={t("payerEmpty")} />
      </DashboardCard>

      <DashboardCard>
        <h3 style={{ margin: "0 0 8px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>
          {t("pinTitle")}
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "var(--yema-text-muted)" }}>{t("pinHelp")}</p>
      </DashboardCard>

      <DashboardCard>
        <h3 style={{ margin: "0 0 8px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>
          {t("consentTitle")}
        </h3>
        <DashboardEmptyState title={t("consentEmpty")} />
      </DashboardCard>
    </section>
  );
}
