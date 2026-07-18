// LandingProblems — trois blocs verticaux dans un cadre filet unique,
// chaque bloc a une icône laiton, un titre Fraunces, un paragraphe.

import { IconContext, IconCost, IconTradition } from "./icons";

type Labels = {
  title: string;
  items: readonly {
    title: string;
    desc: string;
  }[];
};

const ICONS = [IconTradition, IconCost, IconContext];

export function LandingProblems({ labels }: { labels: Labels }) {
  return (
    <section className="lsection" id="problems">
      <div className="container">
        <div className="lsection-head centered">
          <div className="lsection-eye">Ce qu&apos;on cherche à résoudre</div>
          <h2 className="lsection-h">{labels.title}</h2>
        </div>

        <div className="lproblems">
          {labels.items.map((p, i) => {
            const Icon = ICONS[i] ?? ICONS[0];
            return (
              <article key={i} className="lproblem">
                <div className="lproblem-icon">
                  <Icon size={24} />
                </div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
