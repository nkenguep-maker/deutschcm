"use client";

// CenterDashboard · Lot 4B · réutilise strictement les APIs /api/center/*.
// Aucune fausse métrique, aucune fausse facturation, aucun ID technique
// rendu. Isolation par centerId côté resolver serveur existant.

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardHeader,
  DashboardMetric,
  DashboardMobileHeader,
  DashboardPageBoundary,
  DashboardSectionHeader,
  DashboardShell,
  DashboardSidebar,
  DashboardSkeleton,
  DashboardStatusChip,
  DashboardTabBar,
} from "@/features/dashboards/shared";
import { buildCenterNav, buildCenterMobileTabs } from "./nav";
import type {
  CenterClassRow,
  CenterDashboardResponse,
  CenterStudentRow,
  CenterTeacherRow,
} from "./types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | {
      kind: "ready";
      data: CenterDashboardResponse;
      students: CenterStudentRow[];
      teachers: CenterTeacherRow[];
      classes: CenterClassRow[];
      partialErrors: { students: boolean; teachers: boolean; classes: boolean };
    };

async function safeItems<T>(url: string): Promise<{ items: T[]; error: boolean }> {
  try {
    const raw = await fetchJson<{ items?: T[] }>(url);
    return { items: raw.items ?? [], error: false };
  } catch {
    return { items: [], error: true };
  }
}

