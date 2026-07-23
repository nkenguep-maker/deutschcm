// P4.3b · Détail d'une classe · liste étudiants scopée · zéro mock.

import TeacherLayout from "@/components/TeacherLayout";
import type { TeacherClassDetail, TeacherStudentRow } from "@/lib/teacher/queries";

interface Props {
  locale: string;
  classroom: TeacherClassDetail;
  students: TeacherStudentRow[];
  total: number;
  page: number;
  pageSize: number;
}

const COPY = {
  fr: {
    title: (name: string) => `Classe · ${name}`,
    level: "Niveau", students: "Étudiants",
    capacity: "Capacité", opened: "Ouverte le",
    status: "Statut", active: "Active", inactive: "Inactive",
    name: "Nom", joined: "Inscription", none: "—",
    empty: "Aucun étudiant actif dans cette classe.",
    prev: "← Précédent", next: "Suivant →",
  },
  en: {
    title: (name: string) => `Class · ${name}`,
    level: "Level", students: "Students",
    capacity: "Capacity", opened: "Opened",
    status: "Status", active: "Active", inactive: "Inactive",
    name: "Name", joined: "Joined", none: "—",
    empty: "No active student in this class yet.",
    prev: "← Previous", next: "Next →",
  },
} as const;

export default function TeacherClassDetailView({ locale, classroom, students, total, page, pageSize }: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return (
    <TeacherLayout title={c.title(classroom.name)}>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500">{c.level}</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">{classroom.level}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500">{c.students}</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">
            {classroom.activeStudentCount} / {classroom.maxStudents}
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500">{c.status}</div>
          <div className={`mt-1 text-sm ${classroom.isActive ? "text-emerald-700" : "text-neutral-500"}`}>
            {classroom.isActive ? c.active : c.inactive}
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500">{c.opened}</div>
          <div className="mt-1 text-sm text-neutral-900">
            {new Date(classroom.createdAt).toLocaleDateString(locale)}
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <div role="status" className="mt-8 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
          <p className="text-neutral-600">{c.empty}</p>
        </div>
      ) : (
        <>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">{c.name}</th>
                  <th className="px-4 py-3">{c.level}</th>
                  <th className="px-4 py-3">{c.joined}</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-neutral-100" data-testid={`student-row-${s.id}`}>
                    <td className="px-4 py-3 font-medium text-neutral-900">{s.fullName}</td>
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
                <a href={`/${locale}/teacher/classes/${classroom.id}?page=${page - 1}`}
                   className="rounded border border-neutral-300 px-3 py-1">{c.prev}</a>
              )}
              {page < pageCount && (
                <a href={`/${locale}/teacher/classes/${classroom.id}?page=${page + 1}`}
                   className="rounded border border-neutral-300 px-3 py-1">{c.next}</a>
              )}
            </div>
          </nav>
        </>
      )}
    </TeacherLayout>
  );
}
