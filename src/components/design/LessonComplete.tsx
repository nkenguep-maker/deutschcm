"use client";

import { useEffect, useState } from "react";
import { IconCheck } from "@/components/landing/icons";

// Signature moment #3 — Fin de leçon.
// Séquence totale ≤ 1.2 s, trois éléments en cascade 120 ms.
// Sobre. Zéro confetti, zéro overshoot, zéro spin.
//   Étape 1 (t=0)     : le module se marque (checkmark brass)
//   Étape 2 (t=120ms) : l'XP compte, dur-moment ease-enter, une fois
//   Étape 3 (t=240ms) : la barre de progression se peint (transform scaleX)
// Respecte prefers-reduced-motion : count-up affiche la valeur finale
// immédiatement, transitions à 0.01ms.

interface LessonCompleteProps {
  /** Titre du module complété */
  moduleTitle: string;
  /** XP gagnés à afficher en count-up */
  xpEarned: number;
  /** Progression globale du parcours (0 → 100) */
  progressPct: number;
  /** Handler CTA continuer */
  onContinue: () => void;
  /** Locale, défaut fr */
  locale?: "fr" | "en";
}

const COPY = {
  fr: {
    eye: "Leçon terminée",
    xpLabel: "XP gagnés",
    progressLabel: "Ton parcours",
    cta: "Continuer",
  },
  en: {
    eye: "Lesson complete",
    xpLabel: "XP earned",
    progressLabel: "Your journey",
    cta: "Continue",
  },
};

/** Count-up hook : anime de 0 à `target` en `duration` ms,
 * respecte prefers-reduced-motion. */
function useCountUp(target: number, duration: number, startDelay = 0): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const kick = () => {
      const step = (ts: number) => {
        if (!start) start = ts;
        const elapsed = ts - start;
        const t = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.round(eased * target));
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const timeout = window.setTimeout(kick, startDelay);
    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, startDelay]);

  return value;
}

export function LessonComplete({
  moduleTitle,
  xpEarned,
  progressPct,
  onContinue,
  locale = "fr",
}: LessonCompleteProps) {
  const t = COPY[locale];
  const xp = useCountUp(xpEarned, 480, 120);

  return (
    <section className="lesson-complete" aria-labelledby="lc-title">
      <p className="lesson-complete-eye">{t.eye}</p>

      {/* Étape 1 · le check */}
      <div className="lesson-complete-mark" aria-hidden="true">
        <span className="lesson-complete-check">
          <IconCheck size={26} strokeWidth={2.25} />
        </span>
      </div>

      <h2 id="lc-title" className="lesson-complete-h">{moduleTitle}</h2>

      {/* Étape 2 · XP en count-up */}
      <div className="lesson-complete-xp">
        <span className="lesson-complete-xp-value" aria-live="polite">
          +{xp}
        </span>
        <span className="lesson-complete-xp-lbl">{t.xpLabel}</span>
      </div>

      {/* Étape 3 · barre de progression peinte (transform scaleX) */}
      <div className="lesson-complete-progress">
        <p className="lesson-complete-progress-lbl">{t.progressLabel}</p>
        <div className="lesson-complete-progress-bar" aria-hidden="true">
          <div
            className="lesson-complete-progress-fill"
            style={{ ["--fill" as string]: `${progressPct}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="lesson-complete-cta"
      >
        {t.cta}
      </button>
    </section>
  );
}
