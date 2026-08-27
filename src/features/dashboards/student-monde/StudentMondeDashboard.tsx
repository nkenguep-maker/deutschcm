"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DashboardShell,
  DashboardSidebar,
  DashboardHeader,
  DashboardMobileHeader,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardPageBoundary,
  DashboardCard,
  DashboardSkeleton,
  DashboardStatusChip,
  DashboardTabBar,
} from "@/features/dashboards/shared";
import type { DashboardTab } from "@/features/dashboards/shared";
import { routeSectionNav, routeSectionTabs, sectionPageHref } from "@/features/dashboards/shared/sectionRouting";
import { buildMondeNav } from "./nav";
import { MondeIvoryOverview } from "./ivory/MondeIvoryOverview";
import { CourseSection } from "./sections/CourseSection";
import { AssignmentsSection } from "./sections/AssignmentsSection";
import { ClassSection } from "./sections/ClassSection";
import { MessagesPlaceholderSection } from "./sections/MessagesPlaceholderSection";
import { mondeCourseHref, mondeLessonHref } from "./courseRoutes";
import type { AssignmentsAvailability, MondeDashboardData, MondeStudentAssignment } from "./types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

async function loadDashboard(): Promise<MondeDashboardData> {
  return fetchJson<MondeDashboardData>("/api/me/monde-dashboard");
}

async function loadAssignments(): Promise<AssignmentsAvailability> {
  try {
    const raw = await fetchJson<{ assignments?: MondeStudentAssignment[] }>("/api/student/assignments");
    return { kind: "available", assignments: raw.assignments ?? [] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("404") || msg.includes("403")) return { kind: "unavailable" };
    return { kind: "error" };
  }
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; data: MondeDashboardData; assignments: AssignmentsAvailability };

type Props = { locale: "fr" | "en"; activeSectionId?: string };

const ALLOWED = new Set(["accueil", "objectif", "progression", "mon-cours", "mes-devoirs", "mon-parcours", "ma-classe", "messages"]);

