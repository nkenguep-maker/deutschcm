// P4.4 · Layout minimal Coach Racines. Sidebar simple avec les 7 rubriques.

import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  locale: string;
  active: "dashboard" | "circles" | "profiles" | "activities" | "messages" | "sessions";
  title: string;
  children: ReactNode;
}

const NAV = {
  fr: [
    { key: "dashboard", label: "Vue coach",     href: "/coach/racines" },
    { key: "circles",   label: "Mes cercles",   href: "/coach/racines/circles" },
    { key: "profiles",  label: "Profils suivis", href: "/coach/racines/profiles" },
    { key: "activities", label: "Activités",    href: "/coach/racines/activities" },
    { key: "messages",  label: "Messages",      href: "/coach/racines/messages" },
    { key: "sessions",  label: "Sessions",      href: "/coach/racines/sessions" },
  ],
  en: [
    { key: "dashboard", label: "Coach overview", href: "/coach/racines" },
    { key: "circles",   label: "My circles",     href: "/coach/racines/circles" },
    { key: "profiles",  label: "Followed profiles", href: "/coach/racines/profiles" },
    { key: "activities", label: "Activities",   href: "/coach/racines/activities" },
    { key: "messages",  label: "Messages",      href: "/coach/racines/messages" },
    { key: "sessions",  label: "Sessions",      href: "/coach/racines/sessions" },
  ],
} as const;

export default function RootsCoachLayout({ locale, active, title, children }: Props) {
  const nav = locale === "en" ? NAV.en : NAV.fr;
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl gap-6 px-4 py-6">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="mb-6 font-serif text-lg text-neutral-900">Yema · Racines</div>
        <nav aria-label={locale === "en" ? "Coach navigation" : "Navigation coach"}>
          <ul className="space-y-1 text-sm">
            {nav.map((item) => (
              <li key={item.key}>
                <Link
                  href={`/${locale}${item.href}`}
                  className={`block rounded px-3 py-2 ${item.key === active ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        <h1 className="font-serif text-2xl text-neutral-900">{title}</h1>
        {children}
      </main>
    </div>
  );
}
