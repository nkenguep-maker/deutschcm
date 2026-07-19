"use client";

// ClasseStrip · Sprint « Le Foyer » — refonte premium, étape 1.
// Bande fine sous le hero : la classe où l'user est inscrit·e (nom +
// prof). Si aucune inscription → StateBlock « Entrer un code ». Jamais
// de placeholder.

import { StateBlock } from "@/components/StateBlock";
import { frTypo } from "@/components/landing/typo";
import type { FoyerClasse } from "@/components/foyer/types";

interface Copy {
  title: string;
  withPrefix: string;
  empty: { soul: string; action: string };
}

interface ClasseStripProps {
  locale: "fr" | "en";
  urlLocale: string;
  classe: FoyerClasse | null;
  copy: Copy;
}

export function ClasseStrip({ locale, urlLocale, classe, copy }: ClasseStripProps) {
  const t = (s: string) => (locale === "fr" ? frTypo(s) : s);

  return (
    <section className="foyer-classe" aria-labelledby="foyer-classe-h">
      <p id="foyer-classe-h" className="maison-kicker">{t(copy.title)}</p>
      {classe ? (
        <article className="foyer-classe-card">
          <p className="foyer-classe-name">{classe.name}</p>
          {classe.teacherName ? (
            <p className="foyer-classe-teacher">
              {t(copy.withPrefix)} {classe.teacherName}
            </p>
          ) : null}
        </article>
      ) : (
        <StateBlock
          kind="empty"
          soul={copy.empty.soul}
          action={{ label: copy.empty.action, href: `/${urlLocale}/discover` }}
          compact
        />
      )}
    </section>
  );
}
