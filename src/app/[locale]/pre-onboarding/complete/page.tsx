"use client";

import { ArrowRight, MailCheck } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BrandY } from "@/components/brand/BrandY";
import { SeuilGreetings } from "@/components/seuil/SeuilGreeting";
import { sanitizeInternalNext } from "@/lib/authRedirect";

const COPY = {
  fr: {
    kicker: "Parcours préparé",
    title: "Votre parcours est prêt.",
    body: "Confirmez maintenant votre adresse e-mail. Le lien reçu vous ramènera automatiquement ici pour enregistrer votre choix et ouvrir votre espace.",
    help: "Votre parcours reste enregistré sur cet appareil pendant sept jours.",
    continue: "J’ai confirmé mon adresse",
    home: "Revenir à l’accueil",
  },
  en: {
    kicker: "Journey prepared",
    title: "Your journey is ready.",
    body: "Now confirm your email address. The link you received will automatically bring you back to save your choice and open your space.",
    help: "Your journey stays saved on this device for seven days.",
    continue: "I confirmed my email",
    home: "Return home",
  },
} as const;

export default function PreconfirmationCompletePage() {
  const locale = useLocale();
  const loc = locale === "en" ? "en" : "fr";
  const searchParams = useSearchParams();
  const c = COPY[loc];

  const intentParams = new URLSearchParams();
  const selectedPlan = searchParams.get("plan");
  const selectedAddon = searchParams.get("addon");
  const teacherAddonRequested = searchParams.get("prof") === "1";
  const postOnboardingNext = searchParams.get("next");
  if (selectedPlan) intentParams.set("plan", selectedPlan);
  if (selectedAddon) intentParams.set("addon", selectedAddon);
  if (teacherAddonRequested) intentParams.set("prof", "1");
  if (postOnboardingNext) {
    intentParams.set(
      "next",
      sanitizeInternalNext(postOnboardingNext, `/${locale}/dashboard`),
    );
  }

  const intentQuery = intentParams.toString();
  const personaRoute = `/${locale}/onboarding/persona${intentQuery ? `?${intentQuery}` : ""}`;
  const loginHref = `/${locale}/login?next=${encodeURIComponent(personaRoute)}`;

  return (
    <div className="entry-page">
      <SeuilGreetings locale={loc} visibleCount={3} pool="all" variant="entry" />
      <header className="entry-header">
        <Link href={`/${locale}`} className="entry-brand" aria-label="YEMA">
          <BrandY variant="world" state="static" size={36} />
        </Link>
      </header>

      <main className="entry-main">
        <div className="entry-card">
          <div className="entry-success">
            <MailCheck className="entry-success-icon" size={32} strokeWidth={1.5} aria-hidden="true" />
            <p className="entry-kicker">{c.kicker}</p>
            <h1 className="entry-h">{c.title}</h1>
            <p className="entry-lede">{c.body}</p>
            <p className="entry-success-help">{c.help}</p>
            <div className="entry-success-actions">
              <Link href={loginHref} className="entry-cta entry-cta-primary">
                {c.continue}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link href={`/${locale}`} className="entry-cta entry-cta-ghost">{c.home}</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
