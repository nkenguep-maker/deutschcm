"use client";

// FoyerHero · Sprint « Le Foyer » — refonte premium, étape 1.
// LA zone laiton unique de l'écran. Une carte pleine largeur, gradient
// laiton (--brass), qui contient :
//   · kicker cap-context (Manrope mono uppercase)
//   · titre (Fraunces italique fragmenté)
//   · sous-ligne (module + minutes) — Manrope mono
//   · anneau SVG de progression (0-100 %) à droite
//   · UN SEUL CTA (Manrope 600)
//
// Empty state : StateBlock inline « Choisir ma langue » ou « Ouvrir la
// première leçon » selon la donnée manquante. Aucun placeholder.
// Étape 2 remplira les 4 configs cap (« Ce soir — le conte » pour
// Transmettre, « Encore N leçons » pour Franchir, etc.).

import Link from "next/link";
import { StateBlock } from "@/components/StateBlock";
import { frTypo } from "@/components/landing/typo";
import type { Cap, FoyerNextLesson } from "@/components/foyer/types";

interface Copy {
  kicker: string;
  emptyNoCap: { soul: string; action: string };
  emptyNoLesson: { soul: string; action: string };
  ctaResume: string;
  ctaListen: string;
  ctaOpenFirst: string;
  /** « Ce soir » (Transmettre) — kicker plus chaleureux que « Reprendre » */
  transmettreKicker: string;
  transmettreTitle: (conteTitre: string) => string;
  transmettreSub: (minutes: number) => string;
  franchirKicker: string;
  franchirSub: (level: string, remaining: number) => string;
  grandirKicker: string;
  grandirSub: string;
  moiKicker: string;
  moiSub: string;
  minutesUnit: string;
}

interface FoyerHeroProps {
  locale: "fr" | "en";
  urlLocale: string;
  cap: Cap | null;
  nextLesson: FoyerNextLesson;
  copy: Copy;
  /** id pour ancres internes (braise assoupie pointe ici). */
  anchorId?: string;
}

/** Rend « Ce soir — *le conte.* » en fragments texte / <em class="foyer-em">. */
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

/** Anneau SVG de progression. Cercle en fond (crème 8%), arc rempli
 *  (braise F0CE8B → D9A855) proportionnel à `pct`. Un chiffre au centre
 *  en JetBrains Mono. Si pct === null → anneau vide (0 %), pas de chiffre. */
function ProgressRing({ pct }: { pct: number | null }) {
  const size = 96;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const value = pct ?? 0;
  const dash = (value / 100) * C;
  return (
    <div className="foyer-hero-ring" role="img" aria-label={pct === null ? "Progression à venir" : `Progression ${pct}%`}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id="foyer-hero-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F0CE8B" />
            <stop offset="60%" stopColor="#D9A855" />
            <stop offset="100%" stopColor="#B8873E" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(244,235,220,0.10)"
          strokeWidth={stroke}
          fill="none"
        />
        {pct !== null && pct > 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="url(#foyer-hero-ring-grad)"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C - dash}`}
            strokeDashoffset={C / 4}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </svg>
      <span className="foyer-hero-ring-num">
        {pct === null ? "—" : `${pct}%`}
      </span>
    </div>
  );
}

export function FoyerHero({ locale, urlLocale, cap, nextLesson, copy, anchorId }: FoyerHeroProps) {
  const t = (s: string) => (locale === "fr" ? frTypo(s) : s);

  // Cas 1 · pas de cap posé → CTA vers onboarding.
  if (!cap) {
    return (
      <section id={anchorId} className="foyer-hero foyer-hero-empty" aria-labelledby="foyer-hero-h">
        <p className="foyer-hero-kicker">{t(copy.kicker)}</p>
        <StateBlock
          kind="empty"
          soul={copy.emptyNoCap.soul}
          action={{ label: copy.emptyNoCap.action, href: `/${urlLocale}/pricing` }}
        />
      </section>
    );
  }

  // Cas 2 · Transmettre — « Ce soir · le conte »
  if (cap === "transmettre" && nextLesson.capContext?.kind === "transmettre") {
    const ctx = nextLesson.capContext;
    return (
      <section id={anchorId} className="foyer-hero foyer-hero-cap-transmettre" aria-labelledby="foyer-hero-h" data-cap="transmettre">
        <div className="foyer-hero-body">
          <p className="foyer-hero-kicker">{t(copy.transmettreKicker).toUpperCase()}</p>
          <h2 id="foyer-hero-h" className="foyer-hero-title">
            {fragmentStars(t(copy.transmettreTitle(ctx.conteTitre)))}
          </h2>
          <p className="foyer-hero-sub">
            {fragmentStars(t(copy.transmettreSub(ctx.minutes)))}
          </p>
          <div className="foyer-hero-cta-row">
            <Link href={`/${urlLocale}/hoeren`} className="foyer-hero-cta">
              {t(copy.ctaListen)} →
            </Link>
          </div>
        </div>
        <ProgressRing pct={nextLesson.pct} />
      </section>
    );
  }

  // Cas 3 · pas de leçon disponible (Franchir/Grandir/Moi sans data)
  if (!nextLesson.lesson || !nextLesson.module) {
    return (
      <section id={anchorId} className="foyer-hero foyer-hero-empty" aria-labelledby="foyer-hero-h">
        <p className="foyer-hero-kicker">{t(copy.kicker)}</p>
        <StateBlock
          kind="empty"
          soul={copy.emptyNoLesson.soul}
          action={{ label: copy.emptyNoLesson.action, href: `/${urlLocale}/courses` }}
        />
      </section>
    );
  }

  // Cas 4 · Franchir / Grandir / Moi — leçon réelle
  let sub: string | null = null;
  let kicker: string = copy.kicker;
  if (cap === "franchir" && nextLesson.capContext?.kind === "franchir" && nextLesson.capContext.leconsRestantes !== null) {
    sub = copy.franchirSub(nextLesson.capContext.examenBlancLevel, nextLesson.capContext.leconsRestantes);
    kicker = copy.franchirKicker;
  } else if (cap === "grandir") {
    sub = copy.grandirSub;
    kicker = copy.grandirKicker;
  } else if (cap === "moi") {
    sub = copy.moiSub;
    kicker = copy.moiKicker;
  }

  return (
    <section id={anchorId} className={`foyer-hero foyer-hero-cap-${cap}`} aria-labelledby="foyer-hero-h" data-cap={cap}>
      <div className="foyer-hero-body">
        <p className="foyer-hero-kicker">{t(kicker).toUpperCase()}</p>
        <h2 id="foyer-hero-h" className="foyer-hero-title">
          {nextLesson.lesson.title}
        </h2>
        {sub ? <p className="foyer-hero-sub">{fragmentStars(t(sub))}</p> : null}
        <div className="foyer-hero-cta-row">
          <Link
            href={`/${urlLocale}/courses/${nextLesson.lesson.id}/modules/${nextLesson.module.id}`}
            className="foyer-hero-cta"
          >
            {t(copy.ctaResume)} →
          </Link>
          {nextLesson.minutes > 0 ? (
            <span className="foyer-hero-minutes">{nextLesson.minutes} {copy.minutesUnit}</span>
          ) : null}
        </div>
      </div>
      <ProgressRing pct={nextLesson.pct} />
    </section>
  );
}