export function StudentMondeDashboard({ locale, activeSectionId = "accueil" }: Props) {
  const t = useTranslations("yemaDashboards");
  const tCommon = useTranslations("yemaDashboards.common");
  const currentLocale = useLocale();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const activeSection = ALLOWED.has(activeSectionId) ? activeSectionId : "accueil";
  const dashboardHref = `/${currentLocale ?? locale}/dashboard`;
  const activeHref = sectionPageHref(dashboardHref, activeSection, "accueil");

  const load = () => {
    setState({ kind: "loading" });
    Promise.all([loadDashboard(), loadAssignments()])
      .then(([data, assignments]) => setState({ kind: "ready", data, assignments }))
      .catch(() => setState({ kind: "error" }));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const navGroups = routeSectionNav(buildMondeNav(
    {
      overview: t("studentMonde.nav.overview"),
      course: t("studentMonde.nav.course"),
      assignments: t("studentMonde.nav.assignments"),
      journey: t("studentMonde.nav.journey"),
      classSection: t("studentMonde.nav.class"),
      messages: t("studentMonde.nav.messages"),
      sectionLabel: t("studentMonde.sidebarSection"),
    },
    dashboardHref,
  ), dashboardHref, "accueil");

  const personaLabel = t("studentMonde.personaLabel");
  const personaSubtitle = t("studentMonde.personaSubtitle");
  const sidebar = (
    <DashboardSidebar groups={navGroups} activeHref={activeHref} personaLabel={personaLabel} personaSubtitle={personaSubtitle} brandHref={`/${currentLocale ?? locale}`} previewBadge={tCommon("previewBadge")} />
  );
  const mobileHeader = <DashboardMobileHeader personaLabel={personaLabel} personaSubtitle={personaSubtitle} brandHref={`/${currentLocale ?? locale}`} />;

  const openAssignmentsCount = state.kind === "ready" && state.assignments.kind === "available"
    ? state.assignments.assignments.filter((a) => a.status === "PUBLISHED").length
    : null;
  const rawTabs: DashboardTab[] = [
    { key: "overview", label: t("studentMonde.mobileNav.overview"), href: dashboardHref },
    { key: "course", label: t("studentMonde.mobileNav.course"), href: `${dashboardHref}#mon-cours` },
    { key: "assignments", label: t("studentMonde.mobileNav.assignments"), href: `${dashboardHref}#mes-devoirs`, badgeCount: openAssignmentsCount ?? null },
    { key: "journey", label: t("studentMonde.mobileNav.journey"), href: `${dashboardHref}#mon-parcours` },
    { key: "messages", label: t("studentMonde.mobileNav.messages"), href: `${dashboardHref}#messages` },
  ];
  const mobileTabs = routeSectionTabs(rawTabs, dashboardHref, "accueil");
  const activeTab = ({ accueil: "overview", objectif: "overview", progression: "overview", "mon-cours": "course", "mes-devoirs": "assignments", "mon-parcours": "journey", "ma-classe": "overview", messages: "messages" } as Record<string, string>)[activeSection];
  const tabBar = <DashboardTabBar tabs={mobileTabs} activeKey={activeTab} />;

  const shell = (body: React.ReactNode, header: React.ReactNode) => (
    <DashboardPageBoundary>
      <DashboardShell sidebar={sidebar} mobileHeader={mobileHeader} tabBar={tabBar} header={header}>{body}</DashboardShell>
    </DashboardPageBoundary>
  );

  if (state.kind === "loading") {
    return shell(
      <div style={{ display: "grid", gap: 16 }}><DashboardSkeleton height={140} rounded={18} /><DashboardSkeleton height={280} rounded={18} /></div>,
      <DashboardHeader title={personaLabel} subtitle={tCommon("loading")} />,
    );
  }
  if (state.kind === "error") {
    return shell(
      <DashboardErrorState title={tCommon("error")} action={<button type="button" onClick={load}>{tCommon("retry")}</button>} />,
      <DashboardHeader title={personaLabel} />,
    );
  }

  const { data, assignments } = state;
  if (!data.hasLearningPath) {
    return shell(<DashboardCard><DashboardEmptyState title={t("studentMonde.overview.nextAssignmentsEmpty")} /></DashboardCard>, <DashboardHeader title={personaLabel} />);
  }

  const greeting = data.greetingName?.split(" ")[0] ?? t("studentMonde.greetingFallback");
  const meta = data.learningPath?.currentLevel ? t("studentMonde.metaLanguageLevel", { level: data.learningPath.currentLevel }) : t("studentMonde.metaLanguageLevelUnknown");
  const accessLabel = data.access.source === "TECHNICAL_BETA"
    ? (currentLocale === "en" ? "Technical beta · A1" : "Bêta technique · A1")
    : data.access.status === "ACTIVE"
      ? t("studentMonde.access.active")
      : data.access.status === "EXPIRED"
        ? t("studentMonde.access.expired")
        : (currentLocale === "en" ? "Course not open yet" : "Cours pas encore ouvert");
  const accessTone = data.access.status === "ACTIVE" ? "success" as const : data.access.status === "EXPIRED" ? "alert" as const : "muted" as const;
  const courseHref = data.nextModule
    ? mondeLessonHref(currentLocale ?? locale, data.nextModule)
    : mondeCourseHref(currentLocale ?? locale);

  // Lot 7A.2: completed is an explicit état pédagogique; an expired
  // entitlement alone must never mark a learner's path as completed.
  const overview = (
    <MondeIvoryOverview
      input={{ learningGoal: data.onboarding?.learningGoal ?? null, targetCity: data.onboarding?.targetCity ?? null, targetDate: null, progressPct: data.overallPct ?? 0, completed: false, level: data.learningPath?.currentLevel ?? null }}
      resumeHref={courseHref}
    />
  );
  const content: Record<string, React.ReactNode> = {
    accueil: overview,
    objectif: overview,
    progression: overview,
    "mon-parcours": overview,
    "mes-devoirs": <AssignmentsSection assignments={assignments} />,
    "mon-cours": <CourseSection courses={data.courses} accessStatus={data.access.status} />,
    "ma-classe": <ClassSection />,
    messages: <MessagesPlaceholderSection />,
  };

  return shell(
    <div data-live-persona-section={activeSection}>{content[activeSection]}</div>,
    <DashboardHeader title={greeting} subtitle={meta} meta={<DashboardStatusChip tone={accessTone}>{accessLabel}</DashboardStatusChip>} />,
  );
}
