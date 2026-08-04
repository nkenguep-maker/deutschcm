"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/features/dashboards/shared";
import type { CoachChildProfileRow } from "../types";

type Props = {
  learners: CoachChildProfileRow[];
  loading: boolean;
  baseHref: string;
};

// Isolation stricte : les learners rendus proviennent de /api/roots-coach/profiles
// qui n'expose que displayName + avatarAnimal + ageBand + activeLangue +
// circleLanguage (jamais nom complet, jamais date de naissance, jamais
// learnerId brut sauf comme cible d'un lien HTTP autorisé par le resolver).
export function CoachLearnersSection({ learners, loading, baseHref }: Props) {
  const t = useTranslations("yemaDashboards.coachRacines.learners");

  return (
    <section id="mes-apprenants" aria-labelledby="mes-apprenants-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader
        title={<span id="mes-apprenants-title">{t("title")}</span>}
        description={t("description")}
      />

      {loading ? (
        <DashboardCard>
          <div style={{ fontSize: 13, color: "var(--yema-text-muted)" }}>…</div>
        </DashboardCard>
      ) : learners.length === 0 ? (
        <DashboardCard>
          <DashboardEmptyState title={t("empty")} />
        </DashboardCard>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }} data-testid="coach-learners-list">
          {learners.map((child) => {
            const hasDisplayName = typeof child.displayName === "string" && child.displayName.trim().length > 0;
            return (
              <li key={child.id} data-testid="coach-learner-card" data-circle-language={child.circleLanguage ?? ""}>
                <DashboardCard>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "var(--yema-gold-glow)",
                        border: "1px solid var(--yema-gold-edge)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--yema-gold-light)",
                        fontFamily: "var(--yema-font-mono)",
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {hasDisplayName ? child.displayName.charAt(0).toUpperCase() : "•"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--yema-text)" }}>
                        {hasDisplayName ? child.displayName : t("unavailable")}
                      </div>
                      <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {child.ageBand && child.ageBand !== "unknown" ? (
                          <DashboardStatusChip tone="muted">
                            {t("ageBand", { band: child.ageBand })}
                          </DashboardStatusChip>
                        ) : null}
                        {child.circleLanguage ? (
                          <DashboardStatusChip tone="gold">
                            {t("circleLanguageLabel", { language: child.circleLanguage })}
                          </DashboardStatusChip>
                        ) : null}
                      </div>
                    </div>
                    <Link
                      href={`${baseHref}/profiles/${child.id}`}
                      style={{
                        fontSize: 12,
                        color: "var(--yema-gold-light)",
                        textDecoration: "none",
                        padding: "8px 14px",
                        borderRadius: "var(--yema-r-pill)",
                        border: "1px solid var(--yema-gold-edge)",
                        minHeight: 36,
                        display: "inline-flex",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {t("openProfile")}
                    </Link>
                  </div>
                </DashboardCard>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
