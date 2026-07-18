"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/navigation";
import { frTypo } from "@/components/landing/typo";

// Signature moment · Fin de leçon.
// Écran plein-page, territoire de la langue active (world|sources).
// Partition (tous en ease-enter, translateY(12px), une seule fois) :
//   t=0     ligne d'âme (states.lesson_done.soul avec {lektion})
//   t=120   devise (states.lesson_done.motto)
//   t=240   cartes compétences · cascade 50ms, 5 max
//   t=360   XP count-up (480ms, useCountUp respecte reduced-motion)
//   t=480   spine — portion GAGNÉE peinte (scaleX left, 480ms)
//   t=720   boutons Continuer + Plus tard
// Total ≤ 1.2s. Aucun confetti, étoile, son, badge surgissant,
// "Félicitations". La maison confirme sans célébrer bruyamment.

export interface SkillScore {
  /** Nom de la compétence (Sprechen, Hören, Lesen, Schreiben, Grammatik…) */
  name: string;
  /** Réponses correctes de cette compétence dans la leçon */
  score: number;
  /** Total d'items pour cette compétence */
  total: number;
}

export interface LessonCompleteProps {
  /** Nom du module complété — interpolé dans soul ({lektion}) */
  lektion: string;
  /** Territoire d'affichage : "world" (étrangères) ou "sources" (natales) */
  territory: "world" | "sources";
  /** Compétences travaillées et scores réels — 5 max en cascade */
  skills: SkillScore[];
  /** XP réellement gagnés sur la leçon */
  xpEarned: number;
  /** Niveau CECRL courant après la leçon (A1, A2, É1…) */
  currentLevel: string;
  /** Progression dans le niveau AVANT la leçon (0-100) */
  previousPct: number;
  /** Progression dans le niveau APRÈS la leçon (0-100) */
  newPct: number;
  /** Lien vers la leçon suivante */
  nextLessonHref: string;
  /** Handler du bouton "Plus tard" — retour dashboard */
  onLater?: () => void;
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

/** Count-up 0 → target sur `duration` ms, démarre à `startDelay` ms.
 * Respecte prefers-reduced-motion en affichant directement la cible. */
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
    const step = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    const timeout = window.setTimeout(() => {
      raf = requestAnimationFrame(step);
    }, startDelay);
    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, startDelay]);
  return value;
}

export function LessonComplete({
  lektion,
  territory,
  skills,
  xpEarned,
  currentLevel,
  previousPct,
  newPct,
  nextLessonHref,
  onLater,
}: LessonCompleteProps) {
  const t = useTranslations("states.lesson_done");
  const locale = useLocale();
  const applyTypo = (s: string) => (locale === "fr" ? frTypo(s) : s);

  const soul = applyTypo(t("soul", { lektion }));
  const motto = applyTypo(t("motto"));
  const xpLbl = applyTypo(t("xpLbl"));
  const levelCaption = applyTypo(t("levelCaption", { level: currentLevel, pct: newPct }));
  const continueLbl = applyTypo(t("action"));
  const laterLbl = applyTypo(t("later"));

  // XP count-up démarre à t=360ms, dure 480ms
  const xp = useCountUp(xpEarned, 480, 360);

  // 5 compétences max en cascade — le reste apparaît d'un bloc via un
  // sous-bloc "autres" (rare : la plupart des leçons ont 3-4 compétences).
  const shown = skills.slice(0, 5);

  return (
    <section
      className={`ceremony territory-${territory}`}
      aria-labelledby="ceremony-soul"
    >
      <div className="ceremony-inner">
        <h1 id="ceremony-soul" className="ceremony-soul ceremony-item">
          {renderSoul(soul)}
        </h1>

        <p className="ceremony-devise ceremony-item">{motto}</p>

        {shown.length > 0 && (
          <div className="ceremony-skills" role="list">
            {shown.map((s, i) => (
              <div
                key={s.name}
                role="listitem"
                className="ceremony-skill"
                data-i={i}
              >
                <p className="ceremony-skill-name">{applyTypo(s.name)}</p>
                <p className="ceremony-skill-score">
                  {s.score}
                  <span className="out">/{s.total}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="ceremony-xp ceremony-item">
          <span className="ceremony-xp-value" aria-live="polite">
            +{xp}
          </span>
          <span className="ceremony-xp-lbl">{xpLbl}</span>
        </div>

        <div
          className="ceremony-spine ceremony-item"
          style={{
            ["--prev-pct" as string]: previousPct / 100,
            ["--new-pct" as string]: newPct / 100,
          }}
        >
          <p className="ceremony-spine-caption">{levelCaption}</p>
          <div className="ceremony-spine-track" aria-hidden="true">
            <div className="ceremony-spine-prev" />
            <div className="ceremony-spine-won" />
          </div>
        </div>

        <div className="ceremony-actions ceremony-item">
          <Link href={nextLessonHref} className="ceremony-cta">
            {continueLbl}
          </Link>
          {onLater && (
            <button type="button" onClick={onLater} className="ceremony-cta ghost">
              {laterLbl}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
