"use client";

// FamilyDashboard · Lot 4A P4.6.
// Réutilise /api/family/dashboard (nouveau, Lot 4A) qui agrège enfants +
// sièges + accès adulte. Aucun pinHash jamais fetché côté client.
// Universe neutral pour préserver la palette YEMA standard (le foyer n'est
// pas strictement Monde ni Racines).

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
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
import { buildFamilyNav, buildFamilyMobileTabs } from "./nav";
import { FamilyOverviewSection } from "./sections/FamilyOverviewSection";
import { FamilyChildrenSection } from "./sections/FamilyChildrenSection";
import { FamilyProgressionSection } from "./sections/FamilyProgressionSection";
import { FamilySessionsSection } from "./sections/FamilySessionsSection";
import { FamilyMessagesSection } from "./sections/FamilyMessagesSection";
import { FamilyPaymentsSection } from "./sections/FamilyPaymentsSection";
import { FamilySettingsSection } from "./sections/FamilySettingsSection";
import type { FamilyDashboardResponse } from "./types";
import type { FamilyChildActionsCopy } from "./FamilyChildActions";

async function fetchDashboard(): Promise<FamilyDashboardResponse> {
  const res = await fetch("/api/family/dashboard", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as FamilyDashboardResponse;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; data: FamilyDashboardResponse };

export function FamilyDashboard({ locale }: { locale: "fr" | "en" }) {
  const t = useTranslations("yemaDashboards.family");
  const tCommon = useTranslations("yemaDashboards.common");
  const tActions = useTranslations("yemaDashboards.family.actions");
  const tAdd = useTranslations("yemaDashboards.family.addDialog");
  const currentLocale = useLocale();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const baseHref = `/${currentLocale ?? locale}/family`;

  const actionsCopy: FamilyChildActionsCopy = {
    openChildSpace: tActions("openChildSpace"),
    addChild: tActions("addChild"),
    childPinTitle: tActions("childPinTitle"),
    childPinLabel: tActions("childPinLabel"),
    childPinPlaceholder: tActions("childPinPlaceholder"),
    childPinSubmit: tActions("childPinSubmit"),
    childPinCancel: tActions("childPinCancel"),
    childPinErrGeneric: tActions("childPinErrGeneric"),
    addDialog: {
      step: tAdd("step"),
      prenomLbl: tAdd("prenomLbl"),
      ageLbl: tAdd("ageLbl"),
      animalLbl: tAdd("animalLbl"),
      universeLbl: tAdd("universeLbl"),
      universeMondeLabel: tAdd("universeMondeLabel"),
      universeMondeDesc: tAdd("universeMondeDesc"),
      universeRacinesLabel: tAdd("universeRacinesLabel"),
      universeRacinesDesc: tAdd("universeRacinesDesc"),
      languesLbl: tAdd("languesLbl"),
      languesHelp: tAdd("languesHelp"),
      nativeLbl: tAdd("nativeLbl"),
      foreignLbl: tAdd("foreignLbl"),
      goalLbl: tAdd("goalLbl"),
      goalHelp: tAdd("goalHelp"),
      goalOpts: {
        STUDIES: tAdd("goalOpts.STUDIES"),
        WORK: tAdd("goalOpts.WORK"),
        TRAVEL: tAdd("goalOpts.TRAVEL"),
        EXAM: tAdd("goalOpts.EXAM"),
        DAILY_LIFE: tAdd("goalOpts.DAILY_LIFE"),
        LATER: tAdd("goalOpts.LATER"),
      },
      cancel: tAdd("cancel"),
      create: tAdd("create"),
      errName: tAdd("errName"),
      errAge: tAdd("errAge"),
      errAnimal: tAdd("errAnimal"),
      errLang: tAdd("errLang"),
      errUniverse: tAdd("errUniverse"),
      errServer: tAdd("errServer"),
    },
  };

  const load = () => {
    setState({ kind: "loading" });
    fetchDashboard()
      .then((data) => setState({ kind: "ready", data }))
      .catch(() => setState({ kind: "error" }));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const personaLabel = t("personaLabel");
  const personaSubtitle = t("personaSubtitle");

  const navGroups = buildFamilyNav(
    {
      overview: t("nav.overview"),
      children: t("nav.children"),
      progression: t("nav.progression"),
      sessions: t("nav.sessions"),
      messages: t("nav.messages"),
      payments: t("nav.payments"),
      settings: t("nav.settings"),
      sectionLabel: t("sidebarSection"),
    },
    baseHref,
  );

  const mobileTabs = buildFamilyMobileTabs(
    {
      overview: t("mobileNav.overview"),
      children: t("mobileNav.children"),
      progression: t("mobileNav.progression"),
      payments: t("mobileNav.payments"),
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
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

  const { data } = state;
  const metaText = t("meta", { count: data.totalChildrenLinked });

  return (
    <DashboardPageBoundary>
      <DashboardShell
        sidebar={sidebar}
        mobileHeader={mobileHeader}
        tabBar={tabBar}
        header={
          <DashboardHeader
            title={personaLabel}
            subtitle={metaText}
            meta={
              data.adultAccess.hasAnyAdultAccess ? (
                <DashboardStatusChip tone="gold">
                  {[data.adultAccess.monde ? "Monde" : null, data.adultAccess.racines ? "Racines" : null]
                    .filter(Boolean)
                    .join(" · ")}
                </DashboardStatusChip>
              ) : undefined
            }
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <FamilyOverviewSection data={data} />
          <FamilyChildrenSection data={data} baseHref={baseHref} locale={locale} actionsCopy={actionsCopy} />
          <FamilyProgressionSection profiles={data.children} />
          <FamilySessionsSection />
          <FamilyMessagesSection />
          <FamilyPaymentsSection seats={data.seats} />
          <FamilySettingsSection />
        </div>
      </DashboardShell>
    </DashboardPageBoundary>
  );
}
