"use client";

// MaisonVeillee · section landing autour du composant VeilleeFilm.
// Poser un kicker, un titre en Fraunces italique, une phrase courte,
// puis le film (ou son fallback slideshow). La piste voix suit la
// locale du seuil (fr.mp3 / en.mp3), la vidéo master ne change pas
// (l'ouverture avec la grand-mère dans SA langue reste immuable).

import { VeilleeFilm } from "@/components/seuil/VeilleeFilm";
import { frTypo } from "@/components/landing/typo";

interface Copy {
  kicker: string;
  title: string;
  titleEm: string;
  phrase: string;
}

const COPY_FR: Copy = {
  kicker: "La veillée",
  title: "La grand-mère parle.",
  titleEm: "Nous écoutons.",
  phrase: "Un film de quarante secondes. Sa voix reste dans sa langue — c'est nous qui apprenons.",
};

const COPY_EN: Copy = {
  kicker: "The vigil",
  title: "The grandmother speaks.",
  titleEm: "We listen.",
  phrase: "A forty-second film. Her voice stays in her language — we are the ones who learn.",
};

export function MaisonVeillee({ locale }: { locale: "fr" | "en" }) {
  const c = locale === "en" ? COPY_EN : COPY_FR;
  const t = (s: string) => (locale === "fr" ? frTypo(s) : s);

  return (
    <section className="maison-veillee" aria-labelledby="maison-veillee-h">
      <div className="maison-container">
        <div className="maison-section-head">
          <p className="maison-kicker">{t(c.kicker)}</p>
          <h2 id="maison-veillee-h" className="maison-h">
            {t(c.title)} <em>{t(c.titleEm)}</em>
          </h2>
          <p className="maison-lede">{t(c.phrase)}</p>
        </div>
        <VeilleeFilm locale={locale} />
      </div>
    </section>
  );
}
