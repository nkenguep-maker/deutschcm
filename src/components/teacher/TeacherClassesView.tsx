// P4.3b · Liste des classes du Teacher · pagination + search · zéro mock.

import Link from "next/link";
import TeacherLayout from "@/components/TeacherLayout";
import type { TeacherClassRow } from "@/lib/teacher/queries";

interface Props {
  locale: string;
  items: TeacherClassRow[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
}

const COPY = {
  fr: {
    title: "Mes classes",
    empty: "Aucune classe n'est encore affectée.",
    name: "Nom", level: "Niveau", students: "Étudiants",
    status: "Statut", active: "Active", inactive: "Inactive",
    search: "Rechercher", prev: "← Précédent", next: "Suivant →",
    view: "Voir",
  },
  en: {
    title: "My classes",
    empty: "No class assigned yet.",
    name: "Name", level: "Level", students: "Students",
    status: "Status", active: "Active", inactive: "Inactive",
    search: "Search", prev: "← Previous", next: "Next →",
    view: "View",
  },
} as const;

export default function TeacherClassesView({ locale, items, total, page, pageSize, query }: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return (
    <TeacherLayout title={c.title}>
      <form className="mt-6 flex gap-2" action={`/${locale}/teacher/classes`}>
        <input type="search" name="query" defaultValue={query} placeholder={c.search}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white">{c.search}</button>
      </form>
      {items.length === 0 ? (
        <div role="status" className="mt-8 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
          <p className="text-neutral-600">{c.empty}</p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">{c.name}</th>
                  <th className="px-4 py-3">{c.level}</th>
                  <th className="px-4 py-3">{c.students}</th>
                  <th className="px-4 py-3">{c.status}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((cls) => (
                  <tr key={cls.id} className="border-t border-neutral-100" data-testid={`class-row-${cls.id}`}>
                    <td className="px-4 py-3 font-medium text-neutral-900">{cls.name}</td>
                    <td className="px-4 py-3">{cls.level}</td>
                    <td className="px-4 py-3">{cls.activeStudentCount} / {cls.maxStudents}</td>
                    <td className="px-4 py-3">
                      <span className={cls.isActive ? "text-emerald-700" : "text-neutral-500"}>
                        {cls.isActive ? c.active : c.inactive}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/${locale}/teacher/classes/${cls.id}`}
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
                <a href={`/${locale}/teacher/classes?page=${page - 1}${query ? `&query=${encodeURIComponent(query)}` : ""}`}
                   className="rounded border border-neutral-300 px-3 py-1">{c.prev}</a>
              )}
              {page < pageCount && (
                <a href={`/${locale}/teacher/classes?page=${page + 1}${query ? `&query=${encodeURIComponent(query)}` : ""}`}
                   className="rounded border border-neutral-300 px-3 py-1">{c.next}</a>
              )}
            </div>
          </nav>
        </>
      )}
    </TeacherLayout>
  );
}
