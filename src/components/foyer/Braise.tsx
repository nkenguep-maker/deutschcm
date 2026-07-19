"use client";

// Braise · Sprint « Le Foyer » étape 3.
// Remplace TOUT streak génération. Point laiton du logo Confluent
// (radial #F0CE8B → #D9A855 → #B8873E) + label mono en 9px :
//   « LA BRAISE BRÛLE · N JOURS »
//
// Trois états :
//   · on           · braise vivante, respire 7s (--dur-breath)
//                    UNIQUEMENT si activeAujourdhui=true ET qu'aucune
//                    autre respiration n'est visible (voir Seuil).
//   · off          · braise ternie statique (pas de shadow, opacity 0.35).
//                    Au premier affichage du jour → StateBlock doux
//                    « La braise s'est assoupie. *On la rallume ce soir ?* »
//                    → CTA vers Reprendre. Jamais culpabilisant.
//   · new          · jours=0 · aucun feu allumé encore. Label « La braise
//                    est éteinte » + invitation neutre.
//
// prefers-reduced-motion : braise statique pleine (pas de respiration).

import { useEffect, useRef, useState } from "react";
import { StateBlock } from "@/components/StateBlock";

interface BraiseProps {
  /** Nombre de jours consécutifs avec activité (calcul serveur). */
  jours: number;
  /** True si l'user a complété ≥1 module aujourd'hui. */
  activeAujourdhui: boolean;
  /** Langue de l'interface pour les strings. */
  locale: "fr" | "en";
  /** Href du CTA Reprendre — utilisé par le StateBlock doux si assoupie. */
  reprendreHref?: string;
  /** Si true, on autorise la respiration 7s (--dur-breath). Le seuil
   *  landing pose cette respiration ailleurs ; ici c'est le seul autre
   *  endroit du site autorisé, et jamais quand la landing est visible. */
  allowBreathing?: boolean;
  /** Compact : juste le point + le label (dans le header), sans state
   *  block. Défaut true. */
  compact?: boolean;
}

const SESSION_KEY = "yema.braise.assoupie.seen";

export function Braise({
  jours,
  activeAujourdhui,
  locale,
  reprendreHref,
  allowBreathing = true,
  compact = true,
}: BraiseProps) {
  const [showAssoupie, setShowAssoupie] = useState(false);
  const [reduced, setReduced] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(mq.matches);
    const l = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", l);
    return () => mq.removeEventListener("change", l);
  }, []);

  // StateBlock « assoupie » · une fois par jour maximum (session).
  useEffect(() => {
    if (compact) return;
    if (jours === 0) return; // pas de streak à réveiller
    if (activeAujourdhui) return;
    const today = new Date().toISOString().slice(0, 10);
    const seen = sessionStorage.getItem(SESSION_KEY);
    if (seen === today) return;
    sessionStorage.setItem(SESSION_KEY, today);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowAssoupie(true);
  }, [compact, jours, activeAujourdhui]);

  const state: "on" | "off" | "new" =
    jours === 0 ? "new" : activeAujourdhui ? "on" : "off";

  const jourLabel = jours === 1
    ? (locale === "en" ? "day" : "jour")
    : (locale === "en" ? "days" : "jours");

  const label = state === "new"
    ? (locale === "en" ? "The ember is out" : "La braise est éteinte")
    : state === "on"
      ? (locale === "en"
          ? `The ember burns · ${jours} ${jourLabel}`
          : `La braise brûle · ${jours} ${jourLabel}`)
      : (locale === "en"
          ? `The ember rests · ${jours} ${jourLabel}`
          : `La braise s'est assoupie · ${jours} ${jourLabel}`);

  const canBreathe = allowBreathing && !reduced && state === "on";

  return (
    <>
      <div
        ref={rootRef}
        className={`braise braise-${state} ${canBreathe ? "breathing" : ""}`}
        aria-label={label}
        data-jours={jours}
      >
        <span className="braise-dot" aria-hidden="true" />
        <span className="braise-label">{label}</span>
      </div>

      {showAssoupie ? (
        <div className="braise-assoupie-wrap">
          <StateBlock
            kind="empty"
            soul={locale === "en"
              ? "The ember has dozed off. *Shall we relight it tonight?*"
              : "La braise s'est assoupie. *On la rallume ce soir ?*"}
            action={{
              label: locale === "en" ? "Relight tonight" : "Rallumer ce soir",
              href: reprendreHref ?? "#foyer-reprendre-h",
            }}
            compact
          />
        </div>
      ) : null}
    </>
  );
}
