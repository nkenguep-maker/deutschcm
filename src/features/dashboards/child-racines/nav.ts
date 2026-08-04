import type { NavGroup, DashboardTab } from "@/features/dashboards/shared";

export function buildChildRacinesNav(labels: {
  home: string; tales: string; songs: string; badges: string;
  oralProgress: string; familyActivities: string; sectionLabel?: string;
}, baseHref: string): NavGroup[] {
  return [{
    key: "child-racines-main",
    label: labels.sectionLabel,
    items: [
      { key: "home", label: labels.home, href: baseHref },
      { key: "tales", label: labels.tales, href: `${baseHref}#contes` },
      { key: "songs", label: labels.songs, href: `${baseHref}#chansons` },
      { key: "badges", label: labels.badges, href: `${baseHref}#badges` },
      { key: "oralProgress", label: labels.oralProgress, href: `${baseHref}#oral` },
      { key: "familyActivities", label: labels.familyActivities, href: `${baseHref}#famille` },
    ],
  }];
}

export function buildChildRacinesMobileTabs(labels: {
  home: string; tales: string; songs: string; badges: string;
}, baseHref: string): DashboardTab[] {
  return [
    { key: "home", label: labels.home, href: baseHref },
    { key: "tales", label: labels.tales, href: `${baseHref}#contes` },
    { key: "songs", label: labels.songs, href: `${baseHref}#chansons` },
    { key: "badges", label: labels.badges, href: `${baseHref}#badges` },
  ];
}
