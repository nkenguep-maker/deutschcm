"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";
import type { FamilyChildRow } from "../types";

type Props = {
  profiles: FamilyChildRow[];
};

// Progression · Lot 4A : aucun endpoint d'agrégation progression enfant
// n'est exposé pour l'univers Family. On liste les enfants réels avec un
// état neutre par enfant, aucun chiffre inventé.
export function FamilyProgressionSection({ profiles }: Props) {
  const t = useTranslations("yemaDashboards.family.progression");

  return (
    <section id="progression" aria-labelledby="progression-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader
        title={<span id="progression-title">{t("title")}</span>}
        description={t("description")}
      />
      {profiles.length === 0 ? (
        <DashboardCard>
          <DashboardEmptyState title={t("empty")} />
        </DashboardCard>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {profiles.map((c) => (
            <li key={c.id}>
              <DashboardCard>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--yema-text)" }}>{c.prenom}</span>
                  <span style={{ fontSize: 12, color: "var(--yema-text-muted)" }}>{t("notAvailableYet")}</span>
                </div>
              </DashboardCard>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
