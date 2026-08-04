// P4.5-B2b3b-a · Formulaire création assignment Teacher.
// Allowlist strict client-side · title/instructions/dueAt. Aucun status/
// classroomId/teacherId envoyé (classroomId vient du path).

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import TeacherLayout from "@/components/TeacherLayout";
import type { TeacherClassRow } from "@/lib/teacher/queries";

interface Props {
  locale: string;
  classrooms: TeacherClassRow[];
  presetClassroomId: string | null;
}

const COPY = {
  fr: {
    title: "Nouveau devoir",
    classLabel: "Classe",
    titleLabel: "Titre du devoir",
    instructionsLabel: "Consignes",
    instructionsHelp: "Optionnel. 5 000 caractères maximum.",
    dueLabel: "Échéance (optionnel)",
    submissionFormatLabel: "Format attendu",
    submissionFormatWritten: "Texte (écrit)",
    submissionFormatAudioLocked: "Audio · non disponible (bêta)",
    save: "Créer le brouillon",
    saving: "Création…",
    successToast: "Brouillon créé.",
    errors: {
      titleRequired: "Le titre est obligatoire.",
      titleTooLong: "Le titre doit faire 200 caractères ou moins.",
      classroomRequired: "Aucune classe sélectionnée.",
      generic: "La création a échoué. Réessayez.",
    },
  },
  en: {
    title: "New assignment",
    classLabel: "Class",
    titleLabel: "Assignment title",
    instructionsLabel: "Instructions",
    instructionsHelp: "Optional. 5,000 characters maximum.",
    dueLabel: "Due date (optional)",
    submissionFormatLabel: "Expected format",
    submissionFormatWritten: "Text (written)",
    submissionFormatAudioLocked: "Audio · unavailable (beta)",
    save: "Save draft",
    saving: "Saving…",
    successToast: "Draft created.",
    errors: {
      titleRequired: "Title is required.",
      titleTooLong: "Title must be 200 characters or less.",
      classroomRequired: "No class selected.",
      generic: "Creation failed. Please retry.",
    },
  },
} as const;

export default function TeacherAssignmentCreateView({
  locale, classrooms, presetClassroomId,
}: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [classroomId, setClassroomId] = useState(presetClassroomId ?? classrooms[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!classroomId) { setError(c.errors.classroomRequired); return; }
    if (!title.trim()) { setError(c.errors.titleRequired); return; }
    if (title.trim().length > 200) { setError(c.errors.titleTooLong); return; }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/teacher/classes/${encodeURIComponent(classroomId)}/assignments`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            instructions: instructions.trim() || undefined,
            dueAt: dueAt || undefined,
            submissionFormat: "WRITTEN",
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(body?.error || c.errors.generic);
          return;
        }
        const data = await res.json();
        router.push(`/${locale}/teacher/assignments/${encodeURIComponent(data.assignment.id)}`);
      } catch { setError(c.errors.generic); }
    });
  }

  return (
    <TeacherLayout title={c.title}>
      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        {error && (
          <div role="alert" aria-live="polite" className="rounded-lg p-3 text-sm" style={{ border: "1px solid rgba(122,40,48,0.35)", background: "rgba(122,40,48,0.08)", color: "var(--oxblood)" }}>
            {error}
          </div>
        )}
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">{c.classLabel}</span>
          <select
            required
            value={classroomId}
            onChange={(e) => setClassroomId(e.target.value)}
            disabled={pending}
            className="mt-1 block w-full min-h-[44px] rounded-lg border border-neutral-300 bg-white px-3 py-2 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/30"
          >
            {classrooms.map((cr) => (
              <option key={cr.id} value={cr.id}>{cr.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">{c.titleLabel}</span>
          <input
            required maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={pending}
            className="mt-1 block w-full min-h-[44px] rounded-lg border border-neutral-300 bg-white px-3 py-2 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/30"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">{c.instructionsLabel}</span>
          <textarea
            rows={4} maxLength={5000}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            disabled={pending}
            className="mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/30"
          />
          <span className="mt-1 block text-xs text-neutral-500">{c.instructionsHelp}</span>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">{c.dueLabel}</span>
          <input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            disabled={pending}
            className="mt-1 block w-full min-h-[44px] rounded-lg border border-neutral-300 bg-white px-3 py-2 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/30"
          />
        </label>
        <fieldset className="block">
          <legend className="text-sm font-medium text-neutral-700">{c.submissionFormatLabel}</legend>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2 text-sm text-neutral-900">
              <input type="radio" checked readOnly className="h-4 w-4" />
              {c.submissionFormatWritten}
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              <input type="radio" disabled className="h-4 w-4" />
              {c.submissionFormatAudioLocked}
            </label>
          </div>
        </fieldset>
        <button
          type="submit" disabled={pending}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/30 disabled:opacity-60"
        >
          {pending ? c.saving : c.save}
        </button>
      </form>
    </TeacherLayout>
  );
}
