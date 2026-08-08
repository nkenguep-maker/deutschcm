"use client";

// MaisonPorte · la porte du fond. Fin de la landing.
// Une phrase, un titre en Fraunces, un CTA unique vers l'entrée bêta.
// Aucun formulaire ici, aucune promesse commerciale ou chiffrée.

import Link from "next/link";
import { frTypo } from "@/components/landing/typo";

interface Copy {
  kicker: string;
  title: string;
  titleEm: string;
  cta: string;
}

const COPY_FR: Copy = {
  kicker: "La porte du fond",
  title: "La maison se prépare.",
  titleEm: "L’entrée est sur invitation.",
  cta: "Accéder à la bêta",
};

const COPY_EN: Copy = {
  kicker: "The back door",
  title: "The house is getting ready.",
  titleEm: "Entry is by invitation.",
  cta: "Access the beta",
};

export function MaisonPorte({ locale }: { locale: "fr" | "en" }) {
  const c = locale === "en" ? COPY_EN : COPY_FR;
  const t = (s: string) => (locale === "fr" ? frTypo(s) : s);

  return (
    <section className="maison-porte" aria-labelledby="maison-porte-h">
      <div className="maison-container maison-porte-inner">
        <p className="maison-kicker">{t(c.kicker)}</p>
        <h2 id="maison-porte-h" className="maison-porte-h">
          {t(c.title)} <em>{t(c.titleEm)}</em>
        </h2>
        <Link href={`/${locale}/beta`} className="maison-porte-cta">
          {t(c.cta)}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
               stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
               strokeLinejoin="round" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
