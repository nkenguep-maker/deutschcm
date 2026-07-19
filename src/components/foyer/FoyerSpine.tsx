"use client";

// FoyerSpine · Sprint « Le Foyer » — refonte premium, étape 1.
// Wrapper autour de CefrSpine ou YemaSpine selon la scale de la langue
// active. Segments peints = niveaux acquis, libellé du niveau en cours.
// Se peint une fois (--dur-moment) à l'entrée puis reste statique.

import { CefrSpine } from "@/components/landing/CefrSpine";
import { YemaSpine } from "@/components/landing/YemaSpine";
import { StateBlock } from "@/components/StateBlock";
import { frTypo } from "@/components/landing/typo";
import type { FoyerLangue } from "@/components/foyer/types";

interface Copy {
  title: string;
  empty: { soul: string };
}

interface FoyerSpineProps {
  locale: "fr" | "en";
  langue: FoyerLangue;
  copy: Copy;
}

export function FoyerSpine({ locale, langue, copy }: FoyerSpineProps) {
  const t = (s: string) => (locale === "fr" ? frTypo(s) : s);
  const isYema = langue.scale === "yema";
  const current = langue.level ?? langue.levels[0] ?? null;

  return (
    <section className="foyer-spine" aria-labelledby="foyer-spine-h">
      <p id="foyer-spine-h" className="maison-kicker">{t(copy.title)}</p>

      {current ? (
        <div className="foyer-spine-holder">
          {isYema ? (
            <YemaSpine current={current} locale={locale} compact />
          ) : (
            <CefrSpine current={current as "A1" | "A2" | "B1" | "B2" | "C1"} locale={locale} compact />
          )}
        </div>
      ) : (
        <StateBlock kind="empty" soul={copy.empty.soul} compact />
      )}
    </section>
  );
}