export function CenterDashboard({ locale }: { locale: "fr" | "en" }) {
  const t = useTranslations("yemaDashboards.center");
  const tCommon = useTranslations("yemaDashboards.common");
  const currentLocale = useLocale();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const baseHref = `/${currentLocale ?? locale}/center`;

  const load = () => {
    setState({ kind: "loading" });
    Promise.all([
      fetchJson<CenterDashboardResponse>("/api/center/dashboard"),
      safeItems<CenterStudentRow>("/api/center/students?pageSize=25"),
      safeItems<CenterTeacherRow>("/api/center/teachers?pageSize=25"),
      safeItems<CenterClassRow>("/api/center/classes?pageSize=25"),
    ])
      .then(([data, s, tRes, c]) =>
        setState({
          kind: "ready",
          data,
          students: s.items,
          teachers: tRes.items,
          classes: c.items,
          partialErrors: { students: s.error, teachers: tRes.error, classes: c.error },
        }),
      )
      .catch(() => setState({ kind: "error" }));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const personaLabel = t("personaLabel");
  const personaSubtitle = t("personaSubtitle");

  const navGroups = buildCenterNav(
    {
      overview: t("nav.overview"),
      students: t("nav.students"),
      teachers: t("nav.teachers"),
      classes: t("nav.classes"),
      billing: t("nav.billing"),
      messages: t("nav.messages"),
      settings: t("nav.settings"),
      sectionLabel: t("sidebarSection"),
    },
    baseHref,
  );

  const mobileTabs = buildCenterMobileTabs(
    {
      overview: t("mobileNav.overview"),
      students: t("mobileNav.students"),
      classes: t("mobileNav.classes"),
      billing: t("mobileNav.billing"),
      messages: t("mobileNav.messages"),
    },
    baseHref,
  );

  const sidebar = (
    <DashboardSidebar
      groups={navGroups}
      activeHref={baseHref}
      personaLabel={personaLabel}
      personaSubtitle={personaSubtitle}
      brandHref={`/${currentLocale ?? locale}`}
      previewBadge={tCommon("previewBadge")}
    />
  );

  const mobileHeader = (
    <DashboardMobileHeader
      personaLabel={personaLabel}
      personaSubtitle={personaSubtitle}
      brandHref={`/${currentLocale ?? locale}`}
    />
  );

  const tabBar = <DashboardTabBar tabs={mobileTabs} activeKey="overview" />;

  if (state.kind === "loading") {
    return (
      <DashboardPageBoundary>
        <DashboardShell
          sidebar={sidebar}
          mobileHeader={mobileHeader}
          tabBar={tabBar}
          header={<DashboardHeader title={personaLabel} subtitle={t("loading")} />}
        >
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              <DashboardSkeleton height={110} rounded={18} />
              <DashboardSkeleton height={110} rounded={18} />
              <DashboardSkeleton height={110} rounded={18} />
              <DashboardSkeleton height={110} rounded={18} />
            </div>
            <DashboardSkeleton height={220} rounded={18} />
          </div>
        </DashboardShell>
      </DashboardPageBoundary>
    );
  }

  if (state.kind === "error") {
    return (
      <DashboardPageBoundary>
        <DashboardShell
          sidebar={sidebar}
          mobileHeader={mobileHeader}
          tabBar={tabBar}
          header={<DashboardHeader title={personaLabel} />}
        >
          <DashboardErrorState
            title={t("error")}
            action={
              <button
                type="button"
                onClick={load}
                style={{
                  marginTop: 8,
                  padding: "10px 18px",
                  minHeight: 40,
                  borderRadius: "var(--yema-r-pill)",
                  background: "transparent",
                  border: "1px solid var(--yema-gold-edge)",
                  color: "var(--yema-gold-light)",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("retry")}
              </button>
            }
          />
        </DashboardShell>
      </DashboardPageBoundary>
    );
  }

  const { data, students, teachers, classes, partialErrors } = state;
  const centerName = data.center?.name ?? null;
  const meta = centerName ? t("meta", { name: centerName }) : t("metaMinimal");
  const stats = data.stats;
  const anyKpi = stats.classroomCount + stats.studentCount + stats.teacherCount + stats.pendingEnrollmentCount > 0;

  return (
    <DashboardPageBoundary>
      <DashboardShell
        sidebar={sidebar}
        mobileHeader={mobileHeader}
        tabBar={tabBar}
        header={<DashboardHeader title={personaLabel} subtitle={meta} />}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <section id="vue" aria-labelledby="vue-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader title={<span id="vue-title">{t("overview.title")}</span>} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              <DashboardMetric label={t("overview.kpisStudents")} value={stats.studentCount} />
              <DashboardMetric label={t("overview.kpisTeachers")} value={stats.teacherCount} />
              <DashboardMetric label={t("overview.kpisClassrooms")} value={stats.classroomCount} />
              <DashboardMetric label={t("overview.kpisPending")} value={stats.pendingEnrollmentCount} />
            </div>
            {!anyKpi ? (
              <DashboardCard>
                <div style={{ fontSize: 13, color: "var(--yema-text-muted)" }}>{t("overview.kpisEmptyHelp")}</div>
              </DashboardCard>
            ) : null}
          </section>

          <section id="eleves" aria-labelledby="eleves-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader
              title={<span id="eleves-title">{t("students.title")}</span>}
              description={t("students.description")}
            />
            {partialErrors.students ? (
              <DashboardCard><DashboardEmptyState title={t("students.loadFailed")} /></DashboardCard>
            ) : students.length === 0 ? (
              <DashboardCard><DashboardEmptyState title={t("students.empty")} /></DashboardCard>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                {students.map((s) => {
                  const displayName = s.fullName?.trim() || t("students.empty");
                  return (
                    <li key={s.id}>
                      <DashboardCard>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--yema-text)" }}>{displayName}</div>
                            {s.level ? (
                              <div style={{ marginTop: 4 }}>
                                <DashboardStatusChip tone="muted">{t("students.levelLabel", { level: s.level })}</DashboardStatusChip>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </DashboardCard>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section id="enseignants" aria-labelledby="enseignants-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader
              title={<span id="enseignants-title">{t("teachers.title")}</span>}
              description={t("teachers.description")}
            />
            {partialErrors.teachers ? (
              <DashboardCard><DashboardEmptyState title={t("teachers.loadFailed")} /></DashboardCard>
            ) : teachers.length === 0 ? (
              <DashboardCard><DashboardEmptyState title={t("teachers.empty")} /></DashboardCard>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                {teachers.map((tt) => (
                  <li key={tt.id}>
                    <DashboardCard>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--yema-text)" }}>
                        {tt.fullName?.trim() || t("teachers.empty")}
                      </div>
                    </DashboardCard>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="classes" aria-labelledby="classes-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader
              title={<span id="classes-title">{t("classes.title")}</span>}
              description={t("classes.description")}
            />
            {partialErrors.classes ? (
              <DashboardCard><DashboardEmptyState title={t("classes.loadFailed")} /></DashboardCard>
            ) : classes.length === 0 ? (
              <DashboardCard><DashboardEmptyState title={t("classes.empty")} /></DashboardCard>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                {classes.map((c) => {
                  const hasName = typeof c.name === "string" && c.name.trim().length > 0;
                  const displayName = hasName ? c.name : t("classes.empty");
                  return (
                    <li key={c.id}>
                      <DashboardCard>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--yema-text)" }}>{displayName}</div>
                            <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {c.level ? (
                                <DashboardStatusChip tone="muted">
                                  {t("classes.levelLabel", { level: c.level })}
                                </DashboardStatusChip>
                              ) : null}
                              <DashboardStatusChip tone="neutral">
                                {t("classes.studentsCount", { count: c.activeStudentCount })}
                              </DashboardStatusChip>
                            </div>
                          </div>
                          {hasName ? (
                            <Link
                              href={`${baseHref}/classes/${c.id}`}
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
                              {t("classes.openClass")}
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

          <section id="facturation" aria-labelledby="facturation-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader
              title={<span id="facturation-title">{t("billing.title")}</span>}
              description={t("billing.description")}
            />
            <DashboardCard>
              <DashboardEmptyState title={t("billing.notWired")} description={t("billing.empty")} />
            </DashboardCard>
          </section>

          <section id="messages" aria-labelledby="messages-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader title={<span id="messages-title">{t("messages.title")}</span>} />
            <DashboardCard>
              <DashboardEmptyState title={t("messages.soon")} />
            </DashboardCard>
          </section>

          <section id="parametres" aria-labelledby="parametres-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader
              title={<span id="parametres-title">{t("settings.title")}</span>}
              description={t("settings.description")}
            />
            <DashboardCard>
              <DashboardEmptyState title={t("settings.empty")} />
            </DashboardCard>
          </section>
        </div>
      </DashboardShell>
    </DashboardPageBoundary>
  );
}
