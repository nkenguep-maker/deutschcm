// P4.5-B2b3b-b1 Student UI · placeholder honnête quand
// `YEMA_ASSIGNMENTS_ENABLED=false`. Symétrique à `TeacherFeaturePlaceholder`.

import StudentLayout from "@/components/student/StudentLayout";

const COPY = {
  fr: {
    title: "Espace devoirs",
    body: "Bientôt disponible. Les devoirs de vos cours apparaîtront ici prochainement.",
  },
  en: {
    title: "Assignments space",
    body: "Coming soon. Your course assignments will appear here.",
  },
} as const;

export default function StudentFeaturePlaceholder({ locale }: { locale: string }) {
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
