"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardProgress,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/features/dashboards/shared";
import { OFFICIAL_A1_COURSE_ID } from "../courseRoutes";
import type { MondeAccessStatus, MondeCourseSummary } from "../types";

type Props = {
  courses: MondeCourseSummary[];
  accessStatus: MondeAccessStatus;
};

export function CourseSection({ courses, accessStatus }: Props) {
  const t = useTranslations("yemaDashboards.studentMonde.course");
  const locale = useLocale();
  const active = accessStatus === "ACTIVE";
  const description = locale === "en" ? "Six communicative units and 36 lessons to complete German A1." : "Six unités communicatives et 36 leçons pour terminer l’allemand A1.";

  return (
    <section id="mon-cours" aria-labelledby="mon-cours-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader
        title={<span id="mon-cours-title">{t("title")}</span>}
        description={description}
      />
      {courses.length === 0 ? (
        <DashboardCard>
          <DashboardEmptyState title={t("empty")} />
        </DashboardCard>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {courses.map((course) => {
            const locked = course.status === "LOCKED" || !active;
            const statusLabel = locked
              ? t("status.locked")
              : course.status === "COMPLETED"
                ? t("status.completed")
                : course.status === "IN_PROGRESS"
                  ? t("status.inProgress")
                  : t("status.open");
            const statusTone = locked
              ? "muted" as const
              : course.status === "COMPLETED"
                ? "success" as const
                : course.status === "IN_PROGRESS"
                  ? "gold" as const
                  : "neutral" as const;
            const percentage = course.totalModules === 0 ? 0 : (course.completedModules / course.totalModules) * 100;
            return (
              <li key={course.id}>
                <DashboardCard tone="surface" padded style={{ opacity: locked ? 0.6 : 1 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                        <span className="yema-mono" style={{ fontSize: 12, color: "var(--yema-text-muted)" }}>
                          U{course.index}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--yema-text)" }}>{course.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--yema-text-muted)", marginTop: 4 }}>
                        {t("modulesOf", { done: course.completedModules, total: course.totalModules })}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                      <DashboardStatusChip tone={statusTone}>{statusLabel}</DashboardStatusChip>
                      {!locked ? (
                        <Link
                          href={`/${locale}/learn/${OFFICIAL_A1_COURSE_ID}/${course.id}`}
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
                          {course.status === "COMPLETED" ? "Revoir l’unité" : t("seeLesson")}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  {course.completedModules > 0 ? (
                    <div style={{ marginTop: 12 }}>
                      <DashboardProgress value={percentage} ariaLabel={course.label} />
                    </div>
                  ) : null}
                </DashboardCard>
              </li>
            );
          })}
        </ul>
      )}
      {active ? (
        <Link
          href={`/${locale}/learn/${OFFICIAL_A1_COURSE_ID}`}
          style={{ alignSelf: "flex-start", color: "var(--yema-gold-light)", textDecoration: "none", fontWeight: 700, minHeight: 44, display: "inline-flex", alignItems: "center" }}
        >
          {locale === "en" ? "Open the full A1 course →" : "Ouvrir le parcours A1 complet →"}
        </Link>
      ) : null}
    </section>
  );
}
