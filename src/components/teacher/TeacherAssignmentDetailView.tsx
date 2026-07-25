// P4.5-B2b3b-a · Détail assignment Teacher · transitions selon status
// (DRAFT → PATCH/publish / PUBLISHED → close + list submissions /
// CLOSED → readonly). Aucun mock.

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import TeacherLayout from "@/components/TeacherLayout";
import AssignmentStatusBadge from "@/components/teacher/AssignmentStatusBadge";
import type {
  TeacherAssignmentDetailShape,
  TeacherSubmissionListItem,
} from "@/lib/teacher/assignmentsAdapter";

interface Props {
  locale: string;
  assignment: TeacherAssignmentDetailShape;
  submissions: TeacherSubmissionListItem[];
}

const COPY = {
  fr: {
    backToList: "← Retour aux devoirs",
    statusLabel: "Statut",
    dueLabel: "Échéance",
    lastUpdated: "Dernière modification",
    editTitleLabel: "Titre",
    editInstructionsLabel: "Consignes",
    editDueLabel: "Échéance",
    saveDraft: "Sauvegarder",
    publish: "Publier",
    publishConfirm: "Publier ce devoir ? Il deviendra visible pour les étudiants.",
    close: "Fermer le devoir",
    closeConfirm: "Fermer ce devoir ? Aucune nouvelle soumission ne sera possible.",
    submissionsTitle: "Travaux remis",
    noSubmissions: "Aucun travail remis pour le moment.",
    open: "Ouvrir",
    version: "Version",
    submitted: "Envoyé",
    saving: "Enregistrement…",
    publishing: "Publication…",
    closing: "Fermeture…",
    errorGeneric: "L'opération a échoué. Réessayez.",
  },
  en: {
    backToList: "← Back to assignments",
    statusLabel: "Status",
    dueLabel: "Due",
    lastUpdated: "Last updated",
    editTitleLabel: "Title",
    editInstructionsLabel: "Instructions",
    editDueLabel: "Due date",
    saveDraft: "Save",
    publish: "Publish",
    publishConfirm: "Publish this assignment? It becomes visible to students.",
    close: "Close assignment",
    closeConfirm: "Close this assignment? No new submissions will be accepted.",
    submissionsTitle: "Submissions",
    noSubmissions: "No submissions yet.",
    open: "Open",
    version: "Version",
    submitted: "Submitted",
    saving: "Saving…",
    publishing: "Publishing…",
    closing: "Closing…",
    errorGeneric: "Operation failed. Please retry.",
  },
} as const;

export default function TeacherAssignmentDetailView({ locale, assignment, submissions }: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(assignment.title);
  const [instructions, setInstructions] = useState(assignment.instructions ?? "");
  const [dueAt, setDueAt] = useState(assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 10) : "");
  const [error, setError] = useState<string | null>(null);
  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "medium" });

  const isDraft = assignment.status === "DRAFT";
  const isPublished = assignment.status === "PUBLISHED";
  const isClosed = assignment.status === "CLOSED";

  async function saveDraft() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/teacher/assignments/${encodeURIComponent(assignment.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          instructions: instructions.trim() || null,
          dueAt: dueAt || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || c.errorGeneric);
        return;
      }
      router.refresh();
    });
  }
  async function publish() {
    if (!window.confirm(c.publishConfirm)) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/teacher/assignments/${encodeURIComponent(assignment.id)}/publish`, {
        method: "POST", headers: { "content-type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || c.errorGeneric);
        return;
      }
      router.refresh();
    });
  }
  async function close() {
    if (!window.confirm(c.closeConfirm)) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/teacher/assignments/${encodeURIComponent(assignment.id)}/close`, {
        method: "POST", headers: { "content-type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || c.errorGeneric);
        return;
      }
      router.refresh();
    });
  }

  return (
    <TeacherLayout title={assignment.title}>
      <div className="mt-4">
        <Link href={`/${locale}/teacher/assignments`} className="text-sm text-neutral-600 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/30">
          {c.backToList}
        </Link>
      </div>
      <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
        {error && (
          <div role="alert" aria-live="polite" className="mb-4 rounded-lg p-3 text-sm" style={{ border: "1px solid rgba(122,40,48,0.35)", background: "rgba(122,40,48,0.08)", color: "var(--oxblood)" }}>
            {error}
          </div>
        )}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-neutral-500">{c.statusLabel}</dt>
          <dd><AssignmentStatusBadge locale={locale} status={assignment.status} /></dd>
          {assignment.dueDate && (
            <>
              <dt className="text-neutral-500">{c.dueLabel}</dt>
              <dd>{dateFmt.format(new Date(assignment.dueDate))}</dd>
            </>
          )}
          <dt className="text-neutral-500">{c.lastUpdated}</dt>
          <dd>{dateFmt.format(new Date(assignment.updatedAt))}</dd>
        </dl>

        {isDraft ? (
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">{c.editTitleLabel}</span>
              <input
                value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} disabled={pending}
                className="mt-1 block w-full min-h-[44px] rounded-lg border border-neutral-300 bg-white px-3 py-2 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/30"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">{c.editInstructionsLabel}</span>
              <textarea
                rows={5} maxLength={5000} value={instructions} onChange={(e) => setInstructions(e.target.value)} disabled={pending}
                className="mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/30"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">{c.editDueLabel}</span>
              <input
                type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} disabled={pending}
                className="mt-1 block w-full min-h-[44px] rounded-lg border border-neutral-300 bg-white px-3 py-2 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/30"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button" onClick={saveDraft} disabled={pending}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-neutral-900 bg-white px-5 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/30 disabled:opacity-60"
              >
                {pending ? c.saving : c.saveDraft}
              </button>
              <button
                type="button" onClick={publish} disabled={pending}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/30 disabled:opacity-60"
              >
                {pending ? c.publishing : c.publish}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {assignment.instructions && (
              <p className="whitespace-pre-wrap rounded-lg bg-neutral-50 p-3 text-sm text-neutral-800">{assignment.instructions}</p>
            )}
            {isPublished && (
              <div>
                <button
                  type="button" onClick={close} disabled={pending}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-neutral-900 bg-white px-5 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/30 disabled:opacity-60"
                >
                  {pending ? c.closing : c.close}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {(isPublished || isClosed) && (
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="font-serif text-lg text-neutral-900">{c.submissionsTitle}</h3>
          {submissions.length === 0 ? (
            <p role="status" className="mt-3 text-sm text-neutral-600">{c.noSubmissions}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {submissions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/${locale}/teacher/submissions/${s.id}`}
                    className="flex flex-col justify-between rounded-lg border border-neutral-200 p-3 text-sm hover:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/30 sm:flex-row sm:items-center"
                  >
                    <span className="font-medium text-neutral-900">{s.studentFullName}</span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-neutral-600 sm:mt-0">
                      <AssignmentStatusBadge locale={locale} status={s.status} />
                      <span>· {c.version} {s.version}
                      {s.submittedAt ? ` · ${dateFmt.format(new Date(s.submittedAt))}` : ""}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </TeacherLayout>
  );
}
