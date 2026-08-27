"use client";

// MaisonPorte · la porte du fond. Fin de la landing.
// CTA unique vers l'inscription canonique. Si la bêta fermée est activée,
// le layout /register applique lui-même le gate serveur vers /beta.

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
  title: "Votre parcours commence ici.",
  titleEm: "Choisissez ensuite votre espace YEMA.",
  cta: "S’inscrire",
};

const COPY_EN: Copy = {
  kicker: "The back door",
  title: "Your journey starts here.",
  titleEm: "Then choose your YEMA space.",
  cta: "Sign up",
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
