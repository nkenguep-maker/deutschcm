// P4.5-B2b3b-b1 Student UI · liste devoirs Student. Affiche uniquement
// PUBLISHED/CLOSED (jamais DRAFT). Enrollments actifs uniquement (garanti
// par le service B1).

"use client";

import Link from "next/link";
import StudentLayout from "@/components/student/StudentLayout";
import AssignmentStatusBadge from "@/components/teacher/AssignmentStatusBadge";
import type { StudentAssignmentListItem } from "@/lib/student/assignmentsAdapter";

interface Props {
  locale: string;
  assignments: StudentAssignmentListItem[];
}

const COPY = {
  fr: {
    title: "Mes devoirs",
    empty: "Aucun devoir publié pour le moment.",
    dueLabel: "Échéance",
    statusLabel: "Statut",
    open: "Ouvrir",
  },
  en: {
    title: "My assignments",
    empty: "No published assignments yet.",
    dueLabel: "Due",
    statusLabel: "Status",
    open: "Open",
  },
} as const;

export default function StudentAssignmentsView({ locale, assignments }: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "medium" });

  return (
    <StudentLayout locale={locale} title={c.title}>
      {assignments.length === 0 ? (
        <div
          role="status"
          className="mt-8 rounded-2xl p-8 text-center"
          style={{ background: "rgba(232, 216, 190, 0.06)", border: "1px solid var(--brass-edge)" }}
        >
          <p style={{ color: "var(--creme-mute)" }}>{c.empty}</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((a) => (
            <li key={a.id}>
              <Link
                href={`/${locale}/student/assignments/${a.id}`}
                className="block rounded-2xl p-5 transition hover:opacity-90 focus:outline-none focus:ring-2"
                style={{
                  background: "rgba(232, 216, 190, 0.06)",
                  border: "1px solid var(--brass-edge)",
                }}
              >
                <h3
                  className="font-serif text-lg"
                  style={{ color: "var(--creme)" }}
                >{a.title}</h3>
                <dl
                  className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs"
                  style={{ color: "var(--creme-mute)" }}
                >
                  <dt>{c.statusLabel}</dt>
                  <dd><AssignmentStatusBadge locale={locale} status={a.status} /></dd>
                  {a.dueDate && (
                    <>
                      <dt>{c.dueLabel}</dt>
                      <dd style={{ color: "var(--creme-soft)" }}>{dateFmt.format(new Date(a.dueDate))}</dd>
                    </>
                  )}
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </StudentLayout>
  );
}
