// P4.5-B2b3b-a · Liste assignments Teacher par classroom · zéro mock.
// États couverts · empty, published/draft/closed markers, loading (SSR),
// forbidden (via redirection page route). Aucun mock. FR/EN via COPY.

"use client";

import Link from "next/link";
import { useState } from "react";
import TeacherLayout from "@/components/TeacherLayout";
import type { TeacherClassRow } from "@/lib/teacher/queries";
import type { TeacherAssignmentRow } from "@/lib/teacher/queries";

interface Props {
  locale: string;
  classrooms: TeacherClassRow[];
  selectedClassroomId: string | null;
  assignments: TeacherAssignmentRow[];
}

const COPY = {
  fr: {
    title: "Devoirs",
    pickClassroom: "Choisir une classe",
    noClassrooms: "Aucune classe active.",
    noAssignments: "Aucun devoir dans cette classe pour le moment.",
    createNew: "Créer un devoir",
    statusLabel: "Statut",
    dueLabel: "Échéance",
    lastUpdated: "Dernière modification",
    open: "Ouvrir",
    statuses: {
      DRAFT: "Brouillon", PUBLISHED: "Publié",
      CLOSED: "Fermé", ARCHIVED: "Archivé",
    },
  },
  en: {
    title: "Assignments",
    pickClassroom: "Select a class",
    noClassrooms: "No active class.",
    noAssignments: "No assignments in this class yet.",
    createNew: "Create an assignment",
    statusLabel: "Status",
    dueLabel: "Due",
    lastUpdated: "Last updated",
    open: "Open",
    statuses: {
      DRAFT: "Draft", PUBLISHED: "Published",
      CLOSED: "Closed", ARCHIVED: "Archived",
    },
  },
} as const;

export default function TeacherAssignmentsView({
  locale, classrooms, selectedClassroomId, assignments,
}: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  const [selectedId, setSelectedId] = useState(selectedClassroomId ?? "");
  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "medium" });

  return (
    <TeacherLayout title={c.title}>
      <div className="mt-6 space-y-6">
        {classrooms.length === 0 ? (
          <div role="status" className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-neutral-600">{c.noClassrooms}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <label className="flex flex-col text-sm text-neutral-700 sm:flex-row sm:items-center sm:gap-3">
                <span className="font-medium">{c.pickClassroom}</span>
                <select
                  value={selectedId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedId(v);
                    window.location.href = `/${locale}/teacher/assignments?classroomId=${encodeURIComponent(v)}`;
                  }}
                  className="mt-2 min-h-[44px] rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/30 sm:mt-0"
                >
                  {classrooms.map((cr) => (
                    <option key={cr.id} value={cr.id}>{cr.name}</option>
                  ))}
                </select>
              </label>
              {selectedId && (
                <Link
                  href={`/${locale}/teacher/assignments/new?classroomId=${encodeURIComponent(selectedId)}`}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/30"
                >
                  {c.createNew}
                </Link>
              )}
            </div>

            {assignments.length === 0 ? (
              <div role="status" className="rounded-2xl bg-white p-8 text-center shadow-sm">
                <p className="text-neutral-600">{c.noAssignments}</p>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {assignments.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/${locale}/teacher/assignments/${a.id}`}
                      className="block rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-neutral-900/30"
                    >
                      <h3 className="font-serif text-lg text-neutral-900">{a.title}</h3>
                      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-neutral-600">
                        <dt className="text-neutral-500">{c.statusLabel}</dt>
                        <dd className={statusClass(a.status)}>{c.statuses[a.status]}</dd>
                        {a.dueDate && (
                          <>
                            <dt className="text-neutral-500">{c.dueLabel}</dt>
                            <dd>{dateFmt.format(new Date(a.dueDate))}</dd>
                          </>
                        )}
                        <dt className="text-neutral-500">{c.lastUpdated}</dt>
                        <dd>{dateFmt.format(new Date(a.updatedAt))}</dd>
                      </dl>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </TeacherLayout>
  );
}

function statusClass(status: string): string {
  switch (status) {
    case "DRAFT": return "font-medium text-amber-700";
    case "PUBLISHED": return "font-medium text-emerald-700";
    case "CLOSED": return "font-medium text-neutral-500";
    case "ARCHIVED": return "font-medium text-neutral-400";
    default: return "text-neutral-700";
  }
}
