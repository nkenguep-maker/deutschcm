// P4.3b · Étudiants agrégés sur toutes les classes du Teacher · zéro mock.

import TeacherLayout from "@/components/TeacherLayout";
import type { TeacherStudentRow } from "@/lib/teacher/queries";

interface Props {
  locale: string;
  items: TeacherStudentRow[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
}

const COPY = {
  fr: {
    title: "Mes étudiants",
    empty: "Aucun étudiant actif dans mes classes.",
    name: "Nom", classroom: "Classe", level: "Niveau", joined: "Ajouté le",
    search: "Rechercher", prev: "← Précédent", next: "Suivant →",
    none: "—",
  },
  en: {
    title: "My students",
    empty: "No active student in my classes.",
    name: "Name", classroom: "Class", level: "Level", joined: "Joined",
    search: "Search", prev: "← Previous", next: "Next →",
    none: "—",
  },
} as const;

export default function TeacherStudentsView({ locale, items, total, page, pageSize, query }: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return (
    <TeacherLayout title={c.title}>
      <form className="mt-6 flex gap-2" action={`/${locale}/teacher/students`}>
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
                  <th className="px-4 py-3">{c.classroom}</th>
                  <th className="px-4 py-3">{c.level}</th>
                  <th className="px-4 py-3">{c.joined}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={`${s.id}-${s.classroomId}`} className="border-t border-neutral-100" data-testid={`student-row-${s.id}`}>
                    <td className="px-4 py-3 font-medium text-neutral-900">{s.fullName}</td>
                    <td className="px-4 py-3 text-neutral-600">{s.classroomName}</td>
                    <td className="px-4 py-3">{s.level ?? c.none}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(s.joinedAt).toLocaleDateString(locale)}
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
                <a href={`/${locale}/teacher/students?page=${page - 1}${query ? `&query=${encodeURIComponent(query)}` : ""}`}
                   className="rounded border border-neutral-300 px-3 py-1">{c.prev}</a>
              )}
              {page < pageCount && (
                <a href={`/${locale}/teacher/students?page=${page + 1}${query ? `&query=${encodeURIComponent(query)}` : ""}`}
                   className="rounded border border-neutral-300 px-3 py-1">{c.next}</a>
              )}
            </div>
          </nav>
        </>
      )}
    </TeacherLayout>
  );
}
