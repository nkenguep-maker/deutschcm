"use client";

// FoyerHead · Sprint « Le Foyer » — refonte premium, étape 1.
// Salutation éditoriale (Fraunces italique sur le prénom) + kicker de
// cap (Manrope mono uppercase) + Braise vivante en pastille. C'est la
// première pièce de la cascade d'entrée (--dur-move).

import Link from "next/link";
import { Braise } from "@/components/foyer/Braise";
import { frTypo } from "@/components/landing/typo";
import type { Cap, FoyerBraise } from "@/components/foyer/types";

interface Copy {
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  capLabel: string;
  capName: Record<Cap, string>;
  changeCap: string;
  setCap: string;
}

interface FoyerHeadProps {
  prenom: string;
  locale: "fr" | "en";
  /** URL locale pour la route de changement de cap (`/${urlLocale}/pricing`). */
  urlLocale: string;
  cap: Cap | null;
  braise: FoyerBraise;
  copy: Copy;
  /** Href ciblé par la braise assoupie (Reprendre). */
  reprendreHref?: string;
}

function greetingFor(hour: number, c: Copy): string {
  if (hour < 12) return c.greetingMorning;
  if (hour < 18) return c.greetingAfternoon;
  return c.greetingEvening;
}

export function FoyerHead({ prenom, locale, urlLocale, cap, braise, copy, reprendreHref }: FoyerHeadProps) {
  const t = (s: string) => (locale === "fr" ? frTypo(s) : s);
  const hour = new Date().getHours();
  const greet = greetingFor(hour, copy);
  const capName = cap ? copy.capName[cap] : null;
  const capHref = `/${urlLocale}/pricing`;

  return (
    <section className="foyer-head" aria-label={t("Votre foyer")}>
      <div className="foyer-head-text">
        <p className="foyer-head-greeting">
          {t(greet)}, <em>{prenom}.</em>
        </p>
        {/* Ligne de cap · si un cap est posé, on affiche la valeur +
            un petit lien discret « Changer ». Sinon on invite à en poser
            un — même endroit visuel, jamais deux zones concurrentes. */}
        <p className="foyer-head-cap">
          {capName ? (
            <>
              <span className="foyer-head-cap-lbl">
                {t(copy.capLabel).toUpperCase()} · {t(capName).toUpperCase()}
              </span>
              <Link className="foyer-head-cap-edit" href={capHref}>
                {t(copy.changeCap)}
              </Link>
            </>
          ) : (
            <Link className="foyer-head-cap-edit foyer-head-cap-edit-set" href={capHref}>
              {t(copy.setCap)} →
            </Link>
          )}
        </p>
      </div>

      <div className="foyer-head-braise">
        <Braise
          jours={braise.jours}
          activeAujourdhui={braise.activeAujourdhui}
          locale={locale}
          reprendreHref={reprendreHref}
          allowBreathing
          compact
        />
      </div>
    </section>
  );
}
