// P4.5-B2b3b-b1 Student UI · détail submission Student · lecture contenu
// + édition DRAFT (sauvegarde / soumission) + lecture feedbacks
// PUBLISHED/ADDENDUM. JAMAIS de feedback DRAFT affiché. Allowlist
// stricte côté client · seul `writtenContent` est envoyé.

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StudentLayout from "@/components/student/StudentLayout";
import AssignmentStatusBadge from "@/components/teacher/AssignmentStatusBadge";
import WordCounter, { isOverLimit } from "@/components/student/WordCounter";
import type { StudentSubmissionDetailShape } from "@/lib/student/assignmentsAdapter";

interface Props {
  locale: string;
  submission: StudentSubmissionDetailShape;
}

const COPY = {
  fr: {
    backToAssignment: "← Retour au devoir",
    versionLabel: "Version",
    statusLabel: "Statut",
    contentLabel: "Votre travail",
    contentPlaceholder: "Rédigez votre travail ici…",
    save: "Sauvegarder",
    submit: "Soumettre",
    submitConfirm: "Soumettre ce travail ? Une fois envoyé, il n'est plus modifiable.",
    submittedLabel: "Envoyé le",
    saving: "Enregistrement…",
    submitting: "Envoi…",
    errorGeneric: "L'opération a échoué. Réessayez.",
    feedbackTitle: "Retours du professeur",
    noFeedback: "Aucun retour publié pour le moment.",
    publishedLabel: "Publié",
    addendumLabel: "Complément",
    readonlyNotice: "Ce travail a été soumis · lecture seule.",
    supersededNotice: "Une version plus récente existe pour ce devoir.",
  },
  en: {
    backToAssignment: "← Back to assignment",
    versionLabel: "Version",
    statusLabel: "Status",
    contentLabel: "Your work",
    contentPlaceholder: "Write your work here…",
    save: "Save",
    submit: "Submit",
    submitConfirm: "Submit this work? Once submitted, it cannot be edited.",
    submittedLabel: "Submitted on",
    saving: "Saving…",
    submitting: "Submitting…",
    errorGeneric: "Operation failed. Please retry.",
    feedbackTitle: "Teacher feedback",
    noFeedback: "No feedback published yet.",
    publishedLabel: "Published",
    addendumLabel: "Addendum",
    readonlyNotice: "This work has been submitted · read-only.",
    supersededNotice: "A more recent version exists for this assignment.",
  },
} as const;

