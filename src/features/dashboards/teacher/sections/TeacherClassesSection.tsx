"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/features/dashboards/shared";
import type { TeacherClassRow } from "../types";

type Props = {
  classes: TeacherClassRow[];
  loading: boolean;
  baseHref: string;
};

export function TeacherClassesSection({ classes, loading, baseHref }: Props) {
  const t = useTranslations("yemaDashboards.teacher.classes");

  return (
    <section id="mes-classes" aria-labelledby="mes-classes-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader
        title={<span id="mes-classes-title">{t("title")}</span>}
        description={t("description")}
      />

      {loading ? (
        <DashboardCard>
          <div style={{ fontSize: 13, color: "var(--yema-text-muted)" }}>…</div>
        </DashboardCard>
      ) : classes.length === 0 ? (
        <DashboardCard>
          <DashboardEmptyState title={t("empty")} />
        </DashboardCard>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {classes.map((c) => {
            // Nom manquant → état neutre localisé, JAMAIS d'UUID rendu.
            const hasName = typeof c.name === "string" && c.name.trim().length > 0;
            return (
              <li key={c.id}>
                <DashboardCard>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--yema-text)" }}>
                        {hasName ? c.name : t("notAvailable")}
                      </div>
                      {hasName ? (
                        <div style={{ marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {c.level ? (
                            <DashboardStatusChip tone="muted">
                              {t("levelLabel", { level: c.level })}
                            </DashboardStatusChip>
                          ) : null}
                          <DashboardStatusChip tone="neutral">
                            {t("studentsCount", { count: c.activeStudentCount })}
                          </DashboardStatusChip>
                        </div>
                      ) : null}
                    </div>
                    {hasName ? (
                      <Link
                        href={`${baseHref}/classroom/${c.id}`}
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
                        {t("openClass")}
                      </Link>
                    ) : null}
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
