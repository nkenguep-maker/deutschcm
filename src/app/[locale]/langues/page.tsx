"use client";

// /langues · Sprint 2 « La carte des voix ».
// Territoire world (espresso) : les 6 étrangères, CECRL, présent sec.
// L'allemand porte « le premier chapitre » — seul repère de statut.
// Couture Seam avec halo brass au scroll.
// Territoire sources (terre) : les 4 natales (bassa, wolof, swahili,
// lingala) avec l'échelle YEMA en cinq paliers (ancres culturelles
// + can-do + équivalence ACTFL discrète). SeuilGreetings dispersées
// dans les murs — la page s'écoute.
// Aucune liste « à venir ». Aucun statut « disponible ». Le teaser
// final annonce l'extension sans nommer les prochaines langues.

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { Seam } from "@/components/design/Seam";
import { SeuilGreetings } from "@/components/seuil/SeuilGreeting";
import { Teaser } from "@/components/maison/Teaser";
import { YEMA_LEVELS } from "@/lib/yemaScale";
import { frTypo } from "@/components/landing/typo";

// ─── Registre local pour cette page ────────────────────────────────
// On garde le registre langues.ts pour le SpaceSwitcher/LanguageChooser
// mais on définit ici l'ordre éditorial d'affichage — pas de statut,
// pas de « à venir ».

interface LangueDisplay {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  region: string;
  regionEn: string;
  /** Une note éditoriale courte, unique, non chiffrée. */
  note?: string;
  noteEn?: string;
}

const FOREIGN: readonly LangueDisplay[] = [
  { id: "deutsch",  code: "DE", name: "Allemand",  nameEn: "German",     region: "Allemagne · Autriche · Suisse", regionEn: "Germany · Austria · Switzerland",
    note: "Le premier chapitre s'écrit ici.", noteEn: "The first chapter is written here." },
  { id: "anglais",  code: "EN", name: "Anglais",   nameEn: "English",    region: "International", regionEn: "International" },
  { id: "francais", code: "FR", name: "Français",  nameEn: "French",     region: "Francophonie", regionEn: "Francophone world" },
  { id: "espagnol", code: "ES", name: "Espagnol",  nameEn: "Spanish",    region: "Amérique · Europe", regionEn: "Americas · Europe" },
  { id: "portugais",code: "PT", name: "Portugais", nameEn: "Portuguese", region: "Europe · Amérique", regionEn: "Europe · Americas" },
  { id: "arabe",    code: "AR", name: "Arabe",     nameEn: "Arabic",     region: "Afrique du Nord · Golfe", regionEn: "North Africa · Gulf" },
];

const NATIVE: readonly LangueDisplay[] = [
  { id: "bassa",   code: "BS", name: "Bassa",   nameEn: "Bassa",   region: "Cameroun",         regionEn: "Cameroon" },
  { id: "wolof",   code: "WO", name: "Wolof",   nameEn: "Wolof",   region: "Sénégal · Gambie · Mauritanie", regionEn: "Senegal · Gambia · Mauritania" },
  { id: "swahili", code: "SW", name: "Swahili", nameEn: "Swahili", region: "Afrique de l'Est", regionEn: "East Africa" },
  { id: "lingala", code: "LN", name: "Lingala", nameEn: "Lingala", region: "RD Congo · Congo", regionEn: "DRC · Congo" },
];

interface Copy {
  worldKicker: string;
  worldTitle: string;
  worldTitleEm: string;
  worldLede: string;
  worldScaleCap: string;
  sourcesKicker: string;
  sourcesTitle: string;
  sourcesTitleEm: string;
  sourcesLede: string;
  sourcesScaleCap: string;
  scaleTableTitle: string;
  scaleTableEm: string;
  scaleTablePhrase: string;
  colStage: string;
  colName: string;
  colAnchor: string;
  colActfl: string;
  navFeatures: string;
  navLevels: string;
  navPricing: string;
  navCenters: string;
  navLogin: string;
  navRegister: string;
  footerTagline: string;
  footerMade: string;
  footerLegal: string;
  footerTerms: string;
  footerPrivacy: string;
  footerContact: string;
  footerDisclaimer: string;
  ariaWorld: string;
  ariaSources: string;
  ariaSeam: string;
}

