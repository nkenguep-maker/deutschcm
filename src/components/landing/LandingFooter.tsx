// LandingFooter — warm minimal. Brand, tagline, deux colonnes de liens,
// social en pills laiton. Signature CEFR spine minifiée à droite du brand
// (5e apparition de la signature).

import { LandingBrand } from "./LandingBrand";

type Labels = {
  tagline: string;
  made: string;
  legal: string;
  terms: string;
  privacy: string;
  contact: string;
  disclaimer: string;
};

export function LandingFooter({
  locale,
  labels,
}: {
  locale: string;
  labels: Labels;
}) {
  return (
    <footer className="lfooter">
      <div className="container">
        <div className="lfooter-inner">
          <div className="lfooter-brand">
            <LandingBrand />
            <p className="lfooter-tag">{labels.tagline}</p>
            <p className="lfooter-tag" style={{ opacity: 0.72 }}>
              {labels.made}
            </p>
          </div>

          <nav className="lfooter-links" aria-label="Légal">
            <a href={`/${locale}/terms`}>{labels.terms}</a>
            <a href={`/${locale}/privacy`}>{labels.privacy}</a>
            <a href={`/${locale}/terms`}>{labels.legal}</a>
            <a href="mailto:legal@yema.app">{labels.contact}</a>
          </nav>

          <nav className="lfooter-social" aria-label="Réseaux">
            <a href="#" rel="me">WhatsApp</a>
            <a href="#" rel="me">Instagram</a>
            <a href="#" rel="me">Facebook</a>
          </nav>
        </div>

        <div className="lfooter-bottom">
          {labels.disclaimer}
        </div>
      </div>
    </footer>
  );
}
