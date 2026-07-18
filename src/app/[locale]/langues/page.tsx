"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingLanguages } from "@/components/landing/LandingLanguages";
import { LandingNav } from "@/components/landing/LandingNav";

// /langues — page dédiée à l'ensemble des langues YEMA (étrangères + natales).
// Accessible depuis la nav "Langues".

export default function LanguesPage() {
  const locale = useLocale();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="landing">
      <LandingNav
        locale={locale}
        isMobile={isMobile}
        labels={{
          features: locale === "en" ? "Languages" : "Langues",
          levels: locale === "en" ? "Method" : "Méthode",
          pricing: locale === "en" ? "Manifesto" : "Manifeste",
          centers: locale === "en" ? "Centers" : "Centres",
          login: locale === "en" ? "Log in" : "Se connecter",
          register: locale === "en" ? "Start" : "Commencer",
        }}
      />

      <main>
        <div style={{ paddingTop: "clamp(72px, 10vw, 120px)" }}>
          <LandingLanguages locale={locale} />
        </div>
      </main>

      <LandingFooter
        locale={locale}
        labels={{
          tagline:
            locale === "en"
              ? "Africa speaks. All its languages — foreign and native, at last one place."
              : "L’Afrique parle. Toutes ses langues — étrangères et natales, enfin un lieu.",
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
              : "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues étrangères, et indépendante pour les langues natales africaines. N’est affiliée à aucun organisme officiel d’examen.",
        }}
      />
    </div>
  );
}