const COPY_FR: Copy = {
  worldKicker: "Voyage vers le monde",
  worldTitle: "Six langues étrangères.",
  worldTitleEm: "Une seule échelle.",
  worldLede: "L'échelle CECRL structure les six voyages. Le premier chapitre s'écrit en allemand — le reste s'écrit déjà.",
  worldScaleCap: "CECRL · A1 → C1",
  sourcesKicker: "Retour aux sources",
  sourcesTitle: "Quatre langues natales.",
  sourcesTitleEm: "Une échelle ancrée dans la vie.",
  sourcesLede: "L'échelle YEMA parle par ce que l'on fait avec la langue : saluer, échanger, raconter, débattre, transmettre.",
  sourcesScaleCap: "YEMA · É1 → É5",
  scaleTableTitle: "Cinq paliers.",
  scaleTableEm: "Cinq moments de vie.",
  scaleTablePhrase: "Chaque palier a son ancre culturelle et son équivalence en cadre international.",
  colStage: "Palier",
  colName: "Nom",
  colAnchor: "Moment de vie",
  colActfl: "Équivalence",
  navFeatures: "Langues",
  navLevels: "Méthode",
  navPricing: "Manifeste",
  navCenters: "Centres",
  navLogin: "Se connecter",
  navRegister: "Commencer",
  footerTagline: "L'Afrique parle. Toutes ses langues — étrangères et natales, enfin un lieu.",
  footerMade: "Construit au Cameroun, pour le continent et le monde",
  footerLegal: "Mentions légales",
  footerTerms: "CGU",
  footerPrivacy: "Confidentialité",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues étrangères, et indépendante pour les langues natales africaines. N'est affiliée à aucun organisme officiel d'examen.",
  ariaWorld: "Territoire des langues étrangères",
  ariaSources: "Territoire des langues natales",
  ariaSeam: "La couture entre les deux territoires",
};

const COPY_EN: Copy = {
  worldKicker: "A journey outward",
  worldTitle: "Six foreign languages.",
  worldTitleEm: "One scale.",
  worldLede: "The CEFR scale structures all six journeys. The first chapter is written in German — the next ones are already being written.",
  worldScaleCap: "CEFR · A1 → C1",
  sourcesKicker: "A return to the source",
  sourcesTitle: "Four native languages.",
  sourcesTitleEm: "A scale anchored in life.",
  sourcesLede: "The YEMA scale speaks through what the language does with you: greet, exchange, tell, debate, pass on.",
  sourcesScaleCap: "YEMA · É1 → É5",
  scaleTableTitle: "Five stages.",
  scaleTableEm: "Five lived moments.",
  scaleTablePhrase: "Each stage has its cultural anchor and its equivalence in the international framework.",
  colStage: "Stage",
  colName: "Name",
  colAnchor: "Life moment",
  colActfl: "Equivalence",
  navFeatures: "Languages",
  navLevels: "Method",
  navPricing: "Manifesto",
  navCenters: "Centers",
  navLogin: "Log in",
  navRegister: "Start",
  footerTagline: "Africa speaks. All its languages — foreign and native, at last one place.",
  footerMade: "Built in Cameroon, for the continent and the world",
  footerLegal: "Legal",
  footerTerms: "Terms",
  footerPrivacy: "Privacy",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages is a pan-African CEFR-aligned platform for foreign languages, and independent for African native languages. Not affiliated with any official examination institute.",
  ariaWorld: "Foreign languages territory",
  ariaSources: "Native languages territory",
  ariaSeam: "The seam between the two territories",
};

// ─── Carte langue ───────────────────────────────────────────────────
function LangueCard({ lang, locale }: { lang: LangueDisplay; locale: "fr" | "en" }) {
  const name = locale === "en" ? lang.nameEn : lang.name;
  const region = locale === "en" ? lang.regionEn : lang.region;
  const note = locale === "en" ? lang.noteEn : lang.note;
  const t = (s: string) => (locale === "fr" ? frTypo(s) : s);
  return (
    <article className="langue-card">
      <div className="langue-card-mono" aria-hidden="true">{lang.code}</div>
      <div className="langue-card-body">
        <h3 className="langue-card-name">{name}</h3>
        <p className="langue-card-region">{t(region)}</p>
        {note ? <p className="langue-card-note">{t(note)}</p> : null}
      </div>
    </article>
  );
}

