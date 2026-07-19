"use client";

// SpineItem · anatomie STRUCTURELLE partagée par CefrSpine et YemaSpine.
//
//   <li className="spine-item">
//     <span className="spine-code">{code}</span>       col 1 · 34px fixe
//     <span className="spine-label">{label}</span>     col 2 · 1fr
//   </li>
//
// Le <li> lui-même est le grid container — pas de <button> imbriqué,
// pas de display:contents piégeux. Si l'item est interactif, on pose
// role="button" + tabIndex 0 + onKeyDown pour Enter/Space.

import type { KeyboardEvent } from "react";

export type SpineStatus = "done" | "on" | "next";

interface SpineItemProps {
  code: string;
  label: string;
  status: SpineStatus;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  onEnter?: () => void;
  onLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Tap tactile · sélection au doigt sur mobile. Distinct de onEnter
   *  (hover) car l'utilisateur mobile n'a pas de survol. */
  onSelect?: () => void;
  /** true si cet item est celui dont le détail est affiché — pour
   *  soulever visuellement le point actif (accent laiton). */
  selected?: boolean;
}

export function SpineItem({
  code,
  label,
  status,
  ariaLabel,
  ariaDescribedBy,
  onEnter,
  onLeave,
  onFocus,
  onBlur,
  onSelect,
  selected = false,
}: SpineItemProps) {
  const interactive = Boolean(onEnter || onFocus || onSelect);

  const handleKey = (e: KeyboardEvent<HTMLLIElement>) => {
    if (!interactive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.();
      onFocus?.();
    }
  };

  return (
    <li
      className="spine-item"
      data-status={status}
      data-selected={selected ? "true" : undefined}
      aria-current={status === "on" ? "step" : undefined}
      aria-pressed={interactive && selected ? true : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? (ariaLabel ?? `${code} — ${label}`) : undefined}
      aria-describedby={interactive ? ariaDescribedBy : undefined}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={onSelect}
      onKeyDown={handleKey}
    >
      <span className="spine-code">{code}</span>
      <span className="spine-label">{label}</span>
    </li>
  );
}
