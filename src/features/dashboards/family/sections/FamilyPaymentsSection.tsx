"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/features/dashboards/shared";
import type { FamilySeatSnapshot } from "../types";

type Props = {
  seats: FamilySeatSnapshot[];
};

// Paiements · Lot 4A : affiche le plan actif dérivé des grants réels
// (aucun faux montant). Factures = placeholder (aucun endpoint Invoice).
export function FamilyPaymentsSection({ seats }: Props) {
  const t = useTranslations("yemaDashboards.family.payments");

  const activePlans = seats.filter((s) => s.productCode !== "FALLBACK_HOUSEHOLD_LEGACY");

  return (
    <section id="paiements" aria-labelledby="paiements-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="paiements-title">{t("title")}</span>} />

      <DashboardCard>
        <h3 style={{ margin: "0 0 12px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>
          {t("planTitle")}
        </h3>
        {activePlans.length === 0 ? (
          <DashboardEmptyState title={t("planEmpty")} />
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
            {activePlans.map((s) => (
              <li
                key={`${s.productCode}-${s.universe}`}
                style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}
              >
                <span style={{ fontSize: 13, color: "var(--yema-text)" }}>
                  {t("planActive", { code: s.productCode })}
                </span>
                <DashboardStatusChip tone="gold">{s.universe}</DashboardStatusChip>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>

      <DashboardCard>
        <h3 style={{ margin: "0 0 12px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>
          {t("invoicesTitle")}
        </h3>
        <DashboardEmptyState title={t("invoicesEmpty")} />
      </DashboardCard>
    </section>
  );
}
