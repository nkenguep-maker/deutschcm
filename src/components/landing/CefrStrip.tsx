// CefrStrip — variante horizontale de la CEFR spine, pour usage secondaire
// (footer signature, small callouts). Compact, non-interactif.

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
type Level = (typeof LEVELS)[number];

export function CefrStrip({
  current = "A1",
  ariaLabel = "Progression CECRL",
}: {
  current?: Level;
  ariaLabel?: string;
}) {
  const currentIdx = LEVELS.indexOf(current);
  return (
    <div
      className="cefr-strip"
      role="img"
      aria-label={`${ariaLabel} — ${current}`}
    >
      {LEVELS.map((lvl, i) => {
        const state = i < currentIdx ? "done" : i === currentIdx ? "on" : "next";
        return (
          <span key={lvl} className={`cefr-strip-step ${state}`}>
            <span className="cefr-strip-dot" aria-hidden="true" />
            <span className="cefr-strip-lbl">{lvl}</span>
          </span>
        );
      })}
    </div>
  );
}
