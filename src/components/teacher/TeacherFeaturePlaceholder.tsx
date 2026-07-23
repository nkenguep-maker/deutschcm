// P4.3b · Placeholder honnête quand `TEACHER_WORKSPACE_ENABLED=false`.

import TeacherLayout from "@/components/TeacherLayout";

const COPY = {
  fr: {
    title: "Espace enseignant",
    body: "Bientôt disponible. Les données réelles de votre espace enseignant seront branchées ici prochainement.",
  },
  en: {
    title: "Teacher space",
    body: "Coming soon. Your teacher workspace data will be connected here.",
  },
} as const;

export default function TeacherFeaturePlaceholder({ locale }: { locale: string }) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  return (
    <TeacherLayout title={c.title}>
      <div role="status" className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
        <h2 className="font-serif text-2xl text-neutral-900">{c.title}</h2>
        <p className="mt-2 text-neutral-600">{c.body}</p>
      </div>
    </TeacherLayout>
  );
}
