"use client";

// SpineItem · anatomie STRUCTURELLE partagée par CefrSpine et YemaSpine.
//
//   <li className="spine-item">
//     <span className="spine-code">{code}</span>       col 1 · 34px fixe
//     <span className="spine-label">{label}</span>     col 2 · 1fr
//   </li>
//
// Chaque item reste un <li> sémantique. L'interaction est portée par un
// vrai <button> interne afin de conserver les comportements clavier natifs.

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

  const content = (
    <>
      <span className="spine-code">{code}</span>
      <span className="spine-label">{label}</span>
    </>
  );

  return (
    <li
      className="spine-item"
      data-status={status}
      data-selected={selected ? "true" : undefined}
      aria-current={status === "on" ? "step" : undefined}
    >
      {interactive ? (
        <button
          type="button"
          className="spine-item-button"
          aria-pressed={selected}
          aria-label={ariaLabel ?? `${code} — ${label}`}
          aria-describedby={ariaDescribedBy}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onFocus={onFocus}
          onBlur={onBlur}
          onClick={onSelect}
        >
          {content}
        </button>
      ) : (
        <span className="spine-item-static">{content}</span>
      )}
    </li>
  );
}
