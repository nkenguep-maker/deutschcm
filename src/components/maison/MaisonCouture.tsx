"use client";

// MaisonCouture · la couture qui structure le scroll de la landing.
// Bloc world (espresso) au-dessus + Seam + bloc sources (terre) en-dessous.
// Chaque bloc : kicker mono, titre Fraunces italique, une phrase, lien /langues.
// Le Seam est le composant existant (dégradé + halo brass au scroll + Y keystone).

import Link from "next/link";
import { Seam } from "@/components/design/Seam";
import { frTypo } from "@/components/landing/typo";

interface Copy {
  worldKicker: string;
  worldTitle: string;
  worldPhrase: string;
  worldLink: string;
  sourcesKicker: string;
  sourcesTitle: string;
  sourcesPhrase: string;
  sourcesLink: string;
  ariaSeam: string;
}

const COPY_FR: Copy = {
  worldKicker: "Voyage vers le monde",
  worldTitle: "Les langues qui ouvrent la porte.",
  worldPhrase: "L'échelle CECRL, de la première salutation au discours nuancé — pour partir, étudier, travailler, se lier.",
  worldLink: "Découvrir les langues étrangères",
  sourcesKicker: "Retour aux sources",
  sourcesTitle: "Les langues qui gardent la mémoire.",
  sourcesPhrase: "L'échelle YEMA en cinq paliers — Écoute, Voix, Récit, Palabre, Foyer — pour parler comme on parle chez soi.",
  sourcesLink: "Découvrir les langues natales",
  ariaSeam: "La couture entre les deux territoires",
};

const COPY_EN: Copy = {
  worldKicker: "A journey outward",
  worldTitle: "The languages that open the door.",
  worldPhrase: "The CEFR scale, from the first greeting to the nuanced discourse — to leave, study, work, connect.",
  worldLink: "Discover foreign languages",
  sourcesKicker: "A return to the source",
  sourcesTitle: "The languages that hold the memory.",
  sourcesPhrase: "The YEMA scale, five stages — Listen, Voice, Story, Palaver, Home — to speak as one speaks at home.",
  sourcesLink: "Discover native languages",
  ariaSeam: "The seam between the two territories",
};

export function MaisonCouture({ locale }: { locale: "fr" | "en" }) {
  const c = locale === "en" ? COPY_EN : COPY_FR;
  const t = (s: string) => (locale === "fr" ? frTypo(s) : s);

  return (
    <section className="maison-couture" aria-label={locale === "en" ? "The two territories" : "Les deux territoires"}>
      {/* Bloc world · espresso */}
      <div className="maison-couture-side maison-couture-world">
        <p className="maison-couture-kicker">{t(c.worldKicker)}</p>
        <h2 className="maison-couture-h">{t(c.worldTitle)}</h2>
        <p className="maison-couture-phrase">{t(c.worldPhrase)}</p>
        <Link href={`/${locale}/langues`} className="maison-couture-link">
          {t(c.worldLink)}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
               stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
               strokeLinejoin="round" aria-hidden="true">
            <path d="M3 7h8M8 3l4 4-4 4" />
          </svg>
        </Link>
      </div>

      {/* La couture · Y keystone + halo au scroll */}
      <Seam ariaLabel={c.ariaSeam} />

      {/* Bloc sources · terre */}
      <div className="maison-couture-side maison-couture-sources">
        <p className="maison-couture-kicker">{t(c.sourcesKicker)}</p>
        <h2 className="maison-couture-h">{t(c.sourcesTitle)}</h2>
        <p className="maison-couture-phrase">{t(c.sourcesPhrase)}</p>
        <Link href={`/${locale}/langues#sources`} className="maison-couture-link">
          {t(c.sourcesLink)}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
               stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
               strokeLinejoin="round" aria-hidden="true">
            <path d="M3 7h8M8 3l4 4-4 4" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
