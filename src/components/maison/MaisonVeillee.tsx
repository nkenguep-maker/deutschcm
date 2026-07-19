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
  title: "Des histoires racontées —",
  titleEm: "et d'autres qu'on n'a jamais dites.",
  phrase: "Choisissez une langue. Écoutez quelqu'un vous parler — comme un message du pays.",
};

const COPY_EN: Copy = {
  kicker: "The vigil",
  title: "Stories told —",
  titleEm: "and others never spoken.",
  phrase: "Choose a language. Listen to someone speak — like a message from home.",
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
