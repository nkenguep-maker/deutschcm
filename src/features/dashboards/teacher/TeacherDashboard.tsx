"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardHeader,
  DashboardMobileHeader,
  DashboardPageBoundary,
  DashboardShell,
  DashboardSidebar,
  DashboardSkeleton,
  DashboardStatusChip,
  DashboardTabBar,
} from "@/features/dashboards/shared";
import type { DashboardTab } from "@/features/dashboards/shared";
import { routeSectionNav, routeSectionTabs, sectionPageHref } from "@/features/dashboards/shared/sectionRouting";
import { buildTeacherNav } from "./nav";
import { TeacherOverviewSection } from "./sections/TeacherOverviewSection";
import { TeacherClassesSection } from "./sections/TeacherClassesSection";
import { TeacherAssignmentsSection } from "./sections/TeacherAssignmentsSection";
import { TeacherCorrectionsSection } from "./sections/TeacherCorrectionsSection";
import { TeacherMondeContextSection } from "./sections/TeacherMondeContextSection";
import { TeacherResourcesSection } from "./sections/TeacherResourcesSection";
import { TeacherMessagesSection } from "./sections/TeacherMessagesSection";
import type { TeacherAssignmentRow, TeacherClassRow, TeacherClassesResponse, TeacherDashboardResponse, TeacherStudentRow, TeacherStudentsResponse } from "./types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; data: TeacherDashboardResponse; classes: TeacherClassRow[]; assignments: TeacherAssignmentRow[]; assignmentsError: boolean; students: TeacherStudentRow[]; studentsError: boolean };

type Props = { locale: "fr" | "en"; activeSectionId?: string };
const ALLOWED = new Set(["accueil", "classes", "devoirs", "corrections", "ressources", "messages"]);

export function TeacherDashboard({ locale, activeSectionId = "accueil" }: Props) {
  const t = useTranslations("yemaDashboards.teacher");
  const tRoot = useTranslations("yemaDashboards");
  const currentLocale = useLocale();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const activeSection = ALLOWED.has(activeSectionId) ? activeSectionId : "accueil";
  const baseHref = `/${currentLocale ?? locale}/teacher`;
  const activeHref = sectionPageHref(baseHref, activeSection, "accueil");

  const load = () => {
    setState({ kind: "loading" });
    Promise.all([
      fetchJson<TeacherDashboardResponse>("/api/teacher/dashboard"),
      fetchJson<TeacherClassesResponse>("/api/teacher/classes?pageSize=50"),
      fetchJson<TeacherStudentsResponse>("/api/teacher/students?pageSize=100").then((res) => ({ ok: true as const, res })).catch(() => ({ ok: false as const })),
    ]).then(async ([data, classesResp, studentsResult]) => {
      const results = await Promise.allSettled(classesResp.items.slice(0, 3).map((c) => fetchJson<{ items: TeacherAssignmentRow[] }>(`/api/teacher/classes/${c.id}/assignments`)));
      const assignments: TeacherAssignmentRow[] = [];
      let assignmentsError = false;
      for (const result of results) {
        if (result.status === "fulfilled") assignments.push(...(result.value.items ?? []));
        else assignmentsError = true;
      }
      assignments.sort((a, b) => {
        const order: Record<string, number> = { DRAFT: 0, PUBLISHED: 1, CLOSED: 2, ARCHIVED: 3 };
        return (order[a.status] ?? 9) - (order[b.status] ?? 9) || (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
      });
      setState({ kind: "ready", data, classes: classesResp.items, assignments: assignments.slice(0, 20), assignmentsError, students: studentsResult.ok ? studentsResult.res.items : [], studentsError: !studentsResult.ok });
    }).catch(() => setState({ kind: "error" }));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const navGroups = routeSectionNav(buildTeacherNav({
    overview: t("nav.overview"), classes: t("nav.classes"), assignments: t("nav.assignments"), corrections: t("nav.corrections"), resources: t("nav.resources"), messages: t("nav.messages"), sectionLabel: t("sidebarSection"),
  }, baseHref), baseHref, "accueil");
  const personaLabel = t("personaLabel");
  const personaSubtitle = t("personaSubtitle");
  const sidebar = <DashboardSidebar groups={navGroups} activeHref={activeHref} personaLabel={personaLabel} personaSubtitle={personaSubtitle} brandHref={`/${currentLocale ?? locale}`} previewBadge={tRoot("common.previewBadge")} />;
  const mobileHeader = <DashboardMobileHeader personaLabel={personaLabel} personaSubtitle={personaSubtitle} brandHref={`/${currentLocale ?? locale}`} />;
  const rawTabs: DashboardTab[] = [
    { key: "overview", label: t("mobileNav.overview"), href: baseHref },
    { key: "classes", label: t("mobileNav.classes"), href: `${baseHref}#classes` },
    { key: "corrections", label: t("mobileNav.corrections"), href: `${baseHref}#corrections` },
    { key: "assignments", label: t("mobileNav.assignments"), href: `${baseHref}#devoirs` },
    { key: "messages", label: t("mobileNav.messages"), href: `${baseHref}#messages` },
  ];
  const tabs = routeSectionTabs(rawTabs, baseHref, "accueil");
  const activeTab = ({ accueil: "overview", classes: "classes", corrections: "corrections", devoirs: "assignments", ressources: "overview", messages: "messages" } as Record<string, string>)[activeSection];
  const tabBar = <DashboardTabBar tabs={tabs} activeKey={activeTab} />;
  const shell = (body: React.ReactNode, header: React.ReactNode) => <DashboardPageBoundary><DashboardShell sidebar={sidebar} mobileHeader={mobileHeader} tabBar={tabBar} header={header}>{body}</DashboardShell></DashboardPageBoundary>;

  if (state.kind === "loading") return shell(<div style={{ display: "grid", gap: 16 }}><DashboardSkeleton height={120} rounded={18} /><DashboardSkeleton height={220} rounded={18} /></div>, <DashboardHeader title={personaLabel} subtitle={t("loading")} />);
  if (state.kind === "error") return shell(<DashboardErrorState title={t("error")} action={<button type="button" onClick={load}>{t("retry")}</button>} />, <DashboardHeader title={personaLabel} />);

  const { data, classes, assignments, assignmentsError, students, studentsError } = state;
  const centerName = data.center?.name ?? null;
  const meta = centerName ? t("meta", { center: centerName }) : t("metaWithoutCenter");
  const content: Record<string, React.ReactNode> = {
    accueil: <><TeacherOverviewSection data={data} />{classes.length === 0 && assignments.length === 0 && data.stats.activeStudentCount === 0 ? <DashboardCard><DashboardEmptyState title={t("overview.kpisEmptyHelp")} /></DashboardCard> : null}</>,
    classes: <TeacherClassesSection classes={classes} loading={false} baseHref={baseHref} />,
    devoirs: <TeacherAssignmentsSection assignments={assignments} loading={false} loadError={assignmentsError && assignments.length === 0} baseHref={baseHref} />,
    corrections: <><TeacherCorrectionsSection students={students} loadError={studentsError} /><TeacherMondeContextSection students={students} /></>,
    ressources: <TeacherResourcesSection />,
    messages: <TeacherMessagesSection />,
  };

  return shell(
    <div data-live-persona-section={activeSection} style={{ display: "flex", flexDirection: "column", gap: 32 }}>{content[activeSection]}</div>,
    <DashboardHeader title={personaLabel} subtitle={meta} meta={!data.teacher.isVerified ? <DashboardStatusChip tone="alert">{t("unverifiedBadge")}</DashboardStatusChip> : undefined} />,
  );
}
