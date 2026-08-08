import type { NavGroup, DashboardTab } from "@/features/dashboards/shared";

export function buildFamilyNav(
  labels: {
    overview: string;
    children: string;
    progression: string;
    sessions: string;
    messages: string;
    settings: string;
    sectionLabel?: string;
  },
  baseHref: string,
): NavGroup[] {
  return [
    {
      key: "family-main",
      label: labels.sectionLabel,
      items: [
        { key: "overview", label: labels.overview, href: baseHref },
        { key: "children", label: labels.children, href: `${baseHref}#mes-enfants` },
        { key: "progression", label: labels.progression, href: `${baseHref}#progression` },
        { key: "sessions", label: labels.sessions, href: `${baseHref}#seances` },
        { key: "messages", label: labels.messages, href: `${baseHref}#messages` },
        { key: "settings", label: labels.settings, href: `${baseHref}#parametres` },
      ],
    },
  ];
}

export function buildFamilyMobileTabs(
  labels: {
    overview: string;
    children: string;
    progression: string;
    messages: string;
  },
  baseHref: string,
): DashboardTab[] {
  return [
    { key: "overview", label: labels.overview, href: baseHref },
    { key: "children", label: labels.children, href: `${baseHref}#mes-enfants` },
    { key: "progression", label: labels.progression, href: `${baseHref}#progression` },
    { key: "messages", label: labels.messages, href: `${baseHref}#messages` },
  ];
}
