"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/features/dashboards/shared";
import type { AssignmentsAvailability } from "../types";

type Props = {
  assignments: AssignmentsAvailability;
};

function formatDate(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function AssignmentsSection({ assignments }: Props) {
  const t = useTranslations("yemaDashboards.studentMonde.assignments");
  const locale = useLocale();

  return (
    <section id="mes-devoirs" aria-labelledby="mes-devoirs-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader
        title={<span id="mes-devoirs-title">{t("title")}</span>}
        description={t("description")}
      />
      {assignments.kind === "unavailable" ? (
        <DashboardCard>
          <DashboardEmptyState title={t("unavailable")} />
        </DashboardCard>
      ) : assignments.kind === "error" ? (
        <DashboardCard>
          <DashboardEmptyState title={t("empty")} />
        </DashboardCard>
      ) : assignments.assignments.length === 0 ? (
        <DashboardCard>
          <DashboardEmptyState title={t("empty")} />
        </DashboardCard>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {assignments.assignments.map((a) => {
            const due = formatDate(a.dueDate, locale);
            return (
              <li key={a.id}>
                <DashboardCard>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--yema-text)" }}>{a.title}</div>
                      <div className="yema-mono" style={{ fontSize: 11, color: "var(--yema-text-muted)", marginTop: 4 }}>
                        {due ? t("due", { date: due }) : t("noDue")}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                      <DashboardStatusChip tone={a.status === "PUBLISHED" ? "gold" : "muted"}>
                        {a.status === "PUBLISHED" ? t("status.published") : t("status.closed")}
                      </DashboardStatusChip>
                      <Link
                        href={`/student/assignments/${a.id}`}
                        style={{
                          fontSize: 12,
                          color: "var(--yema-gold-light)",
                          textDecoration: "none",
                          padding: "6px 12px",
                          borderRadius: "var(--yema-r-pill)",
                          border: "1px solid var(--yema-gold-edge)",
                          minHeight: 32,
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        {t("open")}
                      </Link>
                    </div>
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
