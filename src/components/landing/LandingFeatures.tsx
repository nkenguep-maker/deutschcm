// LandingFeatures — grille éditoriale 4×2 avec SVG maison, filets 1 px
// laiton entre les cellules. Chaque feature relie à une compétence
// linguistique (Sprechen/Hören/Lesen/Schreiben/Grammatik) ou à un rôle.

import type { ReactNode } from "react";
import {
  IconAdaptif,
  IconAnalytics,
  IconClasse,
  IconGrammatik,
  IconHoeren,
  IconInstitution,
  IconSchreiben,
  IconSprechen,
} from "./icons";

type FeatureLabels = {
  title: string;
  subtitle: string;
  items: readonly {
    title: string;
    desc: string;
    badge?: string;
  }[];
};

const ICON_ORDER: readonly ((p: { size?: number; className?: string }) => ReactNode)[] = [
  IconSprechen,
  IconHoeren,
  IconGrammatik,
  IconSchreiben,
  IconAdaptif,
  IconClasse,
  IconInstitution,
  IconAnalytics,
];

export function LandingFeatures({ labels }: { labels: FeatureLabels }) {
  return (
    <section className="lsection" id="features">
      <div className="container">
        <div className="lsection-head centered">
          <div className="lsection-eye">Ce que Yema apporte</div>
          <h2 className="lsection-h">{labels.title}</h2>
          <p className="lsection-lede">{labels.subtitle}</p>
        </div>

        <div className="lfeatures">
          {labels.items.map((f, i) => {
            const Icon = ICON_ORDER[i] ?? ICON_ORDER[0];
            return (
              <article key={i} className="lfeature">
                <div className="lfeature-icon">
                  <Icon size={22} />
                </div>
                <div className="lfeature-head">
                  <h3 className="lfeature-title">{f.title}</h3>
                  {f.badge ? <span className="lfeature-badge">{f.badge}</span> : null}
                </div>
                <p className="lfeature-desc">{f.desc}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
