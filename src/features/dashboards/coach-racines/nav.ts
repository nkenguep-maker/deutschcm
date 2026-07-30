import type { NavGroup } from "@/features/dashboards/shared/types";

export function buildCoachRacinesNav(
  labels: {
    overview: string;
    learners: string;
    sessions: string;
    messages: string;
    sessionNotes: string;
    sectionLabel?: string;
  },
  baseHref: string,
): NavGroup[] {
  return [
    {
      key: "coach-racines-main",
      label: labels.sectionLabel,
      items: [
        { key: "overview", label: labels.overview, href: baseHref },
        { key: "learners", label: labels.learners, href: `${baseHref}#mes-apprenants` },
        { key: "sessions", label: labels.sessions, href: `${baseHref}#seances` },
        { key: "messages", label: labels.messages, href: `${baseHref}#messages` },
        { key: "sessionNotes", label: labels.sessionNotes, href: `${baseHref}#notes-de-seance` },
      ],
    },
  ];
}
