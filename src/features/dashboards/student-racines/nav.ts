import type { NavGroup } from "@/features/dashboards/shared/types";

export function buildRacinesNav(
  labels: {
    overview: string;
    steps: string;
    listens: string;
    coach: string;
    circle: string;
    messages: string;
    sectionLabel?: string;
  },
  dashboardHref: string,
): NavGroup[] {
  return [
    {
      key: "student-racines-main",
      label: labels.sectionLabel,
      items: [
        { key: "overview", label: labels.overview, href: dashboardHref },
        { key: "steps", label: labels.steps, href: `${dashboardHref}#mes-etapes` },
        { key: "listens", label: labels.listens, href: `${dashboardHref}#ecoutes` },
        { key: "coach", label: labels.coach, href: `${dashboardHref}#mon-coach` },
        { key: "circle", label: labels.circle, href: `${dashboardHref}#cercle` },
        { key: "messages", label: labels.messages, href: `${dashboardHref}#messages` },
      ],
    },
  ];
}
