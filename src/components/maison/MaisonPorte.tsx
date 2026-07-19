"use client";

// MaisonPorte · la porte du fond. Fin de la landing.
// Une phrase, un titre en Fraunces, un CTA unique brass vers /register.
// Aucun formulaire ici, aucune promesse chiffrée. Une porte ouverte.

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
  title: "Entrez.",
  titleEm: "La maison est ouverte.",
  cta: "Commencer, gratuitement",
};

const COPY_EN: Copy = {
  kicker: "The back door",
  title: "Come in.",
  titleEm: "The house is open.",
  cta: "Start, free",
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
        <Link href={`/${locale}/register`} className="maison-porte-cta">
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
