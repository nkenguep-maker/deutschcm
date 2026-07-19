"use client";

// Landing YEMA · Programme « La Maison » — Sprint 1.
// Le Seuil (validé) reste intact au-dessus. Sous #landing, les 6
// pièces qui structurent la visite : couture (structurante), veillée,
// mur des visages, échelle, teaser, porte du fond. La nav et le
// footer sont conservés — tout le reste (Vision/Features/Levels/
// WhyGermany/Simulator/Problems/Centers/Faq/FinalCta/Hero) a été
// retiré. Le contenu utile de ces sections sera redistribué vers
// /methode, /eleves et /landing B2B dans les sprints ultérieurs.

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
      {/* ── LE SEUIL ── entrée immersive, une session par visiteur. */}
      <Seuil locale={loc} entryHref="#landing" />

      {/* ── LA MAISON ─── */}
      <div id="landing" tabIndex={-1}>
        <LandingNav
          locale={locale}
          isMobile={isMobile}
          labels={{
            features: loc === "en" ? "Languages" : "Langues",
            levels: loc === "en" ? "Method" : "Méthode",
            pricing: loc === "en" ? "Stories" : "Histoires",
            centers: loc === "en" ? "Centers" : "Centres",
            login: tNav.login,
            register: isMobile ? t.getStarted : tNav.register,
          }}
        />

        <main>
          {/* b) LA COUTURE — la pièce structurante */}
          <MaisonCouture locale={loc} />

          {/* a) LA VEILLÉE — la grand-mère parle, nous écoutons */}
          <MaisonVeillee locale={loc} />

          {/* c) LE MUR DES VISAGES — cinq voix, cinq maisons */}
          <MaisonVisages locale={loc} />

          {/* d) L'ÉCHELLE — deux échelles côte à côte */}
          <MaisonEchelle locale={loc} />

          {/* e) TEASER — le premier chapitre s'écrit en allemand */}
          <Teaser
            locale={loc}
            line1={loc === "en"
              ? "The first chapter is written in German."
              : "Le premier chapitre s'écrit en allemand."}
            line2={loc === "en"
              ? "The next ones are already being written."
              : "Les suivants s'écrivent déjà."}
          />

          {/* f) LA PORTE DU FOND — entrez, la maison est ouverte */}
          <MaisonPorte locale={loc} />
        </main>

        <LandingFooter
          locale={locale}
          labels={{
            tagline: loc === "en"
              ? "Africa speaks. All its languages — foreign and native, at last one place."
              : "L'Afrique parle. Toutes ses langues — étrangères et natales, enfin un lieu.",
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
