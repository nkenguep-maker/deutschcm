"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useT } from "@/hooks/useT";
import { createClient } from "@/lib/supabase/client";
import { LandingCenters } from "@/components/landing/LandingCenters";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingFinalCta } from "@/components/landing/LandingFinalCta";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingLevels } from "@/components/landing/LandingLevels";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingProblems } from "@/components/landing/LandingProblems";
import { LandingSimulator } from "@/components/landing/LandingSimulator";
import { LandingVision } from "@/components/landing/LandingVision";
import { LandingWhyGermany } from "@/components/landing/LandingWhyGermany";

export default function LandingPage() {
  const router = useRouter();
  const locale = useLocale();
  const { landing: t, nav: tNav } = useT();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  async function handleTestLevel() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      router.push(`/${locale}/test-niveau`);
    } else {
      router.push(`/${locale}/register?next=/${locale}/test-niveau`);
    }
  }

  return (
    <div className="landing">
      <LandingNav
        locale={locale}
        isMobile={isMobile}
        labels={{
          features: t.navFeatures,
          levels: t.navLevels,
          pricing: t.navPricing,
          centers: t.navCenters,
          login: tNav.login,
          register: isMobile ? t.getStarted : tNav.register,
        }}
      />

      <main>
        <LandingHero
          locale={locale}
          onSecondaryClick={handleTestLevel}
          labels={{
            badge: t.badge,
            title: t.title,
            titleAccent: t.titleAccent,
            subtitle: t.subtitle,
            ctaPrimary: t.ctaPrimary,
            ctaSecondary: t.ctaSecondary,
            ctaMicro: t.ctaMicro,
            stat1Value: t.stat1Value,
            stat1Label: t.stat1Label,
            stat2Value: t.stat2Value,
            stat2Label: t.stat2Label,
            stat3Value: t.stat3Value,
            stat3Label: t.stat3Label,
            stat4Value: t.stat4Value,
            stat4Label: t.stat4Label,
          }}
        />

      <LandingVision
        labels={{
          title: t.visionTitle,
          subtitle: t.visionSubtitle,
          items: [
            { label: t.vision1Label, title: t.vision1Title, desc: t.vision1Desc },
            { label: t.vision2Label, title: t.vision2Title, desc: t.vision2Desc },
            { label: t.vision3Label, title: t.vision3Title, desc: t.vision3Desc },
          ],
        }}
      />

      <div className="container"><div className="lsep" /></div>

      <LandingFeatures
        labels={{
          title: t.featuresTitle,
          subtitle: t.featuresSubtitle,
          items: [
            { title: t.feature1Title, desc: t.feature1Desc, badge: t.feature1Badge },
            { title: t.feature2Title, desc: t.feature2Desc },
            { title: t.feature3Title, desc: t.feature3Desc, badge: t.feature3Badge },
            { title: t.feature4Title, desc: t.feature4Desc, badge: t.feature4Badge },
            { title: t.feature5Title, desc: t.feature5Desc, badge: t.feature5Badge },
            { title: t.feature6Title, desc: t.feature6Desc, badge: t.feature6Badge },
            { title: t.feature7Title, desc: t.feature7Desc, badge: t.feature7Badge },
            { title: t.feature8Title, desc: t.feature8Desc, badge: t.feature8Badge },
          ],
        }}
      />

      <LandingLevels
        locale={locale}
        labels={{
          title: t.levelsTitle,
          subtitle: t.levelsSubtitle,
          availableBadge: t.available,
          lockedBadge: t.locked,
          modulesLabel: t.modules,
          items: [
            { code: "A1", name: t.level1Name, desc: t.level1Desc, modules: 48, locked: false },
            { code: "A2", name: t.level2Name, desc: t.level2Desc, modules: 48, locked: false },
            { code: "B1", name: t.level3Name, desc: t.level3Desc, modules: 60, locked: true },
            { code: "B2", name: t.level4Name, desc: t.level4Desc, modules: 40, locked: true },
            { code: "C1", name: t.level5Name, desc: t.level5Desc, modules: 40, locked: true },
          ],
        }}
      />

      <LandingWhyGermany
        labels={{
          title: t.germanyTitle,
          body: t.germanyText,
          items: [t.germany1, t.germany2, t.germany3, t.germany4],
        }}
      />

      <LandingSimulator
        locale={locale}
        labels={{
          eye: t.simTitle,
          title: t.simHeadline,
          body: t.simDesc,
          scenarios: [t.simVisa1, t.simVisa2, t.simVisa3, t.simVisa4, t.simVisa5],
          cta: t.simCta,
          chatName: "Klaus · Coach IA",
          chatStatus: t.simConsulOnline,
          msgs: [
            { who: "them", de: "Hallo! Bitte stellen Sie sich vor.", tr: t.simMsg1 },
            { who: "you", de: "Hallo. Ich heiße Paul. Ich komme aus Kamerun.", tr: t.simMsg2 },
            { who: "them", de: "Warum möchten Sie Deutsch lernen?", tr: t.simMsg3 },
          ],
          scoreLbl: t.simScoreLabel,
          scoreGrammar: t.simGrammar,
          scoreVocab: t.simVocab,
          scoreRelevance: t.simRelevance,
        }}
      />

      <LandingProblems
        labels={{
          title: t.testimonialsTitle,
          items: [
            { title: t.problem1Title, desc: t.problem1Desc },
            { title: t.problem2Title, desc: t.problem2Desc },
            { title: t.problem3Title, desc: t.problem3Desc },
          ],
        }}
      />

      <LandingCenters
        locale={locale}
        labels={{
          eye: t.b2bLabel,
          title: t.centerTitle,
          body: t.centerDesc,
          features: [
            t.centerFeature1,
            t.centerFeature2,
            t.centerFeature3,
            t.centerFeature4,
            t.centerFeature5,
          ],
          cta: t.centerCta,
          plans: [
            { name: "Essentiel", audience: "Petit centre · équipe réduite", price: t.centerOnDemand },
            { name: "Pro", audience: "Centre en croissance · plusieurs classes", price: t.centerOnDemand },
            { name: "Enterprise", audience: "Illimité · support dédié", price: t.centerOnDemand },
          ],
          reassurance: t.centerReassurance,
        }}
      />

      <LandingFaq
        labels={{
          title: t.faqTitle,
          items: [
            { q: t.faq1Q, a: t.faq1A },
            { q: t.faq2Q, a: t.faq2A },
            { q: t.faq3Q, a: t.faq3A },
            { q: t.faq4Q, a: t.faq4A },
            { q: t.faq5Q, a: t.faq5A },
            { q: t.faq6Q, a: t.faq6A },
          ],
        }}
      />

      <LandingFinalCta
        locale={locale}
        labels={{
          live: locale === "en" ? "Open beta · Free A1" : "Bêta ouverte · A1 gratuit",
          titleLine1: locale === "en" ? "Open your first" : "Ouvre ton premier",
          titleAccent: locale === "en" ? "chapter." : "chapitre.",
          body: t.ctaFinalDesc,
          cta: t.ctaFinalBtn,
          micro: t.ctaFinalSocial,
        }}
      />
      </main>

      <LandingFooter
        locale={locale}
        labels={{
          tagline: locale === "en"
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
  );
}
