// LandingFooter · Sprint « Les mots de la maison ».
// Trois colonnes :
//   · La maison  · Langues, Méthode, Histoires
//   · Les portes · Devenir enseignant·e, Pour les centres, Tarifs
//   · La règle   · Confidentialité, Conditions, Contact
// Sous les colonnes : slogan support « Toutes vos langues, une
// seule maison. » + signature YEMA + disclaimer CEFR.
// Le manifeste est parqué : page conservée pour réactivation
// ultérieure mais aucun lien depuis nav ou footer.

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
  const isEn = locale === "en";
  const line = isEn ? "YEMA — your way, your voice." : "YEMA — votre voie, votre voix.";
  const support = isEn ? "All your languages, one home." : "Toutes vos langues, une seule maison.";

  const colHome = {
    label: isEn ? "The house" : "La maison",
    items: [
      { label: isEn ? "Languages" : "Langues",      href: `/${locale}/langues` },
      { label: isEn ? "Method" : "Méthode",         href: `/${locale}/methode` },
      { label: isEn ? "Stories" : "Histoires",      href: `/${locale}/histoires` },
    ],
  };
  const colDoors = {
    label: isEn ? "The doors" : "Les portes",
    items: [
      { label: isEn ? "Become a teacher" : "Devenir enseignant·e", href: `/${locale}/enseignants` },
      { label: isEn ? "For language centers" : "Pour les centres", href: `/${locale}/landing` },
      { label: isEn ? "Pricing" : "Tarifs",                        href: `/${locale}/pricing` },
    ],
  };
  const colLaw = {
    label: isEn ? "The rule" : "La règle",
    items: [
      { label: labels.privacy, href: `/${locale}/privacy` },
      { label: labels.terms,   href: `/${locale}/terms` },
      { label: labels.contact, href: "mailto:hello@yema.app" },
    ],
  };

  return (
    <footer className="lfooter">
      <div className="container">
        <div className="lfooter-grid">
          <div className="lfooter-brand">
            <LandingBrand />
            <p className="lfooter-line"><em>{line}</em></p>
            <p className="lfooter-support">{support}</p>
          </div>

          <nav className="lfooter-col" aria-label={colHome.label}>
            <p className="lfooter-col-lbl">{colHome.label}</p>
            {colHome.items.map((it) => (
              <a key={it.href} href={it.href}>{it.label}</a>
            ))}
          </nav>

          <nav className="lfooter-col" aria-label={colDoors.label}>
            <p className="lfooter-col-lbl">{colDoors.label}</p>
            {colDoors.items.map((it) => (
              <a key={it.href} href={it.href}>{it.label}</a>
            ))}
          </nav>

          <nav className="lfooter-col" aria-label={colLaw.label}>
            <p className="lfooter-col-lbl">{colLaw.label}</p>
            {colLaw.items.map((it) => (
              <a key={it.href} href={it.href}>{it.label}</a>
            ))}
          </nav>
        </div>

        <div className="lfooter-bottom">
          <p>{labels.disclaimer}</p>
          <p className="lfooter-made">{labels.made}</p>
        </div>
      </div>
    </footer>
  );
}
