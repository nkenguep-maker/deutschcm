// P4.5-B2b3b-a Gate UI Teacher · placeholder distinct pour rôle Teacher
// absent (utilisateur authentifié mais aucun binding Teacher). §4 brief
// distingue ce cas de "feature off" et "anonymous".

import TeacherLayout from "@/components/TeacherLayout";

const COPY = {
  fr: {
    title: "Espace enseignant",
    body: "Votre compte n'est pas encore associé à un espace enseignant. Contactez votre référent pour obtenir un accès.",
  },
  en: {
    title: "Teacher space",
    body: "Your account is not yet linked to a teacher workspace. Please contact your administrator to request access.",
  },
} as const;

export default function TeacherRoleAbsentPlaceholder({ locale }: { locale: string }) {
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
