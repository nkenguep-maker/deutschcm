import {
  DashboardCard,
  DashboardHeader,
  DashboardMetric,
  DashboardMobileHeader,
  DashboardPageBoundary,
  DashboardProgress,
  DashboardSectionHeader,
  DashboardShell,
  DashboardSidebar,
  DashboardStatusChip,
  DashboardTabBar,
} from "@/features/dashboards/shared";
import type { DashboardTab, NavGroup } from "@/features/dashboards/shared";
import type { InternalPersonaId } from "@/lib/internalPersona";
import {
  INTERNAL_PERSONA_UI_CONTRACTS,
  localize,
  type InternalPersonaRow,
  type InternalPersonaSection,
} from "./contracts";

function SectionRows({ rows, locale, chat = false }: { rows: InternalPersonaRow[]; locale: "fr" | "en"; chat?: boolean }) {
  return (
    <div style={{ display: "grid", gap: chat ? 10 : 8 }}>
      {rows.map((item, index) => (
        <DashboardCard
          key={`${localize(item.title, locale)}-${index}`}
          tone={chat && index % 2 === 0 ? "gold" : index % 2 ? "surface-2" : "surface"}
          style={chat ? { maxWidth: 720, marginLeft: index % 2 ? 0 : "auto", width: "min(100%, 720px)" } : undefined}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ color: "var(--yema-text)", fontSize: 14, fontWeight: 650, lineHeight: 1.35 }}>
                {localize(item.title, locale)}
              </div>
              {item.meta ? (
                <div style={{ color: "var(--yema-text-muted)", fontSize: 12.5, lineHeight: 1.55, marginTop: 5 }}>
                  {localize(item.meta, locale)}
                </div>
              ) : null}
            </div>
            {item.chip ? (
              <DashboardStatusChip tone={item.tone ?? "neutral"}>{localize(item.chip, locale)}</DashboardStatusChip>
            ) : null}
          </div>
        </DashboardCard>
      ))}
    </div>
  );
}

