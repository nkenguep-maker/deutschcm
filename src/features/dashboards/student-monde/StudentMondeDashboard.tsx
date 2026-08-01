"use client";

// StudentMondeDashboard · Lot 2 P4.6.
// Réutilise strictement les APIs existantes (/api/me/monde-dashboard et
// /api/student/assignments) — aucun resolver dupliqué. Rendu client comme
// l'ancien composant, mais wrap dans le shell YEMA (data-yema-shell) qui
// applique la palette sombre/or scopée.

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
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
import { buildMondeNav } from "./nav";
import { OverviewSection } from "./sections/OverviewSection";
import { MondeIvoryOverview } from "./ivory/MondeIvoryOverview";
import { CourseSection } from "./sections/CourseSection";
import { AssignmentsSection } from "./sections/AssignmentsSection";
import { JourneySection } from "./sections/JourneySection";
import { ClassSection } from "./sections/ClassSection";
import { MessagesPlaceholderSection } from "./sections/MessagesPlaceholderSection";
import type {
  AssignmentsAvailability,
  MondeDashboardData,
  MondeStudentAssignment,
} from "./types";

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
    const raw = await fetchJson<{ assignments?: MondeStudentAssignment[] }>(
      "/api/student/assignments",
    );
    return { kind: "available", assignments: raw.assignments ?? [] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // API renvoie 404/403 lorsque flag ASSIGNMENTS_ENABLED off ou pas de role
    if (msg.includes("404") || msg.includes("403")) return { kind: "unavailable" };
    return { kind: "error" };
  }
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; data: MondeDashboardData; assignments: AssignmentsAvailability };

export function StudentMondeDashboard({ locale }: { locale: "fr" | "en" }) {
  const t = useTranslations("yemaDashboards");
  const tCommon = useTranslations("yemaDashboards.common");
  const currentLocale = useLocale();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const dashboardHref = `/${currentLocale ?? locale}/dashboard`;

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

  const navGroups = buildMondeNav(
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
  );

  const personaLabel = t("studentMonde.personaLabel");
  const personaSubtitle = t("studentMonde.personaSubtitle");

  const sidebar = (
    <DashboardSidebar
      groups={navGroups}
      activeHref={dashboardHref}
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

  // Onglets mobile PDF §3 : Accueil · Cours · Devoirs · Parcours · Messages.
  // Compteur Devoirs uniquement si assignments réels non-clos.
  const openAssignmentsCount =
    state.kind === "ready" && state.assignments.kind === "available"
      ? state.assignments.assignments.filter((a) => a.status === "PUBLISHED").length
      : null;
  const mobileTabs: DashboardTab[] = [
    { key: "overview", label: t("studentMonde.mobileNav.overview"), href: dashboardHref },
    { key: "course", label: t("studentMonde.mobileNav.course"), href: `${dashboardHref}#mon-cours` },
    { key: "assignments", label: t("studentMonde.mobileNav.assignments"), href: `${dashboardHref}#mes-devoirs`, badgeCount: openAssignmentsCount ?? null },
    { key: "journey", label: t("studentMonde.mobileNav.journey"), href: `${dashboardHref}#mon-parcours` },
    { key: "messages", label: t("studentMonde.mobileNav.messages"), href: `${dashboardHref}#messages` },
  ];
  const tabBar = <DashboardTabBar tabs={mobileTabs} activeKey="overview" />;

  if (state.kind === "loading") {
    return (
      <DashboardPageBoundary>
        <DashboardShell
          sidebar={sidebar}
          mobileHeader={mobileHeader}
          tabBar={tabBar}
          header={<DashboardHeader title={personaLabel} subtitle={tCommon("loading")} />}
        >
          <div style={{ display: "grid", gap: 16 }}>
            <DashboardSkeleton height={140} rounded={18} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              <DashboardSkeleton height={140} rounded={18} />
              <DashboardSkeleton height={140} rounded={18} />
            </div>
            <DashboardSkeleton height={280} rounded={18} />
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
            title={tCommon("error")}
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
                {tCommon("retry")}
              </button>
            }
          />
        </DashboardShell>
      </DashboardPageBoundary>
    );
  }

  const { data, assignments } = state;

  if (!data.hasLearningPath) {
    return (
      <DashboardPageBoundary>
        <DashboardShell
          sidebar={sidebar}
          mobileHeader={mobileHeader}
          tabBar={tabBar}
          header={<DashboardHeader title={personaLabel} />}
        >
          <DashboardCard>
            <DashboardEmptyState title={t("studentMonde.overview.nextAssignmentsEmpty")} />
          </DashboardCard>
        </DashboardShell>
      </DashboardPageBoundary>
    );
  }

  const greeting = data.greetingName?.split(" ")[0] ?? t("studentMonde.greetingFallback");
  const meta = data.learningPath?.currentLevel
    ? t("studentMonde.metaLanguageLevel", { level: data.learningPath.currentLevel })
    : t("studentMonde.metaLanguageLevelUnknown");
  const accessLabel =
    data.access.status === "ACTIVE" ? t("studentMonde.access.active") :
    data.access.status === "EXPIRED" ? t("studentMonde.access.expired") :
    t("studentMonde.access.none");
  const accessTone =
    data.access.status === "ACTIVE" ? "success" as const :
    data.access.status === "EXPIRED" ? "alert" as const :
    "muted" as const;

  return (
    <DashboardPageBoundary>
      <DashboardShell
        sidebar={sidebar}
        mobileHeader={mobileHeader}
          tabBar={tabBar}
        header={
          <DashboardHeader
            title={greeting}
            subtitle={meta}
            meta={<DashboardStatusChip tone={accessTone}>{accessLabel}</DashboardStatusChip>}
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Lot 7A · Monde Ivory · hero + parcours (5 variants pilotés
              par la data onboarding via resolveMondePath). AUCUN tab
              sélecteur en production · le parcours vient uniquement de
              l'onboarding. */}
          <MondeIvoryOverview
            input={{
              // Le champ persisté canonique n'est pas encore projeté par
              // /api/me/monde-dashboard · l'adaptateur retourne null et
              // affiche l'état "Aucun parcours" (brief §12·A) tant que
              // l'API n'expose pas learningGoal. Aucune migration
              // nécessaire dans ce lot.
              learningGoal: null,
              targetCity: null,
              targetDate: null,
              progressPct: 0,
              completed: false,
              level: data.learningPath?.currentLevel ?? null,
            }}
          />
          <OverviewSection data={data} assignments={assignments} />
          <CourseSection courses={data.courses} accessStatus={data.access.status} />
          <AssignmentsSection assignments={assignments} />
          <JourneySection currentLevel={data.learningPath?.currentLevel ?? null} />
          <ClassSection />
          <MessagesPlaceholderSection />
        </div>
      </DashboardShell>
    </DashboardPageBoundary>
  );
}
