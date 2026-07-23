// P4.4 · Placeholder honnête quand `COACH_WORKSPACE_ENABLED=false` ou
// `ROOTS_COACH_RLS_CONFIRMED=false` en production.

const COPY = {
  fr: { title: "Suivi Racines · espace coach", body: "Bientôt disponible. L'espace Coach Racines sera branché ici prochainement." },
  en: { title: "Racines Follow-up · coach space", body: "Coming soon. The Racines Coach workspace will be connected here." },
} as const;

export default function RootsCoachFeaturePlaceholder({ locale }: { locale: string }) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div role="status" className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="font-serif text-2xl text-neutral-900">{c.title}</h1>
        <p className="mt-2 text-neutral-600">{c.body}</p>
      </div>
    </main>
  );
}
