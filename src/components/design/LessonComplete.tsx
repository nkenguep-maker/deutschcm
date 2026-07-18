"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useTranslations, useLocale } from "next-intl";
import { frTypo } from "@/components/landing/typo";
import { IconCheck } from "@/components/landing/icons";

// Signature moment #3 — Fin de leçon.
// Séquence totale ≤ 1.2 s, trois éléments en cascade 120 ms.
// Sobre. Zéro confetti, zéro overshoot, zéro spin.
//   Étape 1 (t=0)     : le module se marque (checkmark brass)
//   Étape 2 (t=120ms) : XP count-up
//   Étape 3 (t=360ms) : barre de progression peinte (transform scaleX)
//
// Le composant charge sa voix depuis states.lesson_done (i18n).
// Le fragment entre *...* du soul se colore en brass italic —
// identique à StateBlock.

interface LessonCompleteProps {
  /** Nom du module complété (interpolé dans states.lesson_done.soul) */
  lektion: string;
  /** XP gagnés à afficher en count-up */
  xpEarned: number;
  /** Progression globale du parcours (0 → 100) */
  progressPct: number;
  /** Handler CTA continuer */
  onContinue: () => void;
}

function renderSoul(soul: string): ReactElement[] {
  const parts = soul.split(/(\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="state-soul-accent">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

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
  lektion,
  xpEarned,
  progressPct,
  onContinue,
}: LessonCompleteProps) {
  const t = useTranslations("states.lesson_done");
  const locale = useLocale();
  const applyTypo = (s: string) => (locale === "fr" ? frTypo(s) : s);
  const soul = applyTypo(t("soul", { lektion }));
  const body = applyTypo(t("body"));
  const cta = applyTypo(t("action"));
  const xp = useCountUp(xpEarned, 480, 120);

  return (
    <section className="lesson-complete" aria-labelledby="lc-title">
      {/* Étape 1 · le check */}
      <div className="lesson-complete-mark" aria-hidden="true">
        <span className="lesson-complete-check">
          <IconCheck size={26} strokeWidth={2.25} />
        </span>
      </div>

      <h2 id="lc-title" className="lesson-complete-h">{renderSoul(soul)}</h2>
      <p className="lesson-complete-sub">{body}</p>

      {/* Étape 2 · XP en count-up */}
      <div className="lesson-complete-xp">
        <span className="lesson-complete-xp-value" aria-live="polite">
          +{xp}
        </span>
        <span className="lesson-complete-xp-lbl">XP</span>
      </div>

      {/* Étape 3 · barre de progression peinte (transform scaleX) */}
      <div className="lesson-complete-progress">
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
        {cta}
      </button>
    </section>
  );
}
