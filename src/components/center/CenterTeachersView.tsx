// P4.3a · Vue liste enseignants Center · pagination + search · zéro mock.

import CenterLayout from "@/components/CenterLayout";
import type { CenterTeacherRow } from "@/lib/center/queries";

interface Props {
  locale: string;
  center: { name: string; city: string };
  items: CenterTeacherRow[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
}

const COPY = {
  fr: {
    title: "Enseignants du centre",
    empty: "Aucun enseignant n'est encore rattaché à ce centre.",
    fullName: "Nom",
    speciality: "Spécialité",
    classes: "Classes",
    students: "Étudiants",
    status: "Statut",
    verified: "Vérifié",
    pending: "En attente",
    joined: "Ajouté le",
    search: "Rechercher",
    prev: "← Précédent",
    next: "Suivant →",
  },
  en: {
    title: "Center teachers",
    empty: "No teacher is attached to this center yet.",
    fullName: "Name",
    speciality: "Specialty",
    classes: "Classes",
    students: "Students",
    status: "Status",
    verified: "Verified",
    pending: "Pending",
    joined: "Joined",
    search: "Search",
    prev: "← Previous",
    next: "Next →",
  },
} as const;

export default function CenterTeachersView({ locale, center, items, total, page, pageSize, query }: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return (
    <CenterLayout title={c.title} centerName={center.name} centerCity={center.city}>
      <form className="mt-6 flex gap-2" action={`/${locale}/center/teachers`}>
        <input
          type="search" name="query" defaultValue={query}
          placeholder={c.search}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white">
          {c.search}
        </button>
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
                  <th className="px-4 py-3">{c.fullName}</th>
                  <th className="px-4 py-3">{c.speciality}</th>
                  <th className="px-4 py-3">{c.classes}</th>
                  <th className="px-4 py-3">{c.students}</th>
                  <th className="px-4 py-3">{c.status}</th>
                  <th className="px-4 py-3">{c.joined}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id} className="border-t border-neutral-100" data-testid={`teacher-row-${t.id}`}>
                    <td className="px-4 py-3 font-medium text-neutral-900">{t.fullName}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {t.speciality.join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3">{t.classroomCount}</td>
                    <td className="px-4 py-3">{t.activeStudentCount}</td>
                    <td className="px-4 py-3">
                      <span className={t.isVerified ? "text-emerald-700" : "text-neutral-500"}>
                        {t.isVerified ? c.verified : c.pending}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(t.createdAt).toLocaleDateString(locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav className="mt-4 flex items-center justify-between text-sm text-neutral-600">
            <span>
              {page} / {pageCount} · {total} total
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`/${locale}/center/teachers?page=${page - 1}${query ? `&query=${encodeURIComponent(query)}` : ""}`}
                  className="rounded border border-neutral-300 px-3 py-1"
                >
                  {c.prev}
                </a>
              )}
              {page < pageCount && (
                <a
                  href={`/${locale}/center/teachers?page=${page + 1}${query ? `&query=${encodeURIComponent(query)}` : ""}`}
                  className="rounded border border-neutral-300 px-3 py-1"
                >
                  {c.next}
                </a>
              )}
            </div>
          </nav>
        </>
      )}
    </CenterLayout>
  );
}
