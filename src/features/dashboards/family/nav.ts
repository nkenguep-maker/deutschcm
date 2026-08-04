import type { NavGroup, DashboardTab } from "@/features/dashboards/shared";

export function buildFamilyNav(
  labels: {
    overview: string;
    children: string;
    progression: string;
    sessions: string;
    messages: string;
    payments: string;
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
        { key: "payments", label: labels.payments, href: `${baseHref}#paiements` },
        { key: "settings", label: labels.settings, href: `${baseHref}#parametres` },
      ],
    },
  ];
}

// Mobile PDF-style : 5 tabs (Accueil, Enfants, Progression, Paiements, Messages).
// Paramètres accessibles depuis le header ou une action secondaire (contrainte
// brief §7).
export function buildFamilyMobileTabs(
  labels: {
    overview: string;
    children: string;
    progression: string;
    payments: string;
    messages: string;
  },
  baseHref: string,
): DashboardTab[] {
  return [
    { key: "overview", label: labels.overview, href: baseHref },
    { key: "children", label: labels.children, href: `${baseHref}#mes-enfants` },
    { key: "progression", label: labels.progression, href: `${baseHref}#progression` },
    { key: "payments", label: labels.payments, href: `${baseHref}#paiements` },
    { key: "messages", label: labels.messages, href: `${baseHref}#messages` },
  ];
}
