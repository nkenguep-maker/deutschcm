"use client";

// MaisonVisages · le mur des visages. Cinq PortraitSpeaking qui prêtent
// leur voix à cinq parcours. Chaque portrait a son territoire (world
// pour les préparations d'examens/départs, sources pour les racines).
// Fallback monogramme si portrait absent en dev.

import Link from "next/link";
import { PortraitSpeaking } from "@/components/PortraitSpeaking";
import { frTypo } from "@/components/landing/typo";

interface Visage {
  name: string;
  monogram: string;
  langue: string;
  langueEn: string;
  variant: "world" | "sources";
  audioSrc?: string;
  portraitSrc?: string;
  citation: string;
  citationEn: string;
}

const VISAGES: readonly Visage[] = [
  {
    name: "Aïcha",
    monogram: "A",
    langue: "allemand",
    langueEn: "German",
    variant: "world",
    audioSrc: "/audio/portraits/aicha.mp3",
    portraitSrc: "/portraits/aicha.avif",
    citation: "J'ai passé mon test B1. Je pars à Cologne en septembre.",
    citationEn: "I passed my B1 test. I leave for Cologne in September.",
  },
  {
    name: "Kevin",
    monogram: "K",
    langue: "allemand",
    langueEn: "German",
    variant: "world",
    audioSrc: "/audio/portraits/kevin.mp3",
    portraitSrc: "/portraits/kevin.avif",
    citation: "L'entretien s'est fait dans les deux langues. J'étais prêt.",
    citationEn: "The interview happened in both languages. I was ready.",
  },
  {
    name: "Fatima",
    monogram: "F",
    langue: "allemand",
    langueEn: "German",
    variant: "world",
    audioSrc: "/audio/portraits/fatima.mp3",
    portraitSrc: "/portraits/fatima.avif",
    citation: "Chaque leçon, quinze minutes le matin, avant les enfants.",
    citationEn: "Each lesson, fifteen minutes in the morning, before the kids.",
  },
  {
    name: "Jean",
    monogram: "J",
    langue: "allemand",
    langueEn: "German",
    variant: "world",
    audioSrc: "/audio/portraits/jean.mp3",
    portraitSrc: "/portraits/jean.avif",
    citation: "Je regroupe ma famille. La langue était le dernier verrou.",
    citationEn: "I'm reuniting with my family. Language was the last lock.",
  },
  {
    name: "Bintou",
    monogram: "B",
    langue: "wolof",
    langueEn: "Wolof",
    variant: "sources",
    audioSrc: "/audio/portraits/bintou.mp3",
    portraitSrc: "/portraits/bintou.avif",
    citation: "Ma fille répond en wolof. C'est la première fois.",
    citationEn: "My daughter answers in Wolof. It's the first time.",
  },
];

interface Copy {
  kicker: string;
  title: string;
  titleEm: string;
  phrase: string;
  seeMore: string;
  listenLabel: string;
}

const COPY_FR: Copy = {
  kicker: "Le mur des visages",
  title: "Cinq voix.",
  titleEm: "Cinq maisons.",
  phrase: "Chaque parcours a son territoire. Chacun sa langue première, chacun son cap.",
  seeMore: "Toutes les histoires",
  listenLabel: "Écouter",
};

const COPY_EN: Copy = {
  kicker: "The wall of faces",
  title: "Five voices.",
  titleEm: "Five homes.",
  phrase: "Each journey has its territory. Each has a first language, each a cap.",
  seeMore: "All the stories",
  listenLabel: "Listen",
};

export function MaisonVisages({ locale }: { locale: "fr" | "en" }) {
  const c = locale === "en" ? COPY_EN : COPY_FR;
  const t = (s: string) => (locale === "fr" ? frTypo(s) : s);

  return (
    <section className="maison-visages" aria-labelledby="maison-visages-h">
      <div className="maison-container">
        <div className="maison-section-head">
          <p className="maison-kicker">{t(c.kicker)}</p>
          <h2 id="maison-visages-h" className="maison-h">
            {t(c.title)} <em>{t(c.titleEm)}</em>
          </h2>
          <p className="maison-lede">{t(c.phrase)}</p>
        </div>

        <ul className="maison-visages-grid" role="list">
          {VISAGES.map((v) => {
            const langue = locale === "en" ? v.langueEn : v.langue;
            const citation = locale === "en" ? v.citationEn : v.citation;
            return (
              <li key={v.name} className={`maison-visage maison-visage-${v.variant}`}>
                <div className="maison-visage-portrait">
                  <PortraitSpeaking
                    src={v.portraitSrc}
                    variant={v.variant}
                    size="md"
                    name={v.name}
                    lang={langue}
                    audioSrc={v.audioSrc}
                    transcript={citation}
                    mono={v.monogram}
                    listenLabel={c.listenLabel}
                  />
                </div>
                <blockquote className="maison-visage-cite">
                  <p>{t(citation)}</p>
                  <footer className="maison-visage-attr">
                    <span className="maison-visage-name">{v.name}</span>
                    <span className="maison-visage-lang">· {langue}</span>
                  </footer>
                </blockquote>
              </li>
            );
          })}
        </ul>

        <div className="maison-visages-more">
          <Link href={`/${locale}/histoires`} className="maison-link-strong">
            {t(c.seeMore)}
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
