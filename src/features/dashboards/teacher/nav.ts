import type { NavGroup } from "@/features/dashboards/shared/types";

export function buildTeacherNav(
  labels: {
    overview: string;
    classes: string;
    assignments: string;
    corrections: string;
    resources: string;
    messages: string;
    sectionLabel?: string;
  },
  baseHref: string,
): NavGroup[] {
  return [{
    key: "teacher-main",
    label: labels.sectionLabel,
    items: [
      { key: "overview", label: labels.overview, href: baseHref },
      { key: "classes", label: labels.classes, href: `${baseHref}#classes` },
      { key: "assignments", label: labels.assignments, href: `${baseHref}#devoirs` },
      { key: "corrections", label: labels.corrections, href: `${baseHref}#corrections` },
      { key: "resources", label: labels.resources, href: `${baseHref}#ressources` },
      { key: "messages", label: labels.messages, href: `${baseHref}#messages` },
    ],
  }];
}
