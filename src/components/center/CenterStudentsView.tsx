// P4.3a · Vue étudiants Center · tabs active/pending · zéro mock.

import CenterLayout from "@/components/CenterLayout";
import type {
  CenterStudentRow,
  CenterPendingRow,
} from "@/lib/center/queries";

interface Props {
  locale: string;
  center: { name: string; city: string };
  active: { items: CenterStudentRow[]; total: number; page: number; pageSize: number };
  pending: { items: CenterPendingRow[]; total: number; page: number; pageSize: number };
  tab: "active" | "pending";
  query: string;
  classId: string | null;
}

const COPY = {
  fr: {
    title: "Étudiants du centre",
    tabActive: "Actifs", tabPending: "En attente",
    empty: "Aucun étudiant rattaché à ce centre.",
    pendingEmpty: "Aucune inscription en attente.",
    name: "Nom", classroom: "Classe", level: "Niveau", joined: "Ajouté le",
    search: "Rechercher", prev: "← Précédent", next: "Suivant →",
    none: "—",
  },
  en: {
    title: "Center students",
    tabActive: "Active", tabPending: "Pending",
    empty: "No student attached to this center.",
    pendingEmpty: "No pending enrollments.",
    name: "Name", classroom: "Class", level: "Level", joined: "Joined",
    search: "Search", prev: "← Previous", next: "Next →",
    none: "—",
  },
} as const;

export default function CenterStudentsView({ locale, center, active, pending, tab, query, classId }: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  const pageCount = Math.max(1, Math.ceil(active.total / active.pageSize));
  return (
    <CenterLayout title={c.title} centerName={center.name} centerCity={center.city}>
      <nav className="mt-6 flex gap-2 border-b border-neutral-200">
        <a href={`/${locale}/center/students?tab=active`}
          className={`border-b-2 px-3 py-2 text-sm ${tab === "active" ? "border-neutral-900 font-medium" : "border-transparent text-neutral-500"}`}>
          {c.tabActive} ({active.total})
        </a>
        <a href={`/${locale}/center/students?tab=pending`}
          className={`border-b-2 px-3 py-2 text-sm ${tab === "pending" ? "border-neutral-900 font-medium" : "border-transparent text-neutral-500"}`}>
          {c.tabPending} ({pending.total})
        </a>
      </nav>

      {tab === "active" ? (
        <>
          <form className="mt-4 flex gap-2" action={`/${locale}/center/students`}>
            <input type="search" name="query" defaultValue={query} placeholder={c.search}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
            {classId && <input type="hidden" name="classId" value={classId} />}
            <input type="hidden" name="tab" value="active" />
            <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white">{c.search}</button>
          </form>
          {active.items.length === 0 ? (
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
                    {active.items.map((s) => (
                      <tr key={s.id} className="border-t border-neutral-100" data-testid={`student-row-${s.id}`}>
                        <td className="px-4 py-3 font-medium text-neutral-900">{s.fullName}</td>
                        <td className="px-4 py-3 text-neutral-600">{s.classroomName ?? c.none}</td>
                        <td className="px-4 py-3">{s.level ?? c.none}</td>
                        <td className="px-4 py-3 text-neutral-500">
                          {s.joinedAt ? new Date(s.joinedAt).toLocaleDateString(locale) : c.none}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <nav className="mt-4 flex items-center justify-between text-sm text-neutral-600">
                <span>{active.page} / {pageCount} · {active.total} total</span>
                <div className="flex gap-2">
                  {active.page > 1 && <a href={`/${locale}/center/students?tab=active&page=${active.page - 1}${query ? `&query=${encodeURIComponent(query)}` : ""}`} className="rounded border border-neutral-300 px-3 py-1">{c.prev}</a>}
                  {active.page < pageCount && <a href={`/${locale}/center/students?tab=active&page=${active.page + 1}${query ? `&query=${encodeURIComponent(query)}` : ""}`} className="rounded border border-neutral-300 px-3 py-1">{c.next}</a>}
                </div>
              </nav>
            </>
          )}
        </>
      ) : (
        <>
          {pending.items.length === 0 ? (
            <div role="status" className="mt-8 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
              <p className="text-neutral-600">{c.pendingEmpty}</p>
            </div>
          ) : (
            <ul className="mt-6 space-y-2">
              {pending.items.map((p) => (
                <li key={p.id} className="rounded-lg border border-neutral-200 bg-white p-4" data-testid={`pending-row-${p.id}`}>
                  <div className="font-medium text-neutral-900">{p.fromUserFullName}</div>
                  <div className="text-sm text-neutral-500">
                    → {p.toClassroomName} · {new Date(p.createdAt).toLocaleDateString(locale)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </CenterLayout>
  );
}
