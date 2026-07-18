// LandingCenters — offre B2B. 2 col : texte + features à gauche, plans à
// droite dans un cadre filet. Icônes SVG maison, pas d'emoji.

"use client";

import { useRouter } from "next/navigation";
import {
  IconAnalytics,
  IconHandshake,
  IconInstitution,
  IconPath,
  IconTeacher,
} from "./icons";

type Labels = {
  eye: string;
  title: string;
  body: string;
  features: readonly string[];
  cta: string;
  plans: readonly {
    name: string;
    audience: string;
    price: string;
  }[];
  reassurance: string;
};

const FEATURE_ICONS = [
  IconInstitution,
  IconAnalytics,
  IconTeacher,
  IconPath,
  IconHandshake,
];

export function LandingCenters({
  locale,
  labels,
}: {
  locale: string;
  labels: Labels;
}) {
  const router = useRouter();

  return (
    <section className="lsection" id="centres">
      <div className="container">
        <div className="lcenters">
          <div>
            <div className="lsection-eye">{labels.eye}</div>
            <h2 className="lsection-h">{labels.title}</h2>
            <p className="lsection-lede" style={{ marginBottom: 0 }}>
              {labels.body}
            </p>

            <div className="lcenters-features">
              {labels.features.map((f, i) => {
                const Icon = FEATURE_ICONS[i] ?? FEATURE_ICONS[0];
                return (
                  <div key={i} className="lcenter-feat">
                    <span className="lcenter-feat-icon" aria-hidden="true">
                      <Icon size={22} />
                    </span>
                    <span>{f}</span>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="lhero-btn-primary"
              onClick={() => router.push(`/${locale}/register`)}
            >
              {labels.cta}
              <span className="lhero-btn-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </div>

          <div>
            <div className="lcenter-plans">
              {labels.plans.map((p) => (
                <div key={p.name} className="lcenter-plan">
                  <div>
                    <p className="lcenter-plan-name">{p.name}</p>
                    <p className="lcenter-plan-audience">{p.audience}</p>
                  </div>
                  <span className="lcenter-plan-price">{p.price}</span>
                </div>
              ))}
            </div>
            <p className="lcenter-reassure">{labels.reassurance}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
