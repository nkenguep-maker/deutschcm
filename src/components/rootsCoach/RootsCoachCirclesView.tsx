// P4.4 · Liste des Circles du Coach.

import Link from "next/link";
import RootsCoachLayout from "./RootsCoachLayout";
import type { RootsCoachCircleRow } from "@/lib/rootsCoach/queries";

interface Props {
  locale: string;
  items: RootsCoachCircleRow[];
  total: number;
  page: number;
  pageSize: number;
}

const COPY = {
  fr: {
    title: "Mes cercles",
    empty: "Aucun cercle actif ne vous est assigné.",
    language: "Langue", status: "Statut", children: "Enfants suivis",
    joined: "Assigné le", view: "Voir",
    active: "Actif", archived: "Archivé", suspended: "Suspendu",
    prev: "← Précédent", next: "Suivant →", none: "—",
  },
  en: {
    title: "My circles",
    empty: "No active circle assigned yet.",
    language: "Language", status: "Status", children: "Followed children",
    joined: "Joined", view: "View",
    active: "Active", archived: "Archived", suspended: "Suspended",
    prev: "← Previous", next: "Next →", none: "—",
  },
} as const;

export default function RootsCoachCirclesView({ locale, items, total, page, pageSize }: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const label = (s: string) =>
    s === "ACTIVE" ? c.active : s === "ARCHIVED" ? c.archived : c.suspended;
  return (
    <RootsCoachLayout locale={locale} active="circles" title={c.title}>
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
                  <th className="px-4 py-3">{c.language}</th>
                  <th className="px-4 py-3">{c.children}</th>
                  <th className="px-4 py-3">{c.status}</th>
                  <th className="px-4 py-3">{c.joined}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((circle) => (
                  <tr key={circle.id} className="border-t border-neutral-100" data-testid={`circle-row-${circle.id}`}>
                    <td className="px-4 py-3 font-medium text-neutral-900">{circle.language}</td>
                    <td className="px-4 py-3">{circle.activeChildCount}</td>
                    <td className="px-4 py-3">{label(circle.status)}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {circle.joinedAt ? new Date(circle.joinedAt).toLocaleDateString(locale) : c.none}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/${locale}/coach/racines/circles/${circle.id}`}
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
                <a href={`/${locale}/coach/racines/circles?page=${page - 1}`} className="rounded border border-neutral-300 px-3 py-1">
                  {c.prev}
                </a>
              )}
              {page < pageCount && (
                <a href={`/${locale}/coach/racines/circles?page=${page + 1}`} className="rounded border border-neutral-300 px-3 py-1">
                  {c.next}
                </a>
              )}
            </div>
          </nav>
        </>
      )}
    </RootsCoachLayout>
  );
}
