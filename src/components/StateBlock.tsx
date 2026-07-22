"use client";

import type { ReactElement } from "react";
import { useLocale } from "next-intl";
import { frTypo } from "@/components/landing/typo";
import { IconArrow, IconCheck } from "@/components/landing/icons";
import { BrandY } from "@/components/brand/BrandY";

// StateBlock — l'UNIQUE façon d'afficher un état secondaire (error,
// empty, loading, success, confirm) dans toute l'application YEMA.
//
// Structure canonique :
//   1. soul  — Fraunces italic, 2 lignes max, le fragment entre *...*
//              se colore en var(--brass). C'est la voix de la maison.
//   2. body  — Manrope, 1-2 phrases, --creme-soft. Le corps qui explique.
//   3. action — bouton brass (obligatoire sauf kind="loading").
//   4. secondary — bouton ghost optionnel.
//
// Entrée : dur-move / ease-enter / translateY(12px). deepTypo appliqué
// côté FR sur les strings passées. aria-live="polite" pour les erreurs.
//
// Rien d'ad hoc : dashboards, pages, modales — tout état passe par ici.

type Kind = "error" | "empty" | "loading" | "success" | "confirm" | "offline" | "locked";

interface ActionSpec {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface StateBlockProps {
  kind: Kind;
  /** Le fragment entre *...* est mis en brass italic. */
  soul: string;
  /** 1-2 phrases max. Optionnel (soul peut suffire). */
  body?: string;
  /** Bouton principal. Obligatoire pour tout kind sauf "loading". */
  action?: ActionSpec;
  /** Bouton ghost secondaire, à droite du principal. */
  secondary?: ActionSpec;
  /** Marque le block comme centré dans la page (vs inline). */
  centered?: boolean;
  /** Compact : padding réduit, pour les inline dans une carte. */
  compact?: boolean;
}

/** Découpe une string "Le réseau a lâché. *Pas votre travail.*"
 * en fragments texte/accent pour rendu Fraunces + brass. */
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

export function StateBlock({
  kind,
  soul,
  body,
  action,
  secondary,
  centered = false,
  compact = false,
}: StateBlockProps) {
  const locale = useLocale();
  const applyTypo = (s: string) => (locale === "fr" ? frTypo(s) : s);

  const soulRendered = applyTypo(soul);
  const bodyRendered = body ? applyTypo(body) : undefined;

  const isLoading = kind === "loading";
  const ariaLive = kind === "error" || kind === "offline" ? "polite" : undefined;
  const role = kind === "error" ? "alert" : kind === "offline" ? "status" : undefined;

  const renderAction = (spec: ActionSpec, isPrimary: boolean) => {
    const cls = `state-cta ${isPrimary ? "" : "ghost"}`;
    const inner = (
      <>
        <span>{applyTypo(spec.label)}</span>
        {isPrimary && (
          <span aria-hidden="true" style={{ display: "inline-flex" }}>
            <IconArrow size={14} />
          </span>
        )}
      </>
    );
    if (spec.href) {
      return (
        <a href={spec.href} className={cls}>
          {inner}
        </a>
      );
    }
    return (
      <button type="button" className={cls} onClick={spec.onClick}>
        {inner}
      </button>
    );
  };

  return (
    <section
      className={`state-block state-${kind} ${centered ? "centered" : ""} ${compact ? "compact" : ""}`}
      role={role}
      aria-live={ariaLive}
    >
      {isLoading && (
        // Loader unifié : BrandY state="loader" — braise qui pulse
        // en boucle 2.4s, aucun spinner générique.
        <span className="state-pulse" aria-hidden="true">
          <BrandY variant="mono" state="loader" size={40} />
        </span>
      )}
      {kind === "success" && (
        <span className="state-check" aria-hidden="true">
          <IconCheck size={22} strokeWidth={2.25} />
        </span>
      )}

      <h3 className="state-soul">{renderSoul(soulRendered)}</h3>

      {bodyRendered && (
        <p className="state-body">{bodyRendered}</p>
      )}

      {(action || secondary) && (
        <div className="state-actions">
          {action && renderAction(action, true)}
          {secondary && renderAction(secondary, false)}
        </div>
      )}
    </section>
  );
}
