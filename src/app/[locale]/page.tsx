"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useT } from "@/hooks/useT";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { Seuil } from "@/components/seuil/Seuil";
import { MaisonCouture } from "@/components/maison/MaisonCouture";
import { MaisonVeillee } from "@/components/maison/MaisonVeillee";
import { MaisonVisages } from "@/components/maison/MaisonVisages";
import { MaisonEchelle } from "@/components/maison/MaisonEchelle";
import { MaisonPorte } from "@/components/maison/MaisonPorte";
import { Teaser } from "@/components/maison/Teaser";

export default function LandingPage() {
  const locale = useLocale();
  const { landing: t, nav: tNav } = useT();
  const [isMobile, setIsMobile] = useState(false);
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="landing">
      <Seuil locale={loc} entryHref="#landing" />
      <div id="landing" tabIndex={-1}>
        <LandingNav
          locale={locale}
          isMobile={isMobile}
          labels={{
            features: loc === "en" ? "Languages" : "Langues",
            levels: loc === "en" ? "Method" : "Méthode",
            pricing: loc === "en" ? "Pricing" : "Tarifs",
            centers: loc === "en" ? "Centers" : "Centres",
            login: tNav.login,
            register: loc === "en" ? "Beta access" : "Accès bêta",
          }}
        />
        <main>
          <MaisonCouture locale={loc} />
          <MaisonVeillee locale={loc} />
          <MaisonVisages locale={loc} />
          <MaisonEchelle locale={loc} />
          <Teaser
            locale={loc}
            line1={loc === "en" ? "The first chapter is written in German." : "Le premier chapitre s'écrit en allemand."}
            line2={loc === "en" ? "The next ones are already being written." : "Les suivants s'écrivent déjà."}
          />
          <MaisonPorte locale={loc} />
        </main>
        <LandingFooter
          locale={locale}
          labels={{
            tagline: loc === "en" ? "Africa speaks. All its languages — foreign and native, at last one place." : "L'Afrique parle. Toutes ses langues — du monde et africaines, enfin un lieu.",
            made: t.footerMade,
            legal: t.footerLegal,
            terms: t.footerTerms,
            privacy: t.footerPrivacy,
            contact: t.footerContact,
            disclaimer: t.footerDisclaimer,
          }}
        />
      </div>
    </div>
  );
}