function PersonaSection({ section, locale }: { section: InternalPersonaSection; locale: "fr" | "en" }) {
  const title = localize(section.title, locale);
  const description = section.description ? localize(section.description, locale) : undefined;

  return (
    <section
      id={section.id}
      data-persona-section={section.id}
      aria-labelledby={`${section.id}-title`}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <DashboardSectionHeader
        title={<span id={`${section.id}-title`}>{title}</span>}
        description={description}
      />

      {section.kind === "hero" ? (
        <DashboardCard tone="gold" style={{ padding: 24, overflow: "hidden", position: "relative" }}>
          {section.eyebrow ? (
            <div className="yema-mono" style={{ color: "var(--yema-gold-light)", fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", fontWeight: 700 }}>
              {localize(section.eyebrow, locale)}
            </div>
          ) : null}
          <h2 style={{ color: "var(--yema-text)", fontSize: "clamp(21px, 4vw, 34px)", lineHeight: 1.12, margin: "12px 0 8px", maxWidth: 800 }}>
            {title}
          </h2>
          {description ? <p style={{ color: "var(--yema-text-muted)", fontSize: 14, lineHeight: 1.6, margin: "0 0 16px", maxWidth: 720 }}>{description}</p> : null}
          {typeof section.progress === "number" ? (
            <div style={{ maxWidth: 720, marginBottom: 18 }}>
              <DashboardProgress value={section.progress} max={100} ariaLabel={`${title} ${section.progress}%`} />
              <div className="yema-mono" style={{ marginTop: 7, color: "var(--yema-text-muted)", fontSize: 10 }}>{section.progress} %</div>
            </div>
          ) : null}
          {section.cta ? (
            <span
              style={{ display: "inline-flex", minHeight: 48, alignItems: "center", justifyContent: "center", padding: "0 20px", borderRadius: "var(--yema-r-pill)", background: "var(--yema-text)", color: "var(--yema-bg)", fontSize: 13, fontWeight: 750 }}
            >
              {localize(section.cta, locale)}
            </span>
          ) : null}
        </DashboardCard>
      ) : null}

      {section.kind === "metrics" && section.metrics ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          {section.metrics.map((metric) => (
            <DashboardMetric
              key={localize(metric.label, locale)}
              label={localize(metric.label, locale)}
              value={metric.value}
              hint={metric.hint ? localize(metric.hint, locale) : undefined}
            />
          ))}
        </div>
      ) : null}

      {(section.kind === "list" || section.kind === "status" || section.kind === "timeline") && section.rows ? (
        <SectionRows rows={section.rows} locale={locale} />
      ) : null}

      {section.kind === "chat" && section.rows ? <SectionRows rows={section.rows} locale={locale} chat /> : null}
    </section>
  );
}

function sectionHref(baseHref: string, firstSectionId: string, sectionId: string): string {
  return sectionId === firstSectionId ? baseHref : `${baseHref}/view/${sectionId}`;
}

type Props = {
  persona: InternalPersonaId;
  locale: "fr" | "en";
  activeSectionId?: string;
  baseHrefOverride?: string;
};

export function InternalPersonaDashboard({ persona, locale, activeSectionId, baseHrefOverride }: Props) {
  const contract = INTERNAL_PERSONA_UI_CONTRACTS[persona];
  const firstSection = contract.sections[0];
  const activeSection = contract.sections.find((section) => section.id === activeSectionId) ?? firstSection;
  const baseHref = baseHrefOverride ?? `/${locale}${contract.route}`;
  const activeHref = sectionHref(baseHref, firstSection.id, activeSection.id);
  const title = localize(contract.title, locale);
  const subtitle = localize(contract.subtitle, locale);

  const groups: NavGroup[] = [{
    key: `internal-${persona}`,
    label: locale === "fr" ? "Données de test complètes" : "Complete test data",
    items: contract.sections.map((section) => ({
      key: section.id,
      label: localize(section.title, locale),
      href: sectionHref(baseHref, firstSection.id, section.id),
    })),
  }];

  const tabs: DashboardTab[] = contract.tabs.map((tab) => ({
    key: tab.id,
    label: localize(tab.label, locale),
    href: sectionHref(baseHref, firstSection.id, tab.id),
    badgeCount: tab.badge ?? null,
  }));

  const sidebar = (
    <DashboardSidebar
      groups={groups}
      activeHref={activeHref}
      personaLabel={title}
      personaSubtitle={subtitle}
      brandHref={`/${locale}`}
      footer={
        <div style={{ borderTop: "1px solid var(--yema-border)", paddingTop: 14 }}>
          <DashboardStatusChip tone="gold">{locale === "fr" ? "Mode persona complet" : "Complete persona mode"}</DashboardStatusChip>
        </div>
      }
    />
  );

  return (
    <DashboardPageBoundary>
      <div
        data-internal-persona-dashboard={persona}
        data-persona-active-section={activeSection.id}
        data-persona-section-count={contract.sections.length}
      >
        <DashboardShell
          universe={contract.universe}
          sidebar={sidebar}
          mobileHeader={<DashboardMobileHeader personaLabel={title} personaSubtitle={subtitle} brandHref={`/${locale}`} />}
          tabBar={<DashboardTabBar tabs={tabs} activeKey={activeSection.id} />}
          header={
            <DashboardHeader
              title={localize(activeSection.title, locale)}
              subtitle={subtitle}
              meta={<DashboardStatusChip tone="gold">{locale === "fr" ? "Une rubrique par page" : "One section per page"}</DashboardStatusChip>}
            />
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
            <DashboardCard tone="surface-2" style={{ padding: "13px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div className="yema-mono" style={{ color: "var(--yema-gold-light)", fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase" }}>
                    {locale === "fr" ? "TEST INTERNE · PAGE DÉDIÉE" : "INTERNAL TEST · DEDICATED PAGE"}
                  </div>
                  <div style={{ color: "var(--yema-text-muted)", fontSize: 12, marginTop: 4 }}>
                    {locale === "fr" ? "Cette rubrique est isolée et prête à recevoir ses données et cours réels." : "This section is isolated and ready for real data and course content."}
                  </div>
                </div>
                <DashboardStatusChip tone="success">1 / {contract.sections.length}</DashboardStatusChip>
              </div>
            </DashboardCard>

            <PersonaSection section={activeSection} locale={locale} />
          </div>
        </DashboardShell>
      </div>
    </DashboardPageBoundary>
  );
}
