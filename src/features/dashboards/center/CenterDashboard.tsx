"use client";

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
import { routeSectionNav, routeSectionTabs, sectionPageHref } from "@/features/dashboards/shared/sectionRouting";
import { MessagesInboxLink } from "@/features/messaging/MessagesInboxLink";
import { buildCenterNav, buildCenterMobileTabs } from "./nav";
import { CenterPendingSection } from "./sections/CenterPendingSection";
import type { CenterClassRow, CenterDashboardResponse, CenterStudentRow, CenterTeacherRow } from "./types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}
async function safeItems<T>(url: string): Promise<{ items: T[]; error: boolean }> {
  try { const raw = await fetchJson<{ items?: T[] }>(url); return { items: raw.items ?? [], error: false }; }
  catch { return { items: [], error: true }; }
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; data: CenterDashboardResponse; students: CenterStudentRow[]; teachers: CenterTeacherRow[]; classes: CenterClassRow[]; partialErrors: { students: boolean; teachers: boolean; classes: boolean } };
type Props = { locale: "fr" | "en"; activeSectionId?: string };
const ALLOWED = new Set(["centre", "a-traiter", "eleves", "enseignants", "classes", "messages", "parametres"]);

export function CenterDashboard({ locale, activeSectionId = "centre" }: Props) {
  const t = useTranslations("yemaDashboards.center");
  const tCommon = useTranslations("yemaDashboards.common");
  const currentLocale = useLocale();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const activeSection = ALLOWED.has(activeSectionId) ? activeSectionId : "centre";
  const baseHref = `/${currentLocale ?? locale}/center`;
  const activeHref = sectionPageHref(baseHref, activeSection, "centre");

  const load = () => {
    setState({ kind: "loading" });
    Promise.all([
      fetchJson<CenterDashboardResponse>("/api/center/dashboard"),
      safeItems<CenterStudentRow>("/api/center/students?pageSize=25"),
      safeItems<CenterTeacherRow>("/api/center/teachers?pageSize=25"),
      safeItems<CenterClassRow>("/api/center/classes?pageSize=25"),
    ]).then(([data, students, teachers, classes]) => setState({ kind: "ready", data, students: students.items, teachers: teachers.items, classes: classes.items, partialErrors: { students: students.error, teachers: teachers.error, classes: classes.error } })).catch(() => setState({ kind: "error" }));
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const personaLabel = t("personaLabel");
  const personaSubtitle = t("personaSubtitle");
  const navGroups = routeSectionNav(buildCenterNav({ overview: t("nav.overview"), students: t("nav.students"), teachers: t("nav.teachers"), classes: t("nav.classes"), messages: t("nav.messages"), settings: t("nav.settings"), sectionLabel: t("sidebarSection") }, baseHref), baseHref, "centre");
  const mobileTabs = routeSectionTabs(buildCenterMobileTabs({ overview: t("mobileNav.overview"), students: t("mobileNav.students"), classes: t("mobileNav.classes"), messages: t("mobileNav.messages") }, baseHref), baseHref, "centre");
  const activeTab = ({ centre: "overview", "a-traiter": "overview", eleves: "students", enseignants: "overview", classes: "classes", messages: "messages", parametres: "overview" } as Record<string, string>)[activeSection];
  const sidebar = <DashboardSidebar groups={navGroups} activeHref={activeHref} personaLabel={personaLabel} personaSubtitle={personaSubtitle} brandHref={`/${currentLocale ?? locale}`} previewBadge={tCommon("previewBadge")} />;
  const mobileHeader = <DashboardMobileHeader personaLabel={personaLabel} personaSubtitle={personaSubtitle} brandHref={`/${currentLocale ?? locale}`} />;
  const tabBar = <DashboardTabBar tabs={mobileTabs} activeKey={activeTab} />;
  const shell = (body: React.ReactNode, header: React.ReactNode) => <DashboardPageBoundary><DashboardShell sidebar={sidebar} mobileHeader={mobileHeader} tabBar={tabBar} header={header}>{body}</DashboardShell></DashboardPageBoundary>;

  if (state.kind === "loading") return shell(<div style={{ display: "grid", gap: 16 }}><DashboardSkeleton height={110} rounded={18} /><DashboardSkeleton height={220} rounded={18} /></div>, <DashboardHeader title={personaLabel} subtitle={t("loading")} />);
  if (state.kind === "error") return shell(<DashboardErrorState title={t("error")} action={<button type="button" onClick={load}>{t("retry")}</button>} />, <DashboardHeader title={personaLabel} />);

  const { data, students, teachers, classes, partialErrors } = state;
  const centerName = data.center?.name ?? null;
  const meta = centerName ? t("meta", { name: centerName }) : t("metaMinimal");
  const stats = data.stats;
  const listSection = (id: string, title: string, description: string, error: boolean, empty: string, rows: React.ReactNode) => (
    <section id={id} aria-labelledby={`${id}-title`} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id={`${id}-title`}>{title}</span>} description={description} />
      {error ? <DashboardCard><DashboardEmptyState title={empty} /></DashboardCard> : rows}
    </section>
  );

  const overview = (
    <section id="centre" aria-labelledby="centre-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="centre-title">{t("overview.title")}</span>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <DashboardMetric label={t("overview.kpisStudents")} value={stats.studentCount} />
        <DashboardMetric label={t("overview.kpisTeachers")} value={stats.teacherCount} />
        <DashboardMetric label={t("overview.kpisClassrooms")} value={stats.classroomCount} />
        <DashboardMetric label={t("overview.kpisPending")} value={stats.pendingEnrollmentCount} />
      </div>
    </section>
  );
  const studentRows = students.length === 0 ? <DashboardCard><DashboardEmptyState title={t("students.empty")} /></DashboardCard> : <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>{students.map((student) => <li key={student.id}><DashboardCard><div style={{ fontWeight: 600 }}>{student.fullName?.trim() || t("students.empty")}</div>{student.level ? <div style={{ marginTop: 5 }}><DashboardStatusChip tone="muted">{t("students.levelLabel", { level: student.level })}</DashboardStatusChip></div> : null}</DashboardCard></li>)}</ul>;
  const teacherRows = teachers.length === 0 ? <DashboardCard><DashboardEmptyState title={t("teachers.empty")} /></DashboardCard> : <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>{teachers.map((teacher) => <li key={teacher.id}><DashboardCard><div style={{ fontWeight: 600 }}>{teacher.fullName?.trim() || t("teachers.empty")}</div></DashboardCard></li>)}</ul>;
  const classRows = classes.length === 0 ? <DashboardCard><DashboardEmptyState title={t("classes.empty")} /></DashboardCard> : <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>{classes.map((item) => <li key={item.id}><DashboardCard><div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}><div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{item.name?.trim() || t("classes.empty")}</div><div style={{ marginTop: 5, display: "flex", gap: 6 }}>{item.level ? <DashboardStatusChip tone="muted">{t("classes.levelLabel", { level: item.level })}</DashboardStatusChip> : null}<DashboardStatusChip tone="neutral">{t("classes.studentsCount", { count: item.activeStudentCount })}</DashboardStatusChip></div></div>{item.name?.trim() ? <Link href={`${baseHref}/classes/${item.id}`} style={{ color: "var(--yema-gold-light)", textDecoration: "none" }}>{t("classes.openClass")}</Link> : null}</div></DashboardCard></li>)}</ul>;
  const messages = <section id="messages" aria-labelledby="center-messages-title" style={{ display: "grid", gap: 12 }}><DashboardSectionHeader title={<span id="center-messages-title">{t("messages.title")}</span>} /><DashboardCard><MessagesInboxLink /></DashboardCard></section>;
  const settings = (
    <section id="parametres" aria-labelledby="center-settings-title" style={{ display: "grid", gap: 12 }}>
      <DashboardSectionHeader title={<span id="center-settings-title">{t("settings.title")}</span>} description={t("settings.description")} />
      <DashboardCard>
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.72 }}>{locale === "en" ? "Center" : "Centre"}</div>
            <div style={{ marginTop: 4, fontWeight: 650 }}>{centerName ?? t("metaMinimal")}</div>
            {data.center?.city ? <div style={{ marginTop: 4, opacity: 0.78 }}>{data.center.city}</div> : null}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <DashboardStatusChip tone="neutral">{t("overview.kpisTeachers")}: {stats.teacherCount}</DashboardStatusChip>
            <DashboardStatusChip tone="neutral">{t("overview.kpisStudents")}: {stats.studentCount}</DashboardStatusChip>
            <DashboardStatusChip tone="neutral">{t("overview.kpisClassrooms")}: {stats.classroomCount}</DashboardStatusChip>
          </div>
        </div>
      </DashboardCard>
    </section>
  );
  const content: Record<string, React.ReactNode> = {
    centre: overview,
    "a-traiter": <CenterPendingSection baseHref={baseHref} locale={locale} />,
    eleves: listSection("eleves", t("students.title"), t("students.description"), partialErrors.students, t("students.loadFailed"), studentRows),
    enseignants: listSection("enseignants", t("teachers.title"), t("teachers.description"), partialErrors.teachers, t("teachers.loadFailed"), teacherRows),
    classes: listSection("classes", t("classes.title"), t("classes.description"), partialErrors.classes, t("classes.loadFailed"), classRows),
    messages,
    parametres: settings,
  };

  return shell(<div data-live-persona-section={activeSection}>{content[activeSection]}</div>, <DashboardHeader title={personaLabel} subtitle={meta} />);
}
