// P4.4 · Sous-page verrouillée honnêtement (activities P4.5, messages P4.6,
// sessions workflow ultérieur).

import RootsCoachLayout from "./RootsCoachLayout";

interface Props {
  locale: string;
  active: "activities" | "messages" | "sessions";
  title: string;
  body: string;
}

export default function RootsCoachLockedView({ locale, active, title, body }: Props) {
  const helper = locale === "en" ? "Coming in a later step." : "Bientôt disponible.";
  return (
    <RootsCoachLayout locale={locale} active={active} title={title}>
      <div role="status" className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
        <p className="text-neutral-700">{body}</p>
        <p className="mt-2 text-sm italic text-neutral-500">{helper}</p>
      </div>
    </RootsCoachLayout>
  );
}
