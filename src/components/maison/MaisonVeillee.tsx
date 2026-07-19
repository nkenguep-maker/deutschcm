"use client";

// MaisonVeillee · la Veillée devient audio-first.
// Kicker, titre Fraunces, une phrase, puis <VeilleeVoix> —
// sélecteur de voix + player avec proverbe et transcription
// bilingue synchronisée. Le film cinéma reviendra plus tard,
// la voix est le premier chapitre.

import { VeilleeVoix } from "@/components/voix/VeilleeVoix";
import { frTypo } from "@/components/landing/typo";

interface Copy {
  kicker: string;
  title: string;
  titleEm: string;
  phrase: string;
}

const COPY_FR: Copy = {
  kicker: "La veillée",
  title: "Choisissez une voix.",
  titleEm: "Écoutez.",
  phrase: "Une voix, une langue, un récit. La voix reste dans sa langue — vous suivez les mots au fil, si vous le voulez.",
};

const COPY_EN: Copy = {
  kicker: "The vigil",
  title: "Choose a voice.",
  titleEm: "Listen.",
  phrase: "A voice, a language, a story. The voice stays in its language — you follow the words along, if you wish.",
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
        <VeilleeVoix locale={locale} />
      </div>
    </section>
  );
}
