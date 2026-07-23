// P4.4 · Liste des profils enfants suivis · projection minimale.

import Link from "next/link";
import RootsCoachLayout from "./RootsCoachLayout";
import type { RootsCoachChildRow } from "@/lib/rootsCoach/queries";

interface Props {
  locale: string;
  items: RootsCoachChildRow[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
}

const COPY = {
  fr: {
    title: "Profils suivis",
    empty: "Aucun profil actif dans mes cercles.",
    displayName: "Nom d'usage", ageBand: "Tranche d'âge",
    language: "Langue", circle: "Cercle", joined: "Entrée",
    view: "Voir", search: "Rechercher", prev: "← Précédent", next: "Suivant →", none: "—",
  },
  en: {
    title: "Followed profiles",
    empty: "No active profile in my circles.",
    displayName: "Display name", ageBand: "Age band",
    language: "Language", circle: "Circle", joined: "Joined",
    view: "View", search: "Search", prev: "← Previous", next: "Next →", none: "—",
  },
} as const;

export default function RootsCoachProfilesView({ locale, items, total, page, pageSize, query }: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return (
    <RootsCoachLayout locale={locale} active="profiles" title={c.title}>
      <form className="mt-6 flex gap-2" action={`/${locale}/coach/racines/profiles`}>
        <input
          type="search" name="query" defaultValue={query} placeholder={c.search}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white">{c.search}</button>
      </form>
      {items.length === 0 ? (
        <div role="status" className="mt-6 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
          <p className="text-neutral-600">{c.empty}</p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">{c.displayName}</th>
                  <th className="px-4 py-3">{c.ageBand}</th>
                  <th className="px-4 py-3">{c.language}</th>
                  <th className="px-4 py-3">{c.circle}</th>
                  <th className="px-4 py-3">{c.joined}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((child) => (
                  <tr key={child.id} className="border-t border-neutral-100" data-testid={`profile-row-${child.id}`}>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      <span aria-hidden="true" className="mr-2">{child.avatarAnimal}</span>
                      {child.displayName}
                    </td>
                    <td className="px-4 py-3">{child.ageBand}</td>
                    <td className="px-4 py-3">{child.activeLangue ?? c.none}</td>
                    <td className="px-4 py-3 text-neutral-600">{child.circleLanguage}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {child.joinedAt ? new Date(child.joinedAt).toLocaleDateString(locale) : c.none}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/${locale}/coach/racines/profiles/${child.id}`}
                        className="text-sm text-neutral-900 underline"
                      >
                        {c.view}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav className="mt-4 flex items-center justify-between text-sm text-neutral-600">
            <span>{page} / {pageCount} · {total} total</span>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`/${locale}/coach/racines/profiles?page=${page - 1}${query ? `&query=${encodeURIComponent(query)}` : ""}`}
                   className="rounded border border-neutral-300 px-3 py-1">{c.prev}</a>
              )}
              {page < pageCount && (
                <a href={`/${locale}/coach/racines/profiles?page=${page + 1}${query ? `&query=${encodeURIComponent(query)}` : ""}`}
                   className="rounded border border-neutral-300 px-3 py-1">{c.next}</a>
              )}
            </div>
          </nav>
        </>
      )}
    </RootsCoachLayout>
  );
}
