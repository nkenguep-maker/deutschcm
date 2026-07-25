// P4.5-B2b3b-b1 Student UI · placeholder distinct pour rôle Student absent
// (utilisateur authentifié mais aucun rôle STUDENT/LEARNER ou aucun
// enrollment actif). Symétrique à `TeacherRoleAbsentPlaceholder`.

import StudentLayout from "@/components/student/StudentLayout";

const COPY = {
  fr: {
    title: "Espace devoirs",
    body: "Votre compte n'est pas encore inscrit à un cours. Contactez votre enseignant·e pour rejoindre une classe.",
  },
  en: {
    title: "Assignments space",
    body: "Your account is not yet enrolled in a course. Please contact your teacher to join a class.",
  },
} as const;

export default function StudentRoleAbsentPlaceholder({ locale }: { locale: string }) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  return (
    <StudentLayout locale={locale} title={c.title}>
      <div
        role="status"
        className="mt-8 rounded-2xl p-8 text-center"
        style={{ background: "rgba(232, 216, 190, 0.06)", border: "1px solid var(--brass-edge)" }}
      >
        <h2
          className="font-serif text-2xl"
          style={{ color: "var(--creme)" }}
        >{c.title}</h2>
        <p className="mt-2" style={{ color: "var(--creme-mute)" }}>{c.body}</p>
      </div>
    </StudentLayout>
  );
}
