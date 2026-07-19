"use client";

// MaisonEchelle · les deux échelles côte à côte.
// À gauche : CefrSpine (A1→C1) sur fond espresso.
// À droite : YemaSpine (É1→É5) sur fond terre.
// Le hover révèle les compétences concrètes du palier.
//
// Le paint au scroll est déjà géré par CSS custom prop --spine-paint
// dans le CSS existant (§ animation IntersectionObserver via
// spine-paint-observer). Ici on pose juste la structure.

import Link from "next/link";
import { CefrSpine } from "@/components/landing/CefrSpine";
import { YemaSpine } from "@/components/landing/YemaSpine";
import { frTypo } from "@/components/landing/typo";

interface Copy {
  kicker: string;
  title: string;
  titleEm: string;
  phrase: string;
  worldCap: string;
  sourcesCap: string;
  linkLangues: string;
}

const COPY_FR: Copy = {
  kicker: "L'échelle",
  title: "Chaque palier",
  titleEm: "est une compétence réelle.",
  phrase: "Survolez : le design vous montre où vous allez. Pas des étoiles — des choses que vous saurez faire.",
  worldCap: "CECRL · le voyage extérieur",
  sourcesCap: "YEMA · le retour intérieur",
  linkLangues: "Voir toutes les langues",
};

const COPY_EN: Copy = {
  kicker: "The scale",
  title: "Each stage",
  titleEm: "is a real skill.",
  phrase: "Hover: the design shows you where you're going. Not stars — things you'll actually do.",
  worldCap: "CEFR · the outward journey",
  sourcesCap: "YEMA · the inward return",
  linkLangues: "See all languages",
};

export function MaisonEchelle({ locale }: { locale: "fr" | "en" }) {
  const c = locale === "en" ? COPY_EN : COPY_FR;
  const t = (s: string) => (locale === "fr" ? frTypo(s) : s);

  return (
    <section className="maison-echelle" aria-labelledby="maison-echelle-h">
      <div className="maison-container">
        <div className="maison-section-head">
          <p className="maison-kicker">{t(c.kicker)}</p>
          <h2 id="maison-echelle-h" className="maison-h">
            {t(c.title)} <em>{t(c.titleEm)}</em>
          </h2>
          <p className="maison-lede">{t(c.phrase)}</p>
        </div>

        <div className="maison-echelle-grid">
          <div className="maison-echelle-col maison-echelle-world">
            <p className="maison-echelle-cap">{t(c.worldCap)}</p>
            <CefrSpine current="A1" locale={locale} />
          </div>
          <div className="maison-echelle-col maison-echelle-sources">
            <p className="maison-echelle-cap">{t(c.sourcesCap)}</p>
            <YemaSpine current="É1" locale={locale} />
          </div>
        </div>

        <div className="maison-echelle-more">
          <Link href={`/${locale}/langues`} className="maison-link-strong">
            {t(c.linkLangues)}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                 stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
                 strokeLinejoin="round" aria-hidden="true">
              <path d="M3 7h8M8 3l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
