// Seam · la couture entre les deux territoires YEMA.
// Dégradé espresso → terre sur ~120 px + halo laiton radial centré
// + monogramme Y (BrandKeystone) posé au centre. Composant soigné,
// pas un simple div de transition.

interface SeamProps {
  /** Étiquette lisible par les lecteurs d'écran. Facultatif : par défaut,
   * la couture est décorative (aria-hidden). */
  ariaLabel?: string;
}

export function Seam({ ariaLabel }: SeamProps) {
  const decorative = !ariaLabel;
  return (
    <div
      className="seam"
      role={decorative ? undefined : "separator"}
      aria-label={ariaLabel}
      aria-hidden={decorative || undefined}
    >
      <span className="seam-line seam-line-top" aria-hidden="true" />
      <span className="seam-halo" aria-hidden="true" />
      <span className="seam-key" aria-hidden="true">Y</span>
      <span className="seam-line seam-line-bottom" aria-hidden="true" />
    </div>
  );
}
