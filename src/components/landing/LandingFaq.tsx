// LandingFaq — accordéon warm. Filet 1 px entre chaque question. Bouton
// plein largeur, "+" laiton qui pivote en croix quand ouvert.

"use client";

import { useState } from "react";

type Labels = {
  title: string;
  items: readonly {
    q: string;
    a: string;
  }[];
};

export function LandingFaq({ labels }: { labels: Labels }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="lsection" id="faq">
      <div className="container">
        <div className="lsection-head centered">
          <div className="lsection-eye">Questions</div>
          <h2 className="lsection-h">{labels.title}</h2>
        </div>

        <div className="lfaq">
          {labels.items.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="lfaq-item">
                <button
                  className="lfaq-btn"
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-p-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{faq.q}</span>
                  <span className="lfaq-toggle" aria-hidden="true">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M9 3v12M3 9h12" />
                    </svg>
                  </span>
                </button>
                <div
                  id={`faq-p-${i}`}
                  className="lfaq-panel"
                  hidden={!isOpen}
                >
                  {faq.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
