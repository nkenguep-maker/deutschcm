// 404 designée — voix Yema, une phrase allemande courte pédagogique,
// CEFR spine à droite (réutilisation signature).

import Link from "next/link";
import { CefrSpine } from "@/components/landing/CefrSpine";
import { LandingBrand } from "@/components/landing/LandingBrand";

type Copy = {
  code: string;
  h: string;
  hEm: string;
  lede: string;
  cta: string;
  learn: string;
};

const COPY_FR: Copy = {
  code: "404 · Page introuvable",
  h: "Verlaufen ?",
  hEm: "Rentre à la maison.",
  lede: "La page que tu cherches n'existe pas — ou a changé d'adresse. En allemand, « verlaufen » veut dire s'égarer. Ça arrive.",
  cta: "Revenir à l'accueil",
  learn: "sich verlaufen · v. réfl. · s'égarer, se perdre",
};


export default function NotFound() {
  // Sans accès au segment [locale] depuis not-found root, on tape FR par défaut.
  // Si l'URL contient /en/, on switche (parsing léger côté client via CSS/JS
  // n'est pas dispo ici en RSC — accepte le fallback FR pour l'instant).
  const copy = COPY_FR;
  const locale = "fr" as string;

  return (
    <div className="l404 landing">
      <nav className="lnav solid" style={{ position: "sticky" }}>
        <Link href={`/${locale}`} className="lnav-brand">
          <LandingBrand />
        </Link>
      </nav>

      <main className="container l404-main">
        <div>
          <div className="l404-code">{copy.code}</div>
          <h1 className="l404-h">
            {copy.h}
            <br />
            <em>{copy.hEm}</em>
          </h1>
          <p className="l404-lede">{copy.lede}</p>
          <Link href={`/${locale}`} className="l404-cta">
            {copy.cta}
            <span aria-hidden="true">→</span>
          </Link>

          <p
            style={{
              marginTop: 40,
              fontFamily: "var(--font-jetbrains, monospace)",
              fontSize: 12,
              color: "var(--creme-mute)",
              letterSpacing: "0.03em",
            }}
          >
            {copy.learn}
          </p>
        </div>

        <aside aria-hidden="true">
          <CefrSpine current="A1" locale={locale === "en" ? "en" : "fr"} />
        </aside>
      </main>

      <footer
        style={{
          padding: "24px 0 32px",
          textAlign: "center",
          color: "var(--creme-mute)",
          fontSize: 12,
          borderTop: "1px solid var(--creme-hair)",
        }}
      >
        <div className="container">
          Yema Languages · Bêta ouverte · CEFR A1 → C1
        </div>
      </footer>
    </div>
  );
}
