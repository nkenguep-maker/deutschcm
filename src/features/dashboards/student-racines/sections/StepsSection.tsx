"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/features/dashboards/shared";
import type { RacinesStep } from "../types";

type Props = {
  steps: RacinesStep[];
  currentStep: string | null;
};

export function StepsSection({ steps, currentStep }: Props) {
  const t = useTranslations("yemaDashboards.studentRacines.steps");
  const tCurrent = useTranslations("yemaDashboards.studentMonde.journey");
  const locale = useLocale();

  return (
    <section id="mes-etapes" aria-labelledby="mes-etapes-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader
        title={<span id="mes-etapes-title">{t("title")}</span>}
        description={t("description")}
      />
      {steps.length === 0 ? (
        <DashboardCard>
          <DashboardEmptyState title={t("empty")} />
        </DashboardCard>
      ) : (
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {steps.map((s) => {
            const isCurrent = s.key === currentStep;
            const label = locale === "en" ? s.labelEn : s.labelFr;
            const desc = locale === "en" ? s.descriptionEn : s.descriptionFr;
            return (
              <li key={s.key}>
                <DashboardCard tone={isCurrent ? "gold" : "surface"}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span
                      aria-hidden="true"
                      className="yema-mono"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "999px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isCurrent ? "var(--yema-gold)" : "var(--yema-surface-2)",
                        color: isCurrent ? "#1a1108" : "var(--yema-text-muted)",
                        border: `1px solid ${isCurrent ? "var(--yema-gold-dark)" : "var(--yema-border)"}`,
                        fontWeight: 700,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {s.key}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--yema-text)" }}>{label}</span>
                        {isCurrent ? (
                          <DashboardStatusChip tone="gold">{tCurrent("current")}</DashboardStatusChip>
                        ) : null}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 13, color: "var(--yema-text-muted)" }}>{desc}</div>
                    </div>
                  </div>
                </DashboardCard>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
