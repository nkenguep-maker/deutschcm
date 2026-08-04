// P4.5-B2b3b-b1 Student UI · détail devoir Student · affichage
// consignes + statut + échéance + versions du Student courant. Actions ·
// commencer un draft (si aucune version DRAFT existante) · reprendre le
// draft courant · ouvrir une version soumise · créer une nouvelle
// version (si la dernière est SUBMITTED et l'assignment PUBLISHED).

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StudentLayout from "@/components/student/StudentLayout";
import AssignmentStatusBadge from "@/components/teacher/AssignmentStatusBadge";
import WordCounter, { isOverLimit } from "@/components/student/WordCounter";
import type {
  StudentAssignmentDetailShape,
  StudentAssignmentVersion,
} from "@/lib/student/assignmentsAdapter";

interface Props {
  locale: string;
  assignment: StudentAssignmentDetailShape;
}

const COPY = {
  fr: {
    backToList: "← Retour aux devoirs",
    statusLabel: "Statut",
    dueLabel: "Échéance",
    format: "Format",
    writtenFormat: "Texte (écrit)",
    instructions: "Consignes",
    noInstructions: "Aucune consigne fournie.",
    versionsTitle: "Mes versions",
    noVersions: "Aucune version pour le moment.",
    startDraft: "Commencer un brouillon",
    resumeDraft: "Reprendre le brouillon",
    openVersion: "Ouvrir",
    newVersion: "Rédiger une nouvelle version",
    newVersionPlaceholder: "Écrivez votre nouvelle version…",
    saving: "Création…",
    errorGeneric: "L'opération a échoué. Réessayez.",
    versionLabel: "Version",
    submittedLabel: "Envoyé",
    draftLabel: "Brouillon",
    closedNotice: "Ce devoir est fermé · vous ne pouvez plus créer de nouvelle version.",
  },
  en: {
    backToList: "← Back to assignments",
    statusLabel: "Status",
    dueLabel: "Due",
    format: "Format",
    writtenFormat: "Text (written)",
    instructions: "Instructions",
    noInstructions: "No instructions provided.",
    versionsTitle: "My versions",
    noVersions: "No versions yet.",
    startDraft: "Start a draft",
    resumeDraft: "Resume draft",
    openVersion: "Open",
    newVersion: "Write a new version",
    newVersionPlaceholder: "Write your new version…",
    saving: "Creating…",
    errorGeneric: "Operation failed. Please retry.",
    versionLabel: "Version",
    submittedLabel: "Submitted",
    draftLabel: "Draft",
    closedNotice: "This assignment is closed · you can no longer create a new version.",
  },
} as const;

