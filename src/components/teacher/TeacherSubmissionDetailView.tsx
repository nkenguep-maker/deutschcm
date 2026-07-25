// P4.5-B2b3b-a · Détail submission Teacher · lecture contenu + feedback
// draft/publish/addendum via routes réelles.

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import TeacherLayout from "@/components/TeacherLayout";
import AssignmentStatusBadge from "@/components/teacher/AssignmentStatusBadge";
import type { TeacherSubmissionDetailShape } from "@/lib/teacher/assignmentsAdapter";

interface Props {
  locale: string;
  submission: TeacherSubmissionDetailShape;
}

const COPY = {
  fr: {
    backToAssignment: "← Retour au devoir",
    studentLabel: "Étudiant",
    versionLabel: "Version",
    statusLabel: "Statut",
    submittedLabel: "Envoyé le",
    contentLabel: "Contenu remis",
    noContent: "Aucun contenu écrit.",
    feedbackTitle: "Retours",
    noFeedback: "Aucun retour rédigé pour le moment.",
    draftLabel: "Brouillon",
    draftContent: "Votre brouillon",
    save: "Sauvegarder",
    publish: "Publier",
    publishConfirm: "Publier ce retour ? Il deviendra visible pour l'étudiant.",
    createDraft: "Créer un retour",
    createDraftEmpty: "Rédigez le retour du professeur…",
    addendum: "Ajouter un complément",
    addendumPlaceholder: "Rédigez un complément…",
    published: "Publié",
    addendumStatus: "Complément",
    errorGeneric: "L'opération a échoué. Réessayez.",
    saving: "Enregistrement…",
    publishing: "Publication…",
    creating: "Création…",
  },
  en: {
    backToAssignment: "← Back to assignment",
    studentLabel: "Student",
    versionLabel: "Version",
    statusLabel: "Status",
    submittedLabel: "Submitted on",
    contentLabel: "Submitted content",
    noContent: "No written content.",
    feedbackTitle: "Teacher feedback",
    noFeedback: "No feedback written yet.",
    draftLabel: "Draft",
    draftContent: "Your draft",
    save: "Save",
    publish: "Publish",
    publishConfirm: "Publish this feedback? It becomes visible to the student.",
    createDraft: "Create feedback draft",
    createDraftEmpty: "Write the teacher feedback…",
    addendum: "Add addendum",
    addendumPlaceholder: "Write an addendum…",
    published: "Published",
    addendumStatus: "Addendum",
    errorGeneric: "Operation failed. Please retry.",
    saving: "Saving…",
    publishing: "Publishing…",
    creating: "Creating…",
  },
} as const;

