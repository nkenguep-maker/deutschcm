import type { NavGroup, DashboardTab } from "@/features/dashboards/shared";

export function buildAdminNav(
  labels: {
    console: string;
    accounts: string;
    audit: string;
    environment: string;
    sectionLabel?: string;
  },
  baseHref: string,
): NavGroup[] {
  return [
    {
      key: "admin-main",
      label: labels.sectionLabel,
      items: [
        { key: "console", label: labels.console, href: baseHref },
        { key: "accounts", label: labels.accounts, href: `${baseHref}#comptes` },
        { key: "audit", label: labels.audit, href: `${baseHref}#audit` },
        { key: "environment", label: labels.environment, href: `${baseHref}#environnement` },
      ],
    },
  ];
}

export function buildAdminMobileTabs(
  labels: { console: string; accounts: string; audit: string; environment: string },
  baseHref: string,
): DashboardTab[] {
  return [
    { key: "console", label: labels.console, href: baseHref },
    { key: "accounts", label: labels.accounts, href: `${baseHref}#comptes` },
    { key: "audit", label: labels.audit, href: `${baseHref}#audit` },
    { key: "environment", label: labels.environment, href: `${baseHref}#environnement` },
  ];
}
