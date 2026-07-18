// BridgePattern · grille SVG laiton discrète (opacity 0.14 max).
// Deux variants qui partagent la même intention (laiton, trait fin,
// répété) mais racontent deux territoires différents :
//
//   - world   : itinéraires — traits diagonaux légers évoquant une
//               carte routière, le voyage extérieur (CECRL).
//   - sources : croisillons tissu — mailles carrées inspirées d'un
//               kente ou d'un panier tressé, l'ancrage intérieur.
//
// L'opacité et la couleur (laiton) sont volontairement communes :
// le pont est le même, on change juste la trame de la maille.

interface BridgePatternProps {
  variant: "world" | "sources";
  /** Optionnel : override du z-index pour poser au-dessus d'un fond
   * complexe. Par défaut, 0 (derrière tout le reste du parent). */
  className?: string;
}

const STROKE = "rgba(184, 135, 62, 0.7)";

export function BridgePattern({ variant, className }: BridgePatternProps) {
  return (
    <div className={`bridge-pattern ${className ?? ""}`} aria-hidden="true">
      <svg viewBox="0 0 400 400" preserveAspectRatio="none">
        <defs>
          {variant === "world" ? (
            /* Itinéraire : diagonales légères 45° espacées de 40 px */
            <pattern
              id="bridge-world"
              x="0"
              y="0"
              width="56"
              height="56"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(30)"
            >
              <line x1="0" y1="0" x2="56" y2="0" stroke={STROKE} strokeWidth="0.6" />
              <circle cx="0" cy="0" r="1.2" fill={STROKE} />
            </pattern>
          ) : (
            /* Croisillons : maille tissu 20×20 (verticales + horizontales) */
            <pattern
              id="bridge-sources"
              x="0"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 0 12 L 24 12 M 12 0 L 12 24"
                stroke={STROKE}
                strokeWidth="0.6"
                fill="none"
              />
              <circle cx="12" cy="12" r="1" fill={STROKE} />
            </pattern>
          )}
        </defs>
        <rect
          x="0"
          y="0"
          width="400"
          height="400"
          fill={variant === "world" ? "url(#bridge-world)" : "url(#bridge-sources)"}
        />
      </svg>
    </div>
  );
}
