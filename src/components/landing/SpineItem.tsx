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
}: SpineItemProps) {
  const interactive = Boolean(onEnter || onFocus);

  const handleKey = (e: KeyboardEvent<HTMLLIElement>) => {
    if (!interactive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onFocus?.();
    }
  };

  return (
    <li
      className="spine-item"
      data-status={status}
      aria-current={status === "on" ? "step" : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? (ariaLabel ?? `${code} — ${label}`) : undefined}
      aria-describedby={interactive ? ariaDescribedBy : undefined}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={handleKey}
    >
      <span className="spine-code">{code}</span>
      <span className="spine-label">{label}</span>
    </li>
  );
}
