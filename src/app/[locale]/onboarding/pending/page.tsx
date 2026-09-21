import Link from "next/link";

const LABELS = {
  teacher: { fr: "Enseignant·e", en: "Teacher" },
  coach: { fr: "Coach Racines", en: "Roots Coach" },
  center_admin: { fr: "Centre", en: "Center" },
  super_admin: { fr: "Administration YEMA", en: "YEMA administration" },
} as const;

export default async function PendingPersonaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ persona?: string }>;
}) {
  const { locale } = await params;
  const { persona } = await searchParams;
  const loc = locale === "en" ? "en" : "fr";
  const label = persona && persona in LABELS
    ? LABELS[persona as keyof typeof LABELS][loc]
    : (loc === "en" ? "Professional space" : "Espace professionnel");

  return (
    <main className="entry-page">
      <div className="entry-main">
        <div className="entry-card entry-card-onboarding">
          <p className="entry-kicker">{label}</p>
          <h1 className="entry-h">
            {loc === "en" ? "Your request is registered." : "Votre demande est enregistrée."}
          </h1>
          <p className="entry-lede">
            {loc === "en"
              ? "Professional permissions are activated only after YEMA verifies the account. Your selected persona is saved and will be used automatically after approval."
              : "Les droits professionnels sont activés uniquement après validation YEMA. Votre persona est enregistré et sera repris automatiquement après approbation."}
          </p>
          <div className="entry-context" role="note">
            <span className="entry-context-dot" aria-hidden="true" />
            <span className="entry-context-text">
              {loc === "en"
                ? "You do not need to create another account. Sign in later with the same confirmed email."
                : "Vous n’avez pas besoin de créer un autre compte. Reconnectez-vous plus tard avec le même e-mail confirmé."}
            </span>
          </div>
          <Link className="entry-cta entry-cta-primary" href={`/${locale}`}>
            {loc === "en" ? "Back to YEMA" : "Retour à YEMA"}
          </Link>
        </div>
      </div>
    </main>
  );
}
