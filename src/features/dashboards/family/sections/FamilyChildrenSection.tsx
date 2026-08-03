"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/features/dashboards/shared";
import type { FamilyChildRow, FamilyDashboardResponse } from "../types";
import { FamilyMondeChildCard } from "@/features/dashboards/monde-context";
import { FamilyChildActions, type FamilyChildActionsCopy } from "../FamilyChildActions";
import type { AvatarAnimal } from "@/components/famille/AnimalAvatar";

type Props = {
  data: FamilyDashboardResponse;
  baseHref: string;
  locale: "fr" | "en";
  actionsCopy: FamilyChildActionsCopy;
};

// Ma famille · brief §6 : cartes enfant avec prénom (jamais d'ID brut),
// univers dérivé de la langue active, statut PIN, action ouvrir. CTA
// « ajouter un enfant » uniquement si canAddChild.
export function FamilyChildrenSection({ data, locale, actionsCopy }: Props) {
  const t = useTranslations("yemaDashboards.family.children");

  const totalSeats = data.seats.reduce((n, s) => n + s.seatsTotal, 0);
  const seatsUsed = data.totalChildrenLinked;

  return (
    <section id="mes-enfants" aria-labelledby="mes-enfants-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader
        title={<span id="mes-enfants-title">{t("title")}</span>}
        description={t("description")}
        actions={
          totalSeats > 0 ? (
            <DashboardStatusChip tone="muted">
              {t("seatsUsed", { used: seatsUsed, total: totalSeats })}
            </DashboardStatusChip>
          ) : undefined
        }
      />

      {data.children.length === 0 ? (
        <DashboardCard>
          <DashboardEmptyState
            title={t("empty")}
            action={
              data.canAddChild ? (
                <FamilyChildActions locale={locale} copy={actionsCopy} canAddChild={true} slot="add" />
              ) : (
                <DashboardStatusChip tone="alert">{t("noSeat")}</DashboardStatusChip>
              )
            }
          />
        </DashboardCard>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {data.children.map((c) => (
            <li key={c.id} data-testid="family-child-card">
              <ChildCard
                child={c}
                pinYes={t("hasPinYes")}
                pinNo={t("hasPinNo")}
                actionsSlot={
                  <FamilyChildActions
                    locale={locale}
                    copy={actionsCopy}
                    canAddChild={data.canAddChild}
                    slot="child"
                    child={{ id: c.id, prenom: c.prenom, avatarAnimal: c.avatarAnimal as AvatarAnimal }}
                  />
                }
              />
            </li>
          ))}
          {data.canAddChild ? (
            <li>
              <DashboardCard tone="surface-2">
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <FamilyChildActions locale={locale} copy={actionsCopy} canAddChild={true} slot="add" />
                </div>
              </DashboardCard>
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}

function ChildCard({
  child,
  pinYes,
  pinNo,
  actionsSlot,
}: {
  child: FamilyChildRow;
  pinYes: string;
  pinNo: string;
  actionsSlot: React.ReactNode;
}) {
  return (
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
          {child.prenom.charAt(0).toUpperCase()}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--yema-text)" }}>{child.prenom}</div>
          <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {child.activeLangue ? (
              <DashboardStatusChip tone="gold">{child.activeLangue}</DashboardStatusChip>
            ) : null}
            <DashboardStatusChip tone={child.hasPin ? "success" : "muted"}>
              {child.hasPin ? pinYes : pinNo}
            </DashboardStatusChip>
          </div>
        </div>
        {actionsSlot}
      </div>
      {/* Lot 7B · contexte Monde Ivoire · UNIQUEMENT quand universe est
          explicitement MONDE. universe null / RACINES · aucun ivory
          n'apparaît (fail-closed, Racines existant intact).
          Lot 7B.1 · learningGoal enfant est désormais projeté depuis
          ChildProfile.learningGoal · resolveMondePath fait le mapping ou
          retourne null (état "Objectif à préciser" honnête). */}
      {child.universe === "MONDE" ? (
        <FamilyMondeChildCard
          child={{
            id: child.id,
            prenom: child.prenom,
            avatarAnimal: child.avatarAnimal,
            learningGoal: child.learningGoal ?? null,
            level: null,
            progressPct: null,
            minutesThisWeek: null,
          }}
        />
      ) : null}
    </DashboardCard>
  );
}
