import type { NavGroup, DashboardTab } from "@/features/dashboards/shared";

export function buildChildMondeNav(labels: {
  home: string;
  games: string;
  stories: string;
  badges: string;
  progression: string;
  adultActivities: string;
  sectionLabel?: string;
}, baseHref: string): NavGroup[] {
  return [{
    key: "child-monde-main",
    label: labels.sectionLabel,
    items: [
      { key: "home", label: labels.home, href: baseHref },
      { key: "games", label: labels.games, href: `${baseHref}#jeux` },
      { key: "stories", label: labels.stories, href: `${baseHref}#histoires` },
      { key: "badges", label: labels.badges, href: `${baseHref}#badges` },
      { key: "progression", label: labels.progression, href: `${baseHref}#progression` },
      { key: "adultActivities", label: labels.adultActivities, href: `${baseHref}#adulte` },
    ],
  }];
}

export function buildChildMondeMobileTabs(labels: {
  home: string; games: string; stories: string; badges: string;
}, baseHref: string): DashboardTab[] {
  return [
    { key: "home", label: labels.home, href: baseHref },
    { key: "games", label: labels.games, href: `${baseHref}#jeux` },
    { key: "stories", label: labels.stories, href: `${baseHref}#histoires` },
    { key: "badges", label: labels.badges, href: `${baseHref}#badges` },
  ];
}
