"use client";

// CoachRacinesDashboard · Lot 3 P4.6.
// Réutilise strictement /api/roots-coach/dashboard et /api/roots-coach/profiles
// — aucun resolver dupliqué. Universe="racines" pour surfaces bordeaux.
// Isolation stricte : les profils affichés sont bornés par le resolver
// serveur (assertRootsCoachChildAccess implicite via l'endpoint). Aucun
// learnerId brut, aucune donnée Monde, aucune fausse messagerie.

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DashboardErrorState,
  DashboardHeader,
  DashboardMobileNavigation,
  DashboardPageBoundary,
  DashboardShell,
  DashboardSidebar,
  DashboardSkeleton,
  DashboardStatusChip,
} from "@/features/dashboards/shared";
import { buildCoachRacinesNav } from "./nav";
import { CoachOverviewSection } from "./sections/CoachOverviewSection";
import { CoachLearnersSection } from "./sections/CoachLearnersSection";
import { CoachSessionsSection } from "./sections/CoachSessionsSection";
import { CoachMessagesSection } from "./sections/CoachMessagesSection";
import { CoachSessionNotesSection } from "./sections/CoachSessionNotesSection";
import type {
  CoachChildProfileRow,
  CoachDashboardResponse,
  CoachProfilesResponse,
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
      data: CoachDashboardResponse;
      learners: CoachChildProfileRow[];
    };

export function CoachRacinesDashboard({ locale }: { locale: "fr" | "en" }) {
  const t = useTranslations("yemaDashboards.coachRacines");
  const tRoot = useTranslations("yemaDashboards");
  const currentLocale = useLocale();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const baseHref = `/${currentLocale ?? locale}/coach/racines`;

  const load = () => {
    setState({ kind: "loading" });
    Promise.all([
      fetchJson<CoachDashboardResponse>("/api/roots-coach/dashboard"),
      fetchJson<CoachProfilesResponse>("/api/roots-coach/profiles?pageSize=50"),
    ])
      .then(([data, profiles]) =>
        setState({ kind: "ready", data, learners: profiles.items ?? [] }),
      )
      .catch(() => setState({ kind: "error" }));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const navGroups = buildCoachRacinesNav(
    {
      overview: t("nav.overview"),
      learners: t("nav.learners"),
      sessions: t("nav.sessions"),
      messages: t("nav.messages"),
      sessionNotes: t("nav.sessionNotes"),
      sectionLabel: t("sidebarSection"),
    },
    baseHref,
  );

  const personaLabel = t("personaLabel");
  const personaSubtitle = t("personaSubtitle");

  const sidebar = (
    <DashboardSidebar
      groups={navGroups}
      activeHref={baseHref}
      personaLabel={personaLabel}
      personaSubtitle={personaSubtitle}
      brandHref={`/${currentLocale ?? locale}`}
      previewBadge={tRoot("common.previewBadge")}
    />
  );

  const mobileNav = (
    <DashboardMobileNavigation
      groups={navGroups}
      activeHref={baseHref}
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
          header={<DashboardHeader title={personaLabel} subtitle={t("loading")} />}
        >
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
              <DashboardSkeleton height={120} rounded={18} />
              <DashboardSkeleton height={120} rounded={18} />
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
          universe="racines"
          sidebar={sidebar}
          mobileNav={mobileNav}
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

  const { data, learners } = state;
  const meta = t("meta", {
    activeCircles: data.stats.activeCircleCount,
    activeChildren: data.stats.activeChildProfileCount,
  });

  return (
    <DashboardPageBoundary>
      <DashboardShell
        universe="racines"
        sidebar={sidebar}
        mobileNav={mobileNav}
        header={
          <DashboardHeader
            title={personaLabel}
            subtitle={meta}
            meta={<DashboardStatusChip tone="neutral">{data.actorRole}</DashboardStatusChip>}
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <CoachOverviewSection stats={data.stats} />
          <CoachLearnersSection learners={learners} loading={false} baseHref={baseHref} />
          <CoachSessionsSection />
          <CoachMessagesSection />
          <CoachSessionNotesSection />
        </div>
      </DashboardShell>
    </DashboardPageBoundary>
  );
}