export default function StudentAssignmentDetailView({ locale, assignment }: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newContent, setNewContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "medium" });

  const isPublished = assignment.status === "PUBLISHED";
  const draft = assignment.submissions.find((s) => s.status === "DRAFT") ?? null;
  const submitted = assignment.submissions.filter((s) => s.status === "SUBMITTED");
  const lastSubmitted: StudentAssignmentVersion | null = submitted.length > 0 ? submitted[submitted.length - 1]! : null;

  async function startDraft() {
    if (isOverLimit(newContent)) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(
        `/api/student/assignments/${encodeURIComponent(assignment.id)}/submissions`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ writtenContent: newContent.trim() }),
        },
      );
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        setError(b?.error || c.errorGeneric);
        return;
      }
      const data = await res.json();
      const subId: string | undefined = data?.submission?.id;
      if (subId) router.push(`/${locale}/student/submissions/${subId}`);
      else router.refresh();
    });
  }

  async function createNewVersion() {
    if (isOverLimit(newContent) || !newContent.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(
        `/api/student/submissions/${encodeURIComponent(lastSubmitted!.id)}/versions`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ writtenContent: newContent.trim() }),
        },
      );
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        setError(b?.error || c.errorGeneric);
        return;
      }
      const data = await res.json();
      const subId: string | undefined = data?.submission?.id;
      if (subId) router.push(`/${locale}/student/submissions/${subId}`);
      else router.refresh();
    });
  }

  const canStartDraft = isPublished && !draft && assignment.submissions.length === 0;
  const canCreateNewVersion = isPublished && lastSubmitted !== null && !draft;

  return (
    <StudentLayout locale={locale} title={assignment.title}>
      <div className="mt-2">
        <Link
          href={`/${locale}/student/assignments`}
          className="text-sm focus:outline-none focus:ring-2"
          style={{ color: "var(--creme-mute)" }}
        >{c.backToList}</Link>
      </div>

      <section
        className="mt-4 rounded-2xl p-6"
        style={{ background: "rgba(232, 216, 190, 0.06)", border: "1px solid var(--brass-edge)" }}
      >
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 rounded-lg p-3 text-sm"
            style={{ border: "1px solid rgba(122,40,48,0.35)", background: "rgba(122,40,48,0.08)", color: "var(--oxblood)" }}
          >{error}</div>
        )}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm" style={{ color: "var(--creme-mute)" }}>
          <dt>{c.statusLabel}</dt>
          <dd><AssignmentStatusBadge locale={locale} status={assignment.status} /></dd>
          {assignment.dueDate && (
            <>
              <dt>{c.dueLabel}</dt>
              <dd style={{ color: "var(--creme-soft)" }}>{dateFmt.format(new Date(assignment.dueDate))}</dd>
            </>
          )}
          <dt>{c.format}</dt>
          <dd style={{ color: "var(--creme-soft)" }}>{c.writtenFormat}</dd>
        </dl>

        <h3 className="mt-6 font-serif text-lg" style={{ color: "var(--creme)" }}>{c.instructions}</h3>
        <div
          className="mt-2 whitespace-pre-wrap rounded-lg p-4 text-sm"
          style={{ background: "rgba(232, 216, 190, 0.04)", color: "var(--creme-soft)" }}
        >
          {assignment.instructions ?? c.noInstructions}
        </div>
      </section>

      <section
        className="mt-6 rounded-2xl p-6"
        style={{ background: "rgba(232, 216, 190, 0.06)", border: "1px solid var(--brass-edge)" }}
      >
        <h3 className="font-serif text-lg" style={{ color: "var(--creme)" }}>{c.versionsTitle}</h3>
        {assignment.submissions.length === 0 ? (
          <p role="status" className="mt-3 text-sm" style={{ color: "var(--creme-mute)" }}>{c.noVersions}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {assignment.submissions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/${locale}/student/submissions/${s.id}`}
                  className="flex items-center justify-between rounded-lg p-3 text-sm focus:outline-none focus:ring-2"
                  style={{
                    background: "rgba(232, 216, 190, 0.04)",
                    border: "1px solid var(--brass-edge)",
                    color: "var(--creme-soft)",
                  }}
                >
                  <span>
                    {c.versionLabel} {s.version} · <AssignmentStatusBadge locale={locale} status={s.status} />
                  </span>
                  <span style={{ color: "var(--creme-mute)" }}>
                    {s.submittedAt ? dateFmt.format(new Date(s.submittedAt)) : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {draft && (
          <div className="mt-4">
            <Link
              href={`/${locale}/student/submissions/${draft.id}`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2 text-sm font-medium focus:outline-none focus:ring-2"
              style={{ background: "var(--brass)", color: "var(--espresso)" }}
            >{c.resumeDraft}</Link>
          </div>
        )}

        {canStartDraft && (
          <div className="mt-4">
            <label className="block">
              <span className="text-sm font-medium" style={{ color: "var(--creme)" }}>{c.startDraft}</span>
              <textarea
                rows={5} value={newContent} onChange={(e) => setNewContent(e.target.value)}
                placeholder={c.newVersionPlaceholder} disabled={pending}
                className="mt-1 block w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                style={{
                  background: "rgba(232, 216, 190, 0.04)",
                  border: "1px solid var(--brass-edge)",
                  color: "var(--creme)",
                }}
              />
            </label>
            <div className="mt-2">
              <WordCounter locale={locale} text={newContent} />
            </div>
            <button
              type="button" onClick={startDraft}
              disabled={pending || isOverLimit(newContent) || !newContent.trim()}
              className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2 text-sm font-medium focus:outline-none focus:ring-2 disabled:opacity-60"
              style={{ background: "var(--brass)", color: "var(--espresso)" }}
            >
              {pending ? c.saving : c.startDraft}
            </button>
          </div>
        )}

        {canCreateNewVersion && (
          <div className="mt-4">
            <label className="block">
              <span className="text-sm font-medium" style={{ color: "var(--creme)" }}>{c.newVersion}</span>
              <textarea
                rows={5} value={newContent} onChange={(e) => setNewContent(e.target.value)}
                placeholder={c.newVersionPlaceholder} disabled={pending}
                className="mt-1 block w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                style={{
                  background: "rgba(232, 216, 190, 0.04)",
                  border: "1px solid var(--brass-edge)",
                  color: "var(--creme)",
                }}
              />
            </label>
            <div className="mt-2">
              <WordCounter locale={locale} text={newContent} />
            </div>
            <button
              type="button" onClick={createNewVersion}
              disabled={pending || isOverLimit(newContent) || !newContent.trim()}
              className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2 text-sm font-medium focus:outline-none focus:ring-2 disabled:opacity-60"
              style={{ background: "var(--brass)", color: "var(--espresso)" }}
            >
              {pending ? c.saving : c.newVersion}
            </button>
          </div>
        )}

        {!isPublished && (
          <p className="mt-4 text-sm" style={{ color: "var(--creme-mute)" }}>{c.closedNotice}</p>
        )}
      </section>
    </StudentLayout>
  );
}
