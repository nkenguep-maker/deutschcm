// P4.3a · Placeholder honnête quand `CENTER_REAL_DATA_ENABLED=false`.
// Pas de mock, pas de fausse promesse · juste "Bientôt disponible".

import CenterLayout from "@/components/CenterLayout";

const COPY = {
  fr: { title: "Espace Centre", body: "Bientôt disponible. Les données réelles de ton centre seront branchées ici prochainement." },
  en: { title: "Center Space", body: "Coming soon. Your center's real data will be connected here." },
} as const;

export default function CenterFeaturePlaceholder({ locale }: { locale: string }) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  return (
    <CenterLayout title={c.title}>
      <div role="status" className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
        <h2 className="font-serif text-2xl text-neutral-900">{c.title}</h2>
        <p className="mt-2 text-neutral-600">{c.body}</p>
      </div>
    </CenterLayout>
  );
}
