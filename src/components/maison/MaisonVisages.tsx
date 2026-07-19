"use client";

// MaisonVisages · le mur des visages. Cinq PortraitSpeaking qui prêtent
// leur voix à cinq parcours. Chaque portrait a son territoire (world
// pour les préparations d'examens/départs, sources pour les racines).
// Fallback monogramme si portrait absent en dev.

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

// Ordre du mur — Franchir (Kevin, Aïcha) · Grandir (Fatima, Jean) ·
// Transmettre (Bintou). Rééquilibrage 4 langues, 4 pays, 3 mouvements.
const VISAGES: readonly Visage[] = [
  {
    name: "Kevin",
    monogram: "K",
    langue: "allemand",
    langueEn: "German",
    variant: "world",
    audioSrc: "/audio/voix/kevin-allemand.mp3",
    portraitSrc: "/portraits/kevin.avif",
    citation: "Trois lettres m'obsédaient : A2, B1, B2. Je les ai gravies une à une.",
    citationEn: "Three letters obsessed me: A2, B1, B2. I climbed them one by one.",
  },
  {
    name: "Fatima",
    monogram: "F",
    langue: "allemand",
    langueEn: "German",
    variant: "world",
    audioSrc: "/audio/voix/fatima-allemand.mp3",
    portraitSrc: "/portraits/fatima.avif",
    citation: "Le B2 n'est pas un visa — c'est un passeport. Alors je prépare, chaque soir.",
    citationEn: "B2 isn't a visa — it's a passport. So I prepare, every evening.",
  },
  {
    name: "Aïcha",
    monogram: "A",
    langue: "anglais",
    langueEn: "English",
    variant: "world",
    audioSrc: "/audio/voix/aicha-anglais.mp3",
    portraitSrc: "/portraits/aicha.avif",
    citation: "J'ai arrêté d'avoir peur de mes erreurs. La note est tombée. Le départ aussi.",
    citationEn: "I stopped being afraid of my mistakes. The score came. So did the departure.",
  },
  {
    name: "Jean",
    monogram: "J",
    langue: "français",
    langueEn: "French",
    variant: "world",
    audioSrc: "/audio/voix/jean-francais.mp3",
    portraitSrc: "/portraits/jean.avif",
    citation: "Aujourd'hui, je réponds en français sans baisser les yeux.",
    citationEn: "Today, I answer in French without lowering my eyes.",
  },
  {
    name: "Bintou",
    monogram: "B",
    langue: "wolof",
    langueEn: "Wolof",
    variant: "sources",
    audioSrc: "/audio/voix/bintou-wolof.mp3",
    portraitSrc: "/portraits/bintou.avif",
    citation: "Ma fille répond en wolof, maintenant. C'est ma grand-mère qui parle par sa bouche.",
    citationEn: "My daughter answers in Wolof now. It's my grandmother speaking through her mouth.",
  },
];

interface Copy {
  kicker: string;
  title: string;
  titleEm: string;
  phrase: string;
  listenLabel: string;
}

const COPY_FR: Copy = {
  kicker: "Le mur des visages",
  title: "Cinq voix.",
  titleEm: "Cinq chemins.",
  phrase: "Cinq voix, cinq chemins. Chacune parle sa langue.",
  listenLabel: "Écouter",
};

const COPY_EN: Copy = {
  kicker: "The wall of faces",
  title: "Five voices.",
  titleEm: "Five paths.",
  phrase: "Five voices, five paths. Each speaks their own language.",
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

      </div>
    </section>
  );
}
