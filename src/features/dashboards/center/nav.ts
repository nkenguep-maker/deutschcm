import type { NavGroup, DashboardTab } from "@/features/dashboards/shared";

export function buildCenterNav(
  labels: {
    overview: string;
    students: string;
    teachers: string;
    classes: string;
    messages: string;
    settings: string;
    sectionLabel?: string;
  },
  baseHref: string,
): NavGroup[] {
  return [
    {
      key: "center-main",
      label: labels.sectionLabel,
      items: [
        { key: "overview", label: labels.overview, href: baseHref },
        { key: "students", label: labels.students, href: `${baseHref}#eleves` },
        { key: "teachers", label: labels.teachers, href: `${baseHref}#enseignants` },
        { key: "classes", label: labels.classes, href: `${baseHref}#classes` },
        { key: "messages", label: labels.messages, href: `${baseHref}#messages` },
        { key: "settings", label: labels.settings, href: `${baseHref}#parametres` },
      ],
    },
  ];
}

export function buildCenterMobileTabs(
  labels: {
    overview: string;
    students: string;
    classes: string;
    messages: string;
  },
  baseHref: string,
): DashboardTab[] {
  return [
    { key: "overview", label: labels.overview, href: baseHref },
    { key: "students", label: labels.students, href: `${baseHref}#eleves` },
    { key: "classes", label: labels.classes, href: `${baseHref}#classes` },
    { key: "messages", label: labels.messages, href: `${baseHref}#messages` },
  ];
}
