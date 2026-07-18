"use client";

import { useEffect, type ReactElement } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/navigation";
import { frTypo } from "@/components/landing/typo";

// Signature moment · Cérémonie rare de franchissement de niveau.
// N'arrive que ~4-5 fois dans une vie d'apprenant·e — a droit à plus.
//
// Composition :
//   · Fond couture · halo brass qui s'élève pendant --dur-ceremony (960ms)
//   · Spine ENTIER repeint depuis A1 (ou É1) jusqu'au nouveau niveau —
//     l'élève revoit tout le chemin parcouru, segment par segment
//   · Ligne d'âme dédiée (states.level_up.soul avec {level})
//   · UN SEUL bouton "Continuer" — pas de partage, pas de notation.
//     La dignité jusqu'au bout.

export type LevelKind = "cefr" | "yema";

/** Segment d'échelle repeint dans la cérémonie */
interface Segment {
  /** Nom du palier (A1, A2, ou É1, É2 avec un nom : Écoute, Voix…) */
  key: string;
  /** Libellé secondaire (optionnel : "Écoute", "Débutant", etc.) */
  label?: string;
}

export interface LevelUpProps {
  /** Type d'échelle : cefr (A1-C1) ou yema (É1-É5) */
  kind: LevelKind;
  /** Nouveau niveau atteint (ex: "A2" ou "É2") */
  newLevel: string;
  /** Nom éventuel du palier (uniquement en YEMA scale) */
  levelName?: string;
  /** Territoire selon la langue franchie */
  territory: "world" | "sources";
  /** Segments à repeindre — du plus bas au plus haut (inclut le nouveau) */
  segments: Segment[];
  /** Lien du bouton Continuer */
  nextHref: string;
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

export function LevelUp({
  kind,
  newLevel,
  levelName,
  territory,
  segments,
  nextHref,
}: LevelUpProps) {
  const t = useTranslations("states.level_up");
  const locale = useLocale();
  const applyTypo = (s: string) => (locale === "fr" ? frTypo(s) : s);

  // La ligne d'âme change selon l'échelle (CECRL vs YEMA)
  const soulKey = kind === "yema" ? "soulNative" : "soul";
  const soulParams: Record<string, string> =
    kind === "yema"
      ? { level: newLevel.replace(/^É/, ""), name: levelName ?? "" }
      : { level: newLevel };
  const soul = applyTypo(t(soulKey, soulParams));
  const cta = applyTypo(t("action"));

  // Preload : au montage, force scroll top pour la cérémonie plein-page.
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, []);

  return (
    <section
      className={`ceremony level-up territory-${territory}`}
      aria-labelledby="levelup-soul"
    >
      {/* Halo brass qui s'élève lentement (960ms, seule exception dur-ceremony) */}
      <span className="levelup-halo" aria-hidden="true" />

      <div className="ceremony-inner">
        {/* Spine ENTIER — chaque segment se peint en cascade */}
        <ol className="levelup-spine" aria-label={`Parcours ${kind === "yema" ? "YEMA" : "CECRL"}`}>
          {segments.map((seg, i) => (
            <li
              key={seg.key}
              className="levelup-segment"
              data-i={i}
              aria-current={seg.key === newLevel ? "step" : undefined}
            >
              <span className="levelup-segment-dot" aria-hidden="true" />
              <span className="levelup-segment-lbl">
                <span className="levelup-segment-key">{seg.key}</span>
                {seg.label && (
                  <span className="levelup-segment-caption">{seg.label}</span>
                )}
              </span>
            </li>
          ))}
        </ol>

        <h1 id="levelup-soul" className="levelup-soul">
          {renderSoul(soul)}
        </h1>

        <div className="levelup-action">
          <Link href={nextHref} className="ceremony-cta">
            {cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
