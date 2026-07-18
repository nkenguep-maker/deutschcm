"use client";

import { useRouter } from "next/navigation";
import { CefrSpine } from "./CefrSpine";

type HeroLabels = {
  badge: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  ctaMicro: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  stat4Value: string;
  stat4Label: string;
};

export function LandingHero({
  locale,
  labels,
  onSecondaryClick,
}: {
  locale: string;
  labels: HeroLabels;
  onSecondaryClick: () => void;
}) {
  const router = useRouter();

  return (
    <section className="lhero">
      <div className="container">
        <div className="lhero-inner">
          <div>
            <div className="lhero-eye rise rise-1">{labels.badge}</div>

            <h1 className="lhero-h1 rise rise-2">
              {labels.title}
              <br />
              <em>{labels.titleAccent}</em>
            </h1>

            <p className="lhero-lede rise rise-3">{labels.subtitle}</p>

            <div className="lhero-cta rise rise-4">
              <button
                type="button"
                className="lhero-btn-primary"
                onClick={() => router.push(`/${locale}/register`)}
              >
                {labels.ctaPrimary}
                <span className="lhero-btn-arrow" aria-hidden="true">
                  →
                </span>
              </button>
              <button
                type="button"
                className="lhero-btn-ghost"
                onClick={onSecondaryClick}
              >
                {labels.ctaSecondary}
              </button>
            </div>

            <p className="lhero-micro rise rise-5">{labels.ctaMicro}</p>

            <div className="lhero-stats rise rise-6">
              {[
                { v: labels.stat1Value, l: labels.stat1Label },
                { v: labels.stat2Value, l: labels.stat2Label },
                { v: labels.stat3Value, l: labels.stat3Label },
                { v: labels.stat4Value, l: labels.stat4Label },
              ].map((s, i) => (
                <div key={i} className="lhero-stat">
                  <div className="lhero-stat-num">{s.v}</div>
                  <div className="lhero-stat-lbl">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Signature — CEFR spine à droite, aligne le sujet dès le hero */}
          <aside className="lhero-spine rise rise-3" aria-hidden="false">
            <CefrSpine
              current="A1"
              locale={locale === "en" ? "en" : "fr"}
            />
          </aside>
        </div>
      </div>
    </section>
  );
}
