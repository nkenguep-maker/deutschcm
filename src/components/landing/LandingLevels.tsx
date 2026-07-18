// LandingLevels — CEFR ladder plein cadre. CEFR spine à gauche (sticky sur
// desktop, cachée sur mobile), ligne éditoriale par niveau à droite. La
// signature se rejoue ici pour la deuxième fois.

import { CefrSpine } from "./CefrSpine";

type LevelLabels = {
  title: string;
  subtitle: string;
  availableBadge: string;
  lockedBadge: string;
  modulesLabel: string;
  items: readonly {
    code: string;
    name: string;
    desc: string;
    modules: number;
    locked: boolean;
  }[];
};

export function LandingLevels({
  labels,
  locale,
}: {
  labels: LevelLabels;
  locale: string;
}) {
  return (
    <section className="lsection" id="levels">
      <div className="container">
        <div className="lsection-head centered">
          <div className="lsection-eye">Programme CECRL</div>
          <h2 className="lsection-h">{labels.title}</h2>
          <p className="lsection-lede">{labels.subtitle}</p>
        </div>

        <div className="llevels">
          <div className="llevels-spine">
            <CefrSpine current="A1" locale={locale === "en" ? "en" : "fr"} />
          </div>

          <div className="llevels-list">
            {labels.items.map((lvl) => (
              <div
                key={lvl.code}
                className={`llevel${lvl.locked ? " locked" : ""}`}
              >
                <div className="llevel-code" aria-hidden="true">
                  {lvl.code}
                </div>
                <div className="llevel-body">
                  <h3>{lvl.name}</h3>
                  <p>{lvl.desc}</p>
                </div>
                <div className="llevel-meta">
                  <span className="llevel-badge">
                    {lvl.locked ? labels.lockedBadge : labels.availableBadge}
                  </span>
                  <span className="llevel-count" data-num>
                    {lvl.modules}
                  </span>
                  <span className="llevel-count-lbl">{labels.modulesLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