export default function LanguesPage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const [isMobile, setIsMobile] = useState(false);
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

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
          features: c.navFeatures,
          levels: c.navLevels,
          pricing: c.navPricing,
          centers: c.navCenters,
          login: c.navLogin,
          register: c.navRegister,
        }}
      />

      <main>
        {/* ─── Territoire world · 6 étrangères ───────────────────── */}
        <section
          className="langues-territoire langues-world"
          aria-label={c.ariaWorld}
        >
          {/* Salutations étrangères dispersées dans les murs de la
              section (Bonjour, Hallo, Guten Tag, Hello, Hola, Olá,
              As-salām). Pool filtré sur territoire world uniquement. */}
          <div className="langues-world-greetings" aria-hidden="false">
            <SeuilGreetings locale={loc} visibleCount={4} pool="world" />
          </div>

          <div className="maison-container langues-world-inner">
            <div className="maison-section-head">
              <p className="maison-kicker">{t(c.worldKicker)}</p>
              <h1 className="maison-h">
                {t(c.worldTitle)} <em>{t(c.worldTitleEm)}</em>
              </h1>
              <p className="maison-lede">{t(c.worldLede)}</p>
              <p className="langues-scale-cap">{c.worldScaleCap}</p>
            </div>

            <div className="langues-grid">
              {FOREIGN.map((l) => (
                <LangueCard key={l.id} lang={l} locale={loc} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Couture ─── */}
        <Seam ariaLabel={c.ariaSeam} />

        {/* ─── Territoire sources · 4 natales avec échelle YEMA ─── */}
        <section
          id="sources"
          className="langues-territoire langues-sources"
          aria-label={c.ariaSources}
        >
          {/* Salutations natales dispersées dans les murs de la section
              (Mbolo, Na nga def, Mbote, Jambo, Ẹ n lẹ, Sannu, Akwaaba,
              Muraho, Selam, Sawubona). Pool filtré sur sources uniquement. */}
          <div className="langues-sources-greetings" aria-hidden="false">
            <SeuilGreetings locale={loc} visibleCount={4} pool="sources" />
          </div>

          <div className="maison-container langues-sources-inner">
            <div className="maison-section-head">
              <p className="maison-kicker">{t(c.sourcesKicker)}</p>
              <h1 className="maison-h">
                {t(c.sourcesTitle)} <em>{t(c.sourcesTitleEm)}</em>
              </h1>
              <p className="maison-lede">{t(c.sourcesLede)}</p>
              <p className="langues-scale-cap">{c.sourcesScaleCap}</p>
            </div>

            <div className="langues-grid langues-grid-4">
              {NATIVE.map((l) => (
                <LangueCard key={l.id} lang={l} locale={loc} />
              ))}
            </div>

            {/* Table éditoriale des 5 paliers YEMA */}
            <div className="langues-scale-table">
              <div className="maison-section-head" style={{ marginBottom: 24 }}>
                <h2 className="maison-h" style={{ fontSize: "clamp(24px, 3vw, 34px)" }}>
                  {t(c.scaleTableTitle)} <em>{t(c.scaleTableEm)}</em>
                </h2>
                <p className="maison-lede">{t(c.scaleTablePhrase)}</p>
              </div>

              <div className="scale-rows" role="list">
                <div className="scale-row scale-row-head" aria-hidden="true">
                  <span className="scale-col-stage">{c.colStage}</span>
                  <span className="scale-col-name">{c.colName}</span>
                  <span className="scale-col-anchor">{c.colAnchor}</span>
                  <span className="scale-col-actfl">{c.colActfl}</span>
                </div>
                {YEMA_LEVELS.map((lvl) => {
                  const name = loc === "en" ? lvl.nameEn : lvl.name;
                  const anchor = loc === "en" ? lvl.anchorEn : lvl.anchor;
                  return (
                    <div key={lvl.id} className="scale-row" role="listitem">
                      <span className="scale-col-stage">{lvl.code}</span>
                      <span className="scale-col-name">{name}</span>
                      <span className="scale-col-anchor">{t(anchor)}</span>
                      <span className="scale-col-actfl">{lvl.actfl}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Teaser final ─── */}
        <Teaser
          locale={loc}
          line1={loc === "en" ? "The map is widening." : "La carte s'étend."}
          line2={loc === "en" ? "The next voice will soon be named." : "La prochaine voix sera bientôt nommée."}
        />

        <div style={{ height: 40 }} aria-hidden="true" />

        <div className="maison-container" style={{ textAlign: "center", paddingBottom: 60 }}>
          <Link href={`/${locale}/register`} className="maison-porte-cta">
            {loc === "en" ? "Choose my language" : "Choisir ma langue"}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                 stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
                 strokeLinejoin="round" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </main>

      <LandingFooter
        locale={locale}
        labels={{
          tagline: c.footerTagline,
          made: c.footerMade,
          legal: c.footerLegal,
          terms: c.footerTerms,
          privacy: c.footerPrivacy,
          contact: c.footerContact,
          disclaimer: c.footerDisclaimer,
        }}
      />
    </div>
  );
}