export default function StudentSubmissionView({ locale, submission }: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [content, setContent] = useState(submission.writtenContent ?? "");
  const [error, setError] = useState<string | null>(null);
  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "medium", timeStyle: "short" });

  const isDraft = submission.status === "DRAFT";
  const isSubmitted = submission.status === "SUBMITTED";
  const isSuperseded = submission.status === "SUPERSEDED";

  async function saveDraft() {
    if (isOverLimit(content)) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/student/submissions/${encodeURIComponent(submission.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ writtenContent: content }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        setError(b?.error || c.errorGeneric);
        return;
      }
      router.refresh();
    });
  }

  async function submitDraft() {
    if (isOverLimit(content) || !content.trim()) return;
    if (!window.confirm(c.submitConfirm)) return;
    setError(null);
    startTransition(async () => {
      // First persist the current draft content (if changed), then submit.
      const saveRes = await fetch(`/api/student/submissions/${encodeURIComponent(submission.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ writtenContent: content }),
      });
      if (!saveRes.ok) {
        const b = await saveRes.json().catch(() => null);
        setError(b?.error || c.errorGeneric);
        return;
      }
      const submitRes = await fetch(`/api/student/submissions/${encodeURIComponent(submission.id)}/submit`, {
        method: "POST", headers: { "content-type": "application/json" },
      });
      if (!submitRes.ok) {
        const b = await submitRes.json().catch(() => null);
        setError(b?.error || c.errorGeneric);
        return;
      }
      router.refresh();
    });
  }

  return (
    <StudentLayout locale={locale} title={submission.assignmentTitle}>
      <div className="mt-2">
        <Link
          href={`/${locale}/student/assignments/${submission.assignmentId}`}
          className="text-sm focus:outline-none focus:ring-2"
          style={{ color: "var(--creme-mute)" }}
        >{c.backToAssignment}</Link>
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
          <dt>{c.versionLabel}</dt>
          <dd style={{ color: "var(--creme-soft)" }}>{submission.version}</dd>
          <dt>{c.statusLabel}</dt>
          <dd><AssignmentStatusBadge locale={locale} status={submission.status} /></dd>
          {submission.submittedAt && (
            <>
              <dt>{c.submittedLabel}</dt>
              <dd style={{ color: "var(--creme-soft)" }}>{dateFmt.format(new Date(submission.submittedAt))}</dd>
            </>
          )}
        </dl>

        <div className="mt-6">
          {isDraft ? (
            <>
              <label className="block">
                <span className="text-sm font-medium" style={{ color: "var(--creme)" }}>{c.contentLabel}</span>
                <textarea
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={c.contentPlaceholder}
                  disabled={pending}
                  className="mt-1 block w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                  style={{
                    background: "rgba(232, 216, 190, 0.04)",
                    border: "1px solid var(--brass-edge)",
                    color: "var(--creme)",
                  }}
                />
              </label>
              <div className="mt-2">
                <WordCounter locale={locale} text={content} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button" onClick={saveDraft}
                  disabled={pending || isOverLimit(content)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2 text-sm font-medium focus:outline-none focus:ring-2 disabled:opacity-60"
                  style={{ background: "transparent", border: "1px solid var(--brass)", color: "var(--brass)" }}
                >{pending ? c.saving : c.save}</button>
                <button
                  type="button" onClick={submitDraft}
                  disabled={pending || isOverLimit(content) || !content.trim()}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2 text-sm font-medium focus:outline-none focus:ring-2 disabled:opacity-60"
                  style={{ background: "var(--brass)", color: "var(--espresso)" }}
                >{pending ? c.submitting : c.submit}</button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-medium" style={{ color: "var(--creme)" }}>{c.contentLabel}</h3>
              <div
                className="mt-2 whitespace-pre-wrap rounded-lg p-4 text-sm"
                style={{ background: "rgba(232, 216, 190, 0.04)", color: "var(--creme-soft)" }}
              >
                {submission.writtenContent ?? ""}
              </div>
              <p className="mt-3 text-xs" style={{ color: "var(--creme-mute)" }}>
                {isSubmitted ? c.readonlyNotice : isSuperseded ? c.supersededNotice : c.readonlyNotice}
              </p>
            </>
          )}
        </div>
      </section>

      <section
        className="mt-6 rounded-2xl p-6"
        style={{ background: "rgba(232, 216, 190, 0.06)", border: "1px solid var(--brass-edge)" }}
      >
        <h3 className="font-serif text-lg" style={{ color: "var(--creme)" }}>{c.feedbackTitle}</h3>
        {submission.feedbacks.length === 0 ? (
          <p role="status" className="mt-3 text-sm" style={{ color: "var(--creme-mute)" }}>{c.noFeedback}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {submission.feedbacks.map((f) => (
              <li
                key={f.id}
                className="rounded-lg p-3 text-sm"
                style={{ background: "rgba(232, 216, 190, 0.04)", border: "1px solid var(--brass-edge)" }}
              >
                <header className="flex justify-between text-xs" style={{ color: "var(--creme-mute)" }}>
                  <span>{f.status === "ADDENDUM" ? c.addendumLabel : c.publishedLabel} · v{f.version}</span>
                  {f.publishedAt && <time style={{ color: "var(--creme-soft)" }}>{dateFmt.format(new Date(f.publishedAt))}</time>}
                </header>
                <p className="mt-2 whitespace-pre-wrap" style={{ color: "var(--creme-soft)" }}>{f.writtenContent}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </StudentLayout>
  );
}
