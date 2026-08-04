"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  DashboardButtonLink,
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/features/dashboards/shared";
import type { StatusTone } from "@/features/dashboards/shared/types";
import type { TeacherAssignmentRow } from "../types";

type Props = {
  assignments: TeacherAssignmentRow[];
  loading: boolean;
  loadError: boolean;
  baseHref: string;
};

function formatDate(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function statusTone(s: TeacherAssignmentRow["status"]): StatusTone {
  switch (s) {
    case "PUBLISHED": return "gold";
    case "CLOSED": return "muted";
    case "ARCHIVED": return "muted";
    default: return "neutral";
  }
}

export function TeacherAssignmentsSection({ assignments, loading, loadError, baseHref }: Props) {
  const t = useTranslations("yemaDashboards.teacher.assignments");
  const locale = useLocale();

  return (
    <section id="devoirs" aria-labelledby="devoirs-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader
        title={<span id="devoirs-title">{t("title")}</span>}
        description={t("description")}
        actions={
          <DashboardButtonLink variant="secondary" size="sm" href={`${baseHref}/assignments/new`}>
            {t("newAssignment")}
          </DashboardButtonLink>
        }
      />

      {loading ? (
        <DashboardCard>
          <div style={{ fontSize: 13, color: "var(--yema-text-muted)" }}>…</div>
        </DashboardCard>
      ) : loadError ? (
        <DashboardCard>
          <DashboardEmptyState title={t("loadFailed")} />
        </DashboardCard>
      ) : assignments.length === 0 ? (
        <DashboardCard>
          <DashboardEmptyState title={t("empty")} />
        </DashboardCard>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {assignments.map((a) => {
            const due = formatDate(a.dueDate, locale);
            const label =
              a.status === "DRAFT" ? t("status.draft") :
              a.status === "PUBLISHED" ? t("status.published") :
              a.status === "CLOSED" ? t("status.closed") :
              t("status.archived");
            return (
              <li key={a.id}>
                <DashboardCard>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--yema-text)" }}>
                        {a.title}
                      </div>
                      <div className="yema-mono" style={{ fontSize: 11, color: "var(--yema-text-muted)", marginTop: 4 }}>
                        {due ? t("due", { date: due }) : t("noDue")}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
                      <DashboardStatusChip tone={statusTone(a.status)}>{label}</DashboardStatusChip>
                      <Link
                        href={`${baseHref}/assignments/${a.id}`}
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
                        {t("openAssignment")}
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
