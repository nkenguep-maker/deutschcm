import type { NavGroup } from "@/features/dashboards/shared/types";

// Rubriques Élève Monde. Toutes ancres à l'intérieur de /dashboard —
// aucune nouvelle route Next créée dans ce lot (contrainte brief).
export function buildMondeNav(
  labels: {
    overview: string;
    course: string;
    assignments: string;
    journey: string;
    classSection: string;
    messages: string;
    sectionLabel?: string;
  },
  dashboardHref: string,
): NavGroup[] {
  return [
    {
      key: "student-monde-main",
      label: labels.sectionLabel,
      items: [
        { key: "overview", label: labels.overview, href: dashboardHref },
        { key: "course", label: labels.course, href: `${dashboardHref}#mon-cours` },
        { key: "assignments", label: labels.assignments, href: `${dashboardHref}#mes-devoirs` },
        { key: "journey", label: labels.journey, href: `${dashboardHref}#mon-parcours` },
        { key: "class", label: labels.classSection, href: `${dashboardHref}#ma-classe` },
        { key: "messages", label: labels.messages, href: `${dashboardHref}#messages` },
      ],
    },
  ];
}
