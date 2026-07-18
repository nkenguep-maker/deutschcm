// LandingBrand — mark éditorial pour la landing Kaffeehaus.
// Le glyphe est un « Y » sérif traité en laiton, posé dans un carré
// coupé (pas un carré arrondi générique). Wordmark en Fraunces italique
// pour rappeler la culture éditoriale allemande.

export function LandingBrand({ size = 28 }: { size?: number }) {
  return (
    <span className="lbrand" aria-label="Yema Languages">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Cadre laiton légèrement ombré */}
        <rect
          x="1.5"
          y="1.5"
          width="29"
          height="29"
          rx="6"
          fill="none"
          stroke="var(--brass)"
          strokeWidth="1.25"
          opacity="0.55"
        />
        {/* Filet interne — accent chaleur */}
        <rect
          x="4.5"
          y="4.5"
          width="23"
          height="23"
          rx="4"
          fill="var(--brass-glow)"
        />
        {/* Y sérif */}
        <text
          x="16"
          y="22"
          textAnchor="middle"
          fill="var(--brass)"
          fontFamily="var(--font-fraunces), Georgia, serif"
          fontSize="18"
          fontStyle="italic"
          fontWeight="500"
          letterSpacing="-0.02em"
        >
          Y
        </text>
      </svg>
      <span className="lbrand-word">Yema</span>
    </span>
  );
}
