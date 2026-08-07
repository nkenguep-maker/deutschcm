// LandingFooter · surface publique YEMA.
// Les liens sont filtrés par la matrice release : une page PRIVATE/HIDDEN
// reste disponible pour l'équipe mais n'est jamais promue depuis le footer.

import { isPubliclyLinked, type PublicSurfaceId } from "@/lib/release/publicSurface";
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

type FooterItem = {
  label: string;
  href: string;
  surface?: PublicSurfaceId;
};

function publicItems(items: FooterItem[]): FooterItem[] {
  return items.filter((item) => !item.surface || isPubliclyLinked(item.surface));
}

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
    items: publicItems([
      { label: isEn ? "Languages" : "Langues", href: `/${locale}/langues`, surface: "languages" },
      { label: isEn ? "Method" : "Méthode", href: `/${locale}/methode`, surface: "method" },
    ]),
  };
  const colDoors = {
    label: isEn ? "The doors" : "Les portes",
    items: publicItems([
      { label: isEn ? "Become a teacher" : "Devenir enseignant·e", href: `/${locale}/enseignants`, surface: "teachers" },
      { label: isEn ? "For language centers" : "Pour les centres", href: `/${locale}/landing`, surface: "centers" },
      { label: isEn ? "Pricing" : "Tarifs", href: `/${locale}/pricing`, surface: "pricing" },
    ]),
  };
  const colLaw = {
    label: isEn ? "The rule" : "La règle",
    items: [
      { label: labels.privacy, href: `/${locale}/privacy` },
      { label: labels.terms, href: `/${locale}/terms` },
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
