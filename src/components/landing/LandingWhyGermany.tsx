// LandingWhyGermany — 2-col éditorial. Texte long à gauche, liste checkée
// à droite avec filet vertical laiton.

import { IconCheck } from "./icons";

type Labels = {
  title: string;
  body: string;
  items: readonly string[];
};

export function LandingWhyGermany({ labels }: { labels: Labels }) {
  return (
    <section className="lsection" id="why-germany">
      <div className="container">
        <div className="lgermany">
          <div>
            <div className="lsection-eye">Destination</div>
            <h2 className="lsection-h" style={{ marginBottom: 20 }}>
              {labels.title}
            </h2>
            <p className="lsection-lede" style={{ marginBottom: 0 }}>
              {labels.body}
            </p>
          </div>

          <ul className="lgermany-list">
            {labels.items.map((it, i) => (
              <li key={i} className="lgermany-item">
                <span className="lgermany-check" aria-hidden="true">
                  <IconCheck size={16} strokeWidth={2} />
                </span>
                <p>{it}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
