import type { DashboardTab } from "./DashboardTabBar";
import type { NavGroup } from "./types";

export function sectionPageHref(baseHref: string, sectionId: string, homeId: string): string {
  return sectionId === homeId ? baseHref : `${baseHref}/view/${sectionId}`;
}

function hashSection(href: string): string | null {
  const index = href.indexOf("#");
  return index >= 0 ? href.slice(index + 1) : null;
}

export function routeSectionNav(groups: NavGroup[], baseHref: string, homeId: string): NavGroup[] {
  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      const sectionId = hashSection(item.href) ?? homeId;
      return { ...item, href: sectionPageHref(baseHref, sectionId, homeId) };
    }),
  }));
}

export function routeSectionTabs(tabs: DashboardTab[], baseHref: string, homeId: string): DashboardTab[] {
  return tabs.map((tab) => {
    const sectionId = hashSection(tab.href) ?? homeId;
    return { ...tab, href: sectionPageHref(baseHref, sectionId, homeId) };
  });
}
