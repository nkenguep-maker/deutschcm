// CefrSpine — signature MUNTU-scale pour Yema. Une colonne verticale qui
// dessine la progression A1 → C1. Réutilisable partout : hero, section
// levels, dashboard learner, OG image (via variante SVG).
// La position "current" est peinte en laiton, le reste reste en filet.

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_META: Record<Level, { fr: string; en: string }> = {
  A1: { fr: "Se présenter", en: "Introduce yourself" },
  A2: { fr: "Vie courante", en: "Everyday life" },
  B1: { fr: "S'exprimer", en: "Express yourself" },
  B2: { fr: "Argumenter", en: "Argue a point" },
  C1: { fr: "Maîtriser", en: "Master the language" },
};

export function CefrSpine({
  current = "A1",
  locale = "fr",
  compact = false,
}: {
  current?: Level;
  locale?: "fr" | "en";
  compact?: boolean;
}) {
  const currentIdx = LEVELS.indexOf(current);
  // pct : où couper le filet laiton continu. Le trait est plein jusqu'à
  // la position du niveau en cours, puis creux jusqu'à C1.
  const pct = ((currentIdx + 0.5) / LEVELS.length) * 100;

  return (
    <ol
      className="cefr-spine"
      style={{
        // token dynamique consommé par le linear-gradient de ::before
        // (cf. globals.css > .cefr-spine::before)
        ["--current-pct" as string]: `${pct}%`,
        ["--step" as string]: compact ? "34px" : "44px",
      }}
      aria-label={
        locale === "fr"
          ? `Progression CECRL — niveau actuel ${current}`
          : `CEFR progression — current level ${current}`
      }
    >
      {LEVELS.map((lvl, i) => {
        const status =
          i < currentIdx ? "done" : i === currentIdx ? "on" : "next";
        return (
          <li
            key={lvl}
            className={`cefr-step ${status}`}
            aria-current={status === "on" ? "step" : undefined}
          >
            <span className="dot" aria-hidden="true" />
            <span className="lbl">
              <span className="lvl">{lvl}</span>
              {!compact ? (
                <span className="cefr-step-caption">
                  {LEVEL_META[lvl][locale === "en" ? "en" : "fr"]}
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
