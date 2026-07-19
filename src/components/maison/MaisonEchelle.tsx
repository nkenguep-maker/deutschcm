"use client";

// MaisonEchelle · les deux échelles côte à côte + zone détail lifted.
// À gauche : CefrSpine (A1→C1) sur fond espresso.
// À droite : YemaSpine (É1→É5) sur fond terre.
// Sous les deux : une 3e zone dédiée « détail du palier » qui se
// remplit au survol/tap d'un item. Aucun popover flottant — plus de
// débordement, plus de recouvrement de l'autre panneau.
//
// Cascade
//   · Desktop hover · sur un item CECRL → détail teinté espresso à
//     GAUCHE de la zone ; sur un YEMA → détail teinté terre à DROITE.
//   · Mobile tap · la même zone apparaît sous la grille (les spines
//     stackent verticalement), scrollIntoView pour rester visible.
//   · Re-tap sur le même item = fermeture. Un seul détail à la fois.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CefrSpine } from "@/components/landing/CefrSpine";
import { YemaSpine } from "@/components/landing/YemaSpine";
import { frTypo } from "@/components/landing/typo";
import type { SpineDetail } from "@/components/landing/spineDetail";

interface Copy {
  kicker: string;
  title: string;
  titleEm: string;
  phrase: string;
  worldCap: string;
  sourcesCap: string;
  linkLangues: string;
  hint: string;
}

const COPY_FR: Copy = {
  kicker: "L'échelle",
  title: "Chaque palier",
  titleEm: "est une compétence réelle.",
  phrase: "Survolez : le design vous montre où vous allez. Pas des étoiles — des choses que vous saurez faire.",
  worldCap: "CECRL · le voyage extérieur",
  sourcesCap: "YEMA · le retour intérieur",
  linkLangues: "Voir toutes les langues",
  hint: "Survolez ou touchez un palier — le détail s'affiche ici.",
};

const COPY_EN: Copy = {
  kicker: "The scale",
  title: "Each stage",
  titleEm: "is a real skill.",
  phrase: "Hover: the design shows you where you're going. Not stars — things you'll actually do.",
  worldCap: "CEFR · the outward journey",
  sourcesCap: "YEMA · the inward return",
  linkLangues: "See all languages",
  hint: "Hover or tap a stage — the detail appears here.",
};

export function MaisonEchelle({ locale }: { locale: "fr" | "en" }) {
  const c = locale === "en" ? COPY_EN : COPY_FR;
  const t = (s: string) => (locale === "fr" ? frTypo(s) : s);
  const [detail, setDetail] = useState<SpineDetail | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // Sur mobile (< 900px), scroller le détail dans la vue après un tap.
  // Pas d'auto-scroll sur desktop — le hover se joue déjà dans la vue.
  useEffect(() => {
    if (!detail) return;
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 900) return;
    const el = detailRef.current;
    if (!el) return;
    // Attendre le prochain paint pour éviter de scroller avant que
    // la zone se soit remplie.
    window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [detail]);

  const activeCefr = detail?.source === "cefr" ? detail.code : null;
  const activeYema = detail?.source === "yema" ? detail.code : null;

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
            <CefrSpine
              current="A1"
              locale={locale}
              activeCode={activeCefr}
              onDetailChange={setDetail}
            />
          </div>
          <div className="maison-echelle-seam-mini" aria-hidden="true" />
          <div className="maison-echelle-col maison-echelle-sources">
            <p className="maison-echelle-cap">{t(c.sourcesCap)}</p>
            <YemaSpine
              current="É1"
              locale={locale}
              activeCode={activeYema}
              onDetailChange={setDetail}
            />
          </div>
        </div>

        {/* Zone détail unique · remplie par le dernier item survolé/tap.
            Vide → affiche un hint discret pour l'onboarding. */}
        <div
          ref={detailRef}
          className="maison-echelle-detail"
          data-source={detail?.source ?? "empty"}
          aria-live="polite"
          role="region"
          aria-label={locale === "en" ? "Stage detail" : "Détail du palier"}
        >
          {detail ? (
            <>
              <div className="maison-echelle-detail-head">
                <span className="maison-echelle-detail-code">{detail.code}</span>
                <div className="maison-echelle-detail-titles">
                  <p className="maison-echelle-detail-h">{detail.headline}</p>
                  {detail.anchor ? (
                    <p className="maison-echelle-detail-anchor">{detail.anchor}</p>
                  ) : null}
                </div>
                {detail.actfl ? (
                  <span className="maison-echelle-detail-actfl">{detail.actfl}</span>
                ) : null}
              </div>
              <ul className="maison-echelle-detail-list">
                {detail.skills.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p className="maison-echelle-detail-fine">{detail.fine}</p>
            </>
          ) : (
            <p className="maison-echelle-detail-hint">{t(c.hint)}</p>
          )}
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
