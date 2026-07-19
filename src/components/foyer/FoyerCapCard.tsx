"use client";

// FoyerCapCard · Sprint « Le Foyer » — refonte premium, étape 1.
// Une carte qui rend le cap concret :
//   · Franchir     → « Prochain jalon » — examen blanc, position réelle
//                    (distance en LEÇONS, jamais en jours)
//   · Grandir      → « Ma procédure » — X dossiers sur Y
//   · Transmettre  → « Le rituel » — soirs de la semaine (chaleureux)
//   · Moi          → « Mon rythme » — aucune pression
// Empty state par cap. Étape 2 remplit les textes cap-spécifiques.

import { StateBlock } from "@/components/StateBlock";
import { frTypo } from "@/components/landing/typo";
import type { Cap, CapContext } from "@/components/foyer/types";

interface Copy {
  emptyNoCap: { soul: string; action: string };
  jalonTitle: string;
  jalonSub: (level: string) => string;
  jalonRemaining: (n: number) => string;
  jalonEmpty: string;
  procedureTitle: string;
  procedureEmpty: { soul: string; action: string };
  procedureLine: (done: number, total: number) => string;
  ritualTitle: string;
  ritualLine: (soirs: number) => string;
  rythmeTitle: string;
  rythmeLine: string;
}

interface FoyerCapCardProps {
  locale: "fr" | "en";
  urlLocale: string;
  cap: Cap | null;
  personalGoal: string | null;
  capContext: CapContext | null;
  copy: Copy;
}

function fragmentStars(s: string) {
  const parts = s.split(/(\*[^*]+\*)/g).filter(Boolean);
  return parts.map((p, i) =>
    p.startsWith("*") && p.endsWith("*") ? (
      <em key={i} className="foyer-em">{p.slice(1, -1)}</em>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export function FoyerCapCard({ locale, urlLocale, cap, personalGoal, capContext, copy }: FoyerCapCardProps) {
  const t = (s: string) => (locale === "fr" ? frTypo(s) : s);

  if (!cap) {
    return (
      <section className="foyer-cap-card" aria-labelledby="foyer-cap-card-h">
        <StateBlock
          kind="empty"
          soul={copy.emptyNoCap.soul}
          action={{ label: copy.emptyNoCap.action, href: `/${urlLocale}/onboarding/student` }}
        />
      </section>
    );
  }

  if (cap === "franchir" && capContext?.kind === "franchir") {
    return (
      <section className="foyer-cap-card" aria-labelledby="foyer-cap-card-h">
        <p className="maison-kicker">{t(copy.jalonTitle)}</p>
        <p id="foyer-cap-card-h" className="foyer-cap-card-h">{t(copy.jalonSub(capContext.examenBlancLevel))}</p>
        {capContext.leconsRestantes !== null ? (
          <p className="foyer-cap-card-note">{t(copy.jalonRemaining(capContext.leconsRestantes))}</p>
        ) : (
          <p className="foyer-cap-card-note foyer-cap-card-note-mute">{t(copy.jalonEmpty)}</p>
        )}
        {personalGoal ? (
          <blockquote className="foyer-cap-card-quote"><p><em>« {personalGoal} »</em></p></blockquote>
        ) : null}
      </section>
    );
  }

  if (cap === "grandir" && capContext?.kind === "grandir") {
    const hasData = capContext.dossiersTotal !== null && capContext.dossiersCompletes !== null;
    return (
      <section className="foyer-cap-card" aria-labelledby="foyer-cap-card-h">
        <p className="maison-kicker">{t(copy.procedureTitle)}</p>
        {hasData ? (
          <>
            <p id="foyer-cap-card-h" className="foyer-cap-card-h">
              {t(copy.procedureLine(capContext.dossiersCompletes!, capContext.dossiersTotal!))}
            </p>
            {personalGoal ? (
              <blockquote className="foyer-cap-card-quote"><p><em>« {personalGoal} »</em></p></blockquote>
            ) : null}
          </>
        ) : (
          <StateBlock
            kind="empty"
            soul={copy.procedureEmpty.soul}
            action={{ label: copy.procedureEmpty.action, href: `/${urlLocale}/settings` }}
            compact
          />
        )}
      </section>
    );
  }

  if (cap === "transmettre" && capContext?.kind === "transmettre") {
    return (
      <section className="foyer-cap-card" aria-labelledby="foyer-cap-card-h">
        <p className="maison-kicker">{t(copy.ritualTitle)}</p>
        <p id="foyer-cap-card-h" className="foyer-cap-card-h">
          {fragmentStars(t(copy.ritualLine(capContext.soirsCetteSemaine)))}
        </p>
        {personalGoal ? (
          <blockquote className="foyer-cap-card-quote"><p><em>« {personalGoal} »</em></p></blockquote>
        ) : null}
      </section>
    );
  }

  return (
    <section className="foyer-cap-card" aria-labelledby="foyer-cap-card-h">
      <p className="maison-kicker">{t(copy.rythmeTitle)}</p>
      <p id="foyer-cap-card-h" className="foyer-cap-card-h">{t(copy.rythmeLine)}</p>
      {personalGoal ? (
        <blockquote className="foyer-cap-card-quote"><p><em>« {personalGoal} »</em></p></blockquote>
      ) : null}
    </section>
  );
}
