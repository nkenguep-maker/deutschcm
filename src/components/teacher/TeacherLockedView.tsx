// P4.3b · Sous-page verrouillée honnêtement (assignments P4.5, messages P4.6).

import TeacherLayout from "@/components/TeacherLayout";

interface Props {
  locale: string;
  title: string;
  body: string;
}

export default function TeacherLockedView({ locale, title, body }: Props) {
  const isEn = locale === "en";
  const helper = isEn ? "Coming in a later step." : "Bientôt disponible.";
  return (
    <TeacherLayout title={title}>
      <div role="status" className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
        <h2 className="font-serif text-2xl text-neutral-900">{title}</h2>
        <p className="mt-2 text-neutral-600">{body}</p>
        <p className="mt-1 text-sm italic text-neutral-500">{helper}</p>
      </div>
    </TeacherLayout>
  );
}