export default function TeacherSubmissionDetailView({ locale, submission }: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "medium", timeStyle: "short" });

  const draftFb = submission.feedbacks.find((f) => f.status === "DRAFT") ?? null;
  const publishedFb = submission.feedbacks.filter((f) => f.status === "PUBLISHED" || f.status === "ADDENDUM");
  const lastPublished = publishedFb.length > 0 ? publishedFb[publishedFb.length - 1]! : null;

  const [draftContent, setDraftContent] = useState(draftFb?.writtenContent ?? "");
  const [addendumContent, setAddendumContent] = useState("");
  const [newDraftContent, setNewDraftContent] = useState("");

  async function saveDraft() {
    if (!draftFb) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/teacher/feedback/${encodeURIComponent(draftFb.id)}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ writtenContent: draftContent }),
      });
      if (!res.ok) { const b = await res.json().catch(() => null); setError(b?.error || c.errorGeneric); return; }
      router.refresh();
    });
  }
  async function publishDraft() {
    if (!draftFb) return;
    if (!window.confirm(c.publishConfirm)) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/teacher/feedback/${encodeURIComponent(draftFb.id)}/publish`, {
        method: "POST", headers: { "content-type": "application/json" },
      });
      if (!res.ok) { const b = await res.json().catch(() => null); setError(b?.error || c.errorGeneric); return; }
      router.refresh();
    });
  }
  async function createDraftFb() {
    setError(null);
    if (!newDraftContent.trim()) return;
    startTransition(async () => {
      const res = await fetch(`/api/teacher/submissions/${encodeURIComponent(submission.id)}/feedback`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ writtenContent: newDraftContent.trim() }),
      });
      if (!res.ok) { const b = await res.json().catch(() => null); setError(b?.error || c.errorGeneric); return; }
      router.refresh();
    });
  }
  async function addAddendum() {
    if (!lastPublished) return;
    setError(null);
    if (!addendumContent.trim()) return;
    startTransition(async () => {
      const res = await fetch(`/api/teacher/feedback/${encodeURIComponent(lastPublished.id)}/addendum`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ writtenContent: addendumContent.trim() }),
      });
      if (!res.ok) { const b = await res.json().catch(() => null); setError(b?.error || c.errorGeneric); return; }
      setAddendumContent("");
      router.refresh();
    });
  }

  return (
    <TeacherLayout title={submission.assignmentTitle}>
      <div className="mt-4">
        <Link href={`/${locale}/teacher/assignments/${submission.assignmentId}`} className="text-sm text-neutral-600 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/30">
          {c.backToAssignment}
        </Link>
      </div>
      <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
        {error && (
          <div role="alert" aria-live="polite" className="mb-4 rounded-lg p-3 text-sm" style={{ border: "1px solid rgba(122,40,48,0.35)", background: "rgba(122,40,48,0.08)", color: "var(--oxblood)" }}>{error}</div>
        )}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-neutral-500">{c.studentLabel}</dt>
          <dd className="font-medium text-neutral-900">{submission.studentFullName}</dd>
          <dt className="text-neutral-500">{c.versionLabel}</dt>
          <dd>{submission.version}</dd>
          <dt className="text-neutral-500">{c.statusLabel}</dt>
          <dd><AssignmentStatusBadge locale={locale} status={submission.status} /></dd>
          {submission.submittedAt && (
            <>
              <dt className="text-neutral-500">{c.submittedLabel}</dt>
              <dd>{dateFmt.format(new Date(submission.submittedAt))}</dd>
            </>
          )}
        </dl>
        <div className="mt-4">
          <h3 className="text-sm font-medium text-neutral-700">{c.contentLabel}</h3>
          <div className="mt-2 whitespace-pre-wrap rounded-lg bg-neutral-50 p-4 text-sm text-neutral-800">
            {submission.writtenContent ?? c.noContent}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="font-serif text-lg text-neutral-900">{c.feedbackTitle}</h3>

        {publishedFb.length === 0 && !draftFb && (
          <p role="status" className="mt-3 text-sm text-neutral-600">{c.noFeedback}</p>
        )}

        {publishedFb.map((f) => (
          <article key={f.id} className="mt-4 rounded-lg border border-neutral-200 p-3 text-sm">
            <header className="flex justify-between text-xs text-neutral-500">
              <span>{f.status === "ADDENDUM" ? c.addendumStatus : c.published} · v{f.version}</span>
              {f.publishedAt && <time>{dateFmt.format(new Date(f.publishedAt))}</time>}
            </header>
            <p className="mt-2 whitespace-pre-wrap text-neutral-800">{f.writtenContent}</p>
          </article>
        ))}

        {draftFb ? (
          <div
            className="mt-4 rounded-lg p-3"
            style={{ borderWidth: 1, borderStyle: "solid", borderColor: "var(--brass-edge)", background: "var(--brass-glow)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--brass-deep)" }}>{c.draftLabel}</p>
            <label className="mt-2 block">
              <span className="text-sm font-medium text-neutral-700">{c.draftContent}</span>
              <textarea
                rows={4} value={draftContent} onChange={(e) => setDraftContent(e.target.value)} disabled={pending}
                className="mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/30"
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={saveDraft} disabled={pending}
                className="min-h-[44px] rounded-lg border border-neutral-900 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60">
                {pending ? c.saving : c.save}
              </button>
              <button type="button" onClick={publishDraft} disabled={pending}
                className="min-h-[44px] rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
                {pending ? c.publishing : c.publish}
              </button>
            </div>
          </div>
        ) : (
          submission.status === "SUBMITTED" && (
            <div className="mt-4 rounded-lg border border-neutral-200 p-3">
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">{c.createDraft}</span>
                <textarea
                  rows={4} value={newDraftContent} onChange={(e) => setNewDraftContent(e.target.value)} placeholder={c.createDraftEmpty} disabled={pending}
                  className="mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/30"
                />
              </label>
              <button type="button" onClick={createDraftFb} disabled={pending || !newDraftContent.trim()}
                className="mt-3 min-h-[44px] rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
                {pending ? c.creating : c.createDraft}
              </button>
            </div>
          )
        )}

        {lastPublished && (
          <div className="mt-4 rounded-lg border border-neutral-200 p-3">
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">{c.addendum}</span>
              <textarea
                rows={3} value={addendumContent} onChange={(e) => setAddendumContent(e.target.value)} placeholder={c.addendumPlaceholder} disabled={pending}
                className="mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/30"
              />
            </label>
            <button type="button" onClick={addAddendum} disabled={pending || !addendumContent.trim()}
              className="mt-3 min-h-[44px] rounded-lg border border-neutral-900 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60">
              {pending ? c.creating : c.addendum}
            </button>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
