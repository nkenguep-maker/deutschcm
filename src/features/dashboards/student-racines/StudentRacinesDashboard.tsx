"use client";

// StudentRacinesDashboard · Lot 2 P4.6.
// Réutilise /api/me/racines-dashboard existant — aucun resolver dupliqué.
// Rendu client comme l'ancien composant, mais dans le shell YEMA en
// variante Racines (surfaces bordeaux via data-yema-universe="racines").

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DashboardShell,
  DashboardSidebar,
  DashboardHeader,
  DashboardMobileNavigation,
  DashboardCard,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardPageBoundary,
  DashboardSkeleton,
  DashboardStatusChip,
} from "@/features/dashboards/shared";
import { buildRacinesNav } from "./nav";
import { OverviewSection } from "./sections/OverviewSection";
import { StepsSection } from "./sections/StepsSection";
import { ListensSection } from "./sections/ListensSection";
import { CoachSection } from "./sections/CoachSection";
import { CircleSection } from "./sections/CircleSection";
import { ChildrenSection } from "./sections/ChildrenSection";
import { MessagesPlaceholderSection } from "./sections/MessagesPlaceholderSection";
import type { RacinesDashboardData } from "./types";

async function loadDashboard(): Promise<RacinesDashboardData> {
  const res = await fetch("/api/me/racines-dashboard", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as RacinesDashboardData;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; data: RacinesDashboardData };

export function StudentRacinesDashboard({ locale }: { locale: "fr" | "en" }) {
  const t = useTranslations("yemaDashboards");
  const tCommon = useTranslations("yemaDashboards.common");
  const currentLocale = useLocale();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const dashboardHref = `/${currentLocale ?? locale}/dashboard`;

  const load = () => {
    setState({ kind: "loading" });
    loadDashboard()
      .then((data) => setState({ kind: "ready", data }))
      .catch(() => setState({ kind: "error" }));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const navGroups = buildRacinesNav(
    {
      overview: t("studentRacines.nav.overview"),
      steps: t("studentRacines.nav.steps"),
      listens: t("studentRacines.nav.listens"),
      coach: t("studentRacines.nav.coach"),
      circle: t("studentRacines.nav.circle"),
      messages: t("studentRacines.nav.messages"),
      sectionLabel: t("studentRacines.sidebarSection"),
    },
    dashboardHref,
  );

  const personaLabel = t("studentRacines.personaLabel");
  const personaSubtitle = t("studentRacines.personaSubtitle");

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

  const mobileNav = (
    <DashboardMobileNavigation
      groups={navGroups}
      activeHref={dashboardHref}
      personaLabel={personaLabel}
    />
  );

  if (state.kind === "loading") {
    return (
      <DashboardPageBoundary>
        <DashboardShell
          universe="racines"
          sidebar={sidebar}
          mobileNav={mobileNav}
          header={<DashboardHeader title={personaLabel} subtitle={tCommon("loading")} />}
        >
          <div style={{ display: "grid", gap: 16 }}>
            <DashboardSkeleton height={140} rounded={18} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              <DashboardSkeleton height={140} rounded={18} />
              <DashboardSkeleton height={140} rounded={18} />
              <DashboardSkeleton height={140} rounded={18} />
            </div>
          </div>
        </DashboardShell>
      </DashboardPageBoundary>
    );
  }

  if (state.kind === "error") {
    return (
      <DashboardPageBoundary>
        <DashboardShell
          universe="racines"
          sidebar={sidebar}
          mobileNav={mobileNav}
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

  const { data } = state;

  if (!data.hasLearningPath) {
    return (
      <DashboardPageBoundary>
        <DashboardShell
          universe="racines"
          sidebar={sidebar}
          mobileNav={mobileNav}
          header={<DashboardHeader title={personaLabel} />}
        >
          <DashboardCard>
            <DashboardEmptyState title={t("studentRacines.overview.noAccessTitle")} description={t("studentRacines.overview.noAccessBody")} />
          </DashboardCard>
        </DashboardShell>
      </DashboardPageBoundary>
    );
  }

  const greeting = data.greetingName?.split(" ")[0] ?? t("studentRacines.greetingFallback");
  const meta = data.racinesStep
    ? t("studentRacines.metaLanguageStep", { step: data.racinesStep })
    : t("studentRacines.metaLanguageOnly");
  const modeLabel =
    data.mode === "SOLO" ? t("studentRacines.mode.solo") :
    data.mode === "FAMILY" ? t("studentRacines.mode.family") :
    data.mode === "NO_ACCESS" ? t("studentRacines.mode.noAccess") :
    t("studentRacines.mode.unknown");

  return (
    <DashboardPageBoundary>
      <DashboardShell
        universe="racines"
        sidebar={sidebar}
        mobileNav={mobileNav}
        header={
          <DashboardHeader
            title={greeting}
            subtitle={meta}
            meta={<DashboardStatusChip tone="neutral">{modeLabel}</DashboardStatusChip>}
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <OverviewSection data={data} />
          <StepsSection steps={data.steps} currentStep={data.racinesStep} />
          {data.mode === "FAMILY" && data.household.childrenCount > 0 ? (
            <ChildrenSection profiles={data.children} />
          ) : null}
          <ListensSection anyLanguageReady={data.anyLanguageReady} />
          <CoachSection />
          <CircleSection />
          <MessagesPlaceholderSection />
        </div>
      </DashboardShell>
    </DashboardPageBoundary>
  );
}
