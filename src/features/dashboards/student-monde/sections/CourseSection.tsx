"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardProgress,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/features/dashboards/shared";
import type { MondeAccessStatus, MondeCourseSummary } from "../types";

type Props = {
  courses: MondeCourseSummary[];
  accessStatus: MondeAccessStatus;
};

export function CourseSection({ courses, accessStatus }: Props) {
  const t = useTranslations("yemaDashboards.studentMonde.course");
  const active = accessStatus === "ACTIVE";

  return (
    <section id="mon-cours" aria-labelledby="mon-cours-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader
        title={<span id="mon-cours-title">{t("title")}</span>}
        description={t("description")}
      />
      {courses.length === 0 ? (
        <DashboardCard>
          <DashboardEmptyState title={t("empty")} />
        </DashboardCard>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {courses.map((c) => {
            const locked = c.status === "LOCKED" || !active;
            const statusLbl =
              c.status === "COMPLETED" ? t("status.completed") :
              c.status === "IN_PROGRESS" ? t("status.inProgress") :
              c.status === "OPEN" ? t("status.open") : t("status.locked");
            const pct = c.totalModules === 0 ? 0 : (c.completedModules / c.totalModules) * 100;
            return (
              <li key={c.id}>
                <DashboardCard tone="surface" padded style={{ opacity: locked ? 0.6 : 1 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                        <span className="yema-mono" style={{ fontSize: 12, color: "var(--yema-text-muted)" }}>
                          {String(c.index).padStart(2, "0")}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--yema-text)" }}>{c.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--yema-text-muted)", marginTop: 4 }}>
                        {t("modulesOf", { done: c.completedModules, total: c.totalModules })}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                      <DashboardStatusChip
                        tone={
                          c.status === "COMPLETED" ? "success" :
                          c.status === "IN_PROGRESS" ? "gold" :
                          c.status === "OPEN" ? "neutral" : "muted"
                        }
                      >
                        {statusLbl}
                      </DashboardStatusChip>
                      {!locked && c.moduleIds[0] ? (
                        <Link
                          href={`/courses/${c.id}/modules/${c.moduleIds[0]}`}
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
                          {t("seeLesson")}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  {c.completedModules > 0 ? (
                    <div style={{ marginTop: 12 }}>
                      <DashboardProgress value={pct} ariaLabel={c.label} />
                    </div>
                  ) : null}
                </DashboardCard>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
