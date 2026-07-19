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
  worldTitleEm: string;
  worldPhrase: string;
  worldLink: string;
  sourcesKicker: string;
  sourcesTitle: string;
  sourcesTitleEm: string;
  sourcesPhrase: string;
  sourcesLink: string;
  ariaSeam: string;
}

const COPY_FR: Copy = {
  worldKicker: "Voyage vers le monde",
  worldTitle: "Parlez au",
  worldTitleEm: "monde entier.",
  worldPhrase: "Allemand, anglais, français. Un examen, un visa, une carrière — l'échelle CECRL, pas à pas.",
  worldLink: "Découvrir les langues du monde",
  sourcesKicker: "Retour aux sources",
  sourcesTitle: "Parlez la langue de vos",
  sourcesTitleEm: "ancêtres.",
  sourcesPhrase: "Bassa, wolof, swahili, lingala. Le foyer, le récit, la palabre — l'échelle YEMA, voix d'abord.",
  sourcesLink: "Découvrir les langues africaines",
  ariaSeam: "La couture entre les deux territoires",
};

const COPY_EN: Copy = {
  worldKicker: "A journey outward",
  worldTitle: "Speak to the",
  worldTitleEm: "whole world.",
  worldPhrase: "German, English, French. An exam, a visa, a career — the CEFR scale, step by step.",
  worldLink: "Discover world languages",
  sourcesKicker: "A return to the source",
  sourcesTitle: "Speak the language of your",
  sourcesTitleEm: "ancestors.",
  sourcesPhrase: "Bassa, Wolof, Swahili, Lingala. The home, the story, the palaver — the YEMA scale, voice first.",
  sourcesLink: "Discover African languages",
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
        <h2 className="maison-couture-h">{t(c.worldTitle)} <em>{t(c.worldTitleEm)}</em></h2>
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
        <h2 className="maison-couture-h">{t(c.sourcesTitle)} <em>{t(c.sourcesTitleEm)}</em></h2>
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
