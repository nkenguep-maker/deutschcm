"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingLanguages } from "@/components/landing/LandingLanguages";
import { LandingNav } from "@/components/landing/LandingNav";
import { Seam } from "@/components/design/Seam";
import { BridgePattern } from "@/components/design/BridgePattern";

// /langues — deux territoires YEMA en un seul lieu.
// world (espresso) : langues étrangères CECRL ·
// sources (terre-latérite) : langues natales africaines.
// Une couture laiton les relie, la maille SVG change de trame
// selon le territoire — mais typo, chips, brass restent partagés.

export default function LanguesPage() {
  const locale = useLocale();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const eye = locale === "en" ? "Languages" : "Langues";
  const seamAria = locale === "en"
    ? "Transition to native languages"
    : "Transition vers les langues natales";

  return (
    <div className="landing">
      <LandingNav
        locale={locale}
        isMobile={isMobile}
        labels={{
          features: eye,
          levels: locale === "en" ? "Method" : "Méthode",
          pricing: locale === "en" ? "Manifesto" : "Manifeste",
          centers: locale === "en" ? "Centers" : "Centres",
          login: locale === "en" ? "Log in" : "Se connecter",
          register: locale === "en" ? "Start" : "Commencer",
        }}
      />

      <main>
        {/* ─── Territoire world · langues étrangères CECRL ───────── */}
        <section
          className="territory-world"
          style={{ position: "relative", paddingTop: "clamp(72px, 10vw, 120px)" }}
          aria-labelledby="territory-world-h"
        >
          <BridgePattern variant="world" />
          <div style={{ position: "relative", zIndex: 1 }} id="territory-world-h">
            <LandingLanguages locale={locale} family="foreign" />
          </div>
        </section>

        {/* ─── Couture · le pont YEMA ─────────────────────────────── */}
        <Seam ariaLabel={seamAria} />

        {/* ─── Territoire sources · langues natales africaines ─── */}
        <section
          className="territory-sources"
          style={{ position: "relative", paddingBottom: "clamp(48px, 8vw, 96px)" }}
          aria-labelledby="territory-sources-h"
        >
          <BridgePattern variant="sources" />
          <div style={{ position: "relative", zIndex: 1 }} id="territory-sources-h">
            <LandingLanguages locale={locale} family="native" hideHead />
          </div>
        </section>
      </main>

      <LandingFooter
        locale={locale}
        labels={{
          tagline:
            locale === "en"
              ? "Africa speaks. All its languages — foreign and native, at last one place."
              : "L'Afrique parle. Toutes ses langues — étrangères et natales, enfin un lieu.",
          made:
            locale === "en"
              ? "Built in Cameroon, for the continent and the world"
              : "Construit au Cameroun, pour le continent et le monde",
          legal: locale === "en" ? "Legal" : "Mentions légales",
          terms: locale === "en" ? "Terms" : "CGU",
          privacy: locale === "en" ? "Privacy" : "Confidentialité",
          contact: locale === "en" ? "Contact" : "Contact",
          disclaimer:
            locale === "en"
              ? "YEMA Languages is a pan-African CEFR-aligned platform for foreign languages, and independent for African native languages. Not affiliated with any official examination institute."
              : "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues étrangères, et indépendante pour les langues natales africaines. N'est affiliée à aucun organisme officiel d'examen.",
        }}
      />
    </div>
  );
}
