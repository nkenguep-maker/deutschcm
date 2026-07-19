"use client";

// /dashboard · Sprint « Le Foyer » — étape 1.
// Ancienne page dashboard supprimée intégralement. Reconstruction
// selon la doctrine du sprint : quatre couches (structure invariante,
// territoire, cap qui configure, multi-langues une pièce à la fois).
//
// Étape 1 · structure vide branchée aux APIs. Les états vides sont
// portés par StateBlock — aucune donnée fictive. Les configurations
// de cap et la braise complète arrivent en étapes 2 et 3.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import Layout from "@/components/Layout";
import { StateBlock } from "@/components/StateBlock";
import { CefrSpine } from "@/components/landing/CefrSpine";
import { YemaSpine } from "@/components/landing/YemaSpine";
import { frTypo } from "@/components/landing/typo";

// ─── Types remontés par /api/me/foyer ─────────────────────────────
interface FoyerLangue {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  territory: "world" | "sources";
  scale: "cefr" | "yema";
  level: string | null;
  levels: readonly string[];
}
interface FoyerBraise {
  jours: number;
  activeAujourdhui: boolean;
}
interface FoyerClasse {
  name: string;
  teacherName: string;
}
interface FoyerData {
  prenom: string;
  cap: "franchir" | "grandir" | "transmettre" | "moi" | null;
  personalGoal: string | null;
  langues: FoyerLangue[];
  activeLangue: FoyerLangue;
  braise: FoyerBraise;
  classe: FoyerClasse | null;
}

// ─── Copy éditoriale ──────────────────────────────────────────────
interface FoyerCopy {
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  capLabel: string;
  cap: Record<"franchir" | "grandir" | "transmettre" | "moi", string>;
  reprendreEye: string;
  reprendreEmpty: { soul: string; action: string };
  echelleTitle: string;
  capCardTitle: string;
  capCardEmpty: { soul: string; action: string };
  classeTitle: string;
  classeEmpty: { soul: string; action: string };
  otherVoiceKicker: string;
  otherVoicePrefix: string;
  otherVoiceSuffix: string;
  toolsTitle: string;
  toolSim: string;
  toolSimDesc: string;
  toolDiscover: string;
  toolDiscoverDesc: string;
  toolCourses: string;
  toolCoursesDesc: string;
}

function useCopy(locale: "fr" | "en"): { c: FoyerCopy; t: (s: string) => string } {
  const c: FoyerCopy = locale === "en" ? COPY_EN : COPY_FR;
  const t = (s: string) => (locale === "fr" ? frTypo(s) : s);
  return { c, t };
}

const COPY_FR: FoyerCopy = {
  greetingMorning: "Bonjour",
  greetingAfternoon: "Bon après-midi",
  greetingEvening: "Bonsoir",
  capLabel: "Votre cap",
  cap: {
    franchir: "Franchir",
    grandir: "Grandir",
    transmettre: "Transmettre",
    moi: "Apprendre pour vous",
  },
  reprendreEye: "Reprendre",
  reprendreEmpty: {
    soul: "La première leçon — *ouvrez la porte.*",
    action: "Ouvrir",
  },
  echelleTitle: "Mon échelle",
  capCardTitle: "Votre chemin",
  capCardEmpty: {
    soul: "Le chemin s'écrit — *posez votre but.*",
    action: "Compléter mon profil",
  },
  classeTitle: "Ma classe",
  classeEmpty: {
    soul: "Aucune classe pour l'instant. *Rejoignez avec un code.*",
    action: "Entrer un code",
  },
  otherVoiceKicker: "L'autre voix",
  otherVoicePrefix: "L'autre voix vous attend.",
  otherVoiceSuffix: "Passer au",
  toolsTitle: "Vos outils",
  toolSim: "Le simulateur",
  toolSimDesc: "Des scénarios réels. Voix, correction, encouragement.",
  toolDiscover: "Rencontrer",
  toolDiscoverDesc: "D'autres voix qui apprennent la même langue.",
  toolCourses: "Le catalogue",
  toolCoursesDesc: "Tous les modules de la langue active — rythme libre.",
};

const COPY_EN: FoyerCopy = {
  greetingMorning: "Good morning",
  greetingAfternoon: "Good afternoon",
  greetingEvening: "Good evening",
  capLabel: "Your cap",
  cap: {
    franchir: "Cross over",
    grandir: "Grow",
    transmettre: "Pass on",
    moi: "Learn for you",
  },
  reprendreEye: "Resume",
  reprendreEmpty: {
    soul: "Your first lesson — *open the door.*",
    action: "Open",
  },
  echelleTitle: "My scale",
  capCardTitle: "Your path",
  capCardEmpty: {
    soul: "The path is being written — *set your goal.*",
    action: "Complete my profile",
  },
  classeTitle: "My class",
  classeEmpty: {
    soul: "No class yet. *Join with a code.*",
    action: "Enter a code",
  },
  otherVoiceKicker: "The other voice",
  otherVoicePrefix: "The other voice is waiting.",
  otherVoiceSuffix: "Switch to",
  toolsTitle: "Your tools",
  toolSim: "The simulator",
  toolSimDesc: "Real scenarios. Voice, correction, encouragement.",
  toolDiscover: "Meet",
  toolDiscoverDesc: "Other voices learning the same language.",
  toolCourses: "The catalog",
  toolCoursesDesc: "All modules of the active language — free pacing.",
};

function greetingFor(hour: number, c: FoyerCopy): string {
  if (hour < 12) return c.greetingMorning;
  if (hour < 18) return c.greetingAfternoon;
  return c.greetingEvening;
}

export default function FoyerPage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const { c, t } = useCopy(loc);

  const [data, setData] = useState<FoyerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me/foyer")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("foyer_fetch_failed"))))
      .then((d) => setData(d as FoyerData))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout title="Foyer">
        <StateBlock
          kind="loading"
          soul={loc === "en" ? "The house is opening — *just a moment.*" : "La maison s'ouvre — *un instant.*"}
        />
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout title="Foyer">
        <StateBlock
          kind="error"
          soul={loc === "en" ? "The voice got lost on the way. *Not yours.*" : "La voix s'est perdue en route. *Pas la vôtre.*"}
          action={{ label: loc === "en" ? "Try again" : "Réessayer", onClick: () => window.location.reload() }}
        />
      </Layout>
    );
  }

  const hour = new Date().getHours();
  const greeting = greetingFor(hour, c);
  const capLabel = data.cap ? c.cap[data.cap] : null;
  const territoryClass = `territory-${data.activeLangue.territory}`;
  const isYema = data.activeLangue.scale === "yema";
  const currentSpine = data.activeLangue.level ?? data.activeLangue.levels[0];

  // Multi-langues : autres langues supportées que la langue active
  const otherLanguages = data.langues.filter((l) => l.id !== data.activeLangue.id);
  const hasOther = otherLanguages.length >= 1;

  return (
    <Layout title="Foyer">
      <div className={`foyer ${territoryClass}`}>
        {/* a) L'EN-TÊTE DU FOYER */}
        <header className="foyer-header">
          <div className="foyer-header-side">
            <p className="foyer-greeting">
              {t(greeting)}, <em>{data.prenom}.</em>
            </p>
            {capLabel ? (
              <p className="foyer-cap-line">
                {t(c.capLabel).toUpperCase()} · {t(capLabel).toUpperCase()}
              </p>
            ) : null}
          </div>
          {/* Braise · étape 3 (placeholder statique pour l'étape 1) */}
          <div className="foyer-braise-slot" aria-hidden={data.braise.jours === 0}>
            <BraisePlaceholder braise={data.braise} locale={loc} />
          </div>
        </header>

        {/* b) REPRENDRE — l'unique zone laiton de l'écran */}
        <section className="foyer-reprendre" aria-labelledby="foyer-reprendre-h">
          <p className="maison-kicker">{t(c.reprendreEye)}</p>
          {/* Étape 1 · placeholder StateBlock. Étape 2 branchera
              /api/me/next-lesson avec capContext par cap. */}
          <StateBlock
            kind="empty"
            soul={c.reprendreEmpty.soul}
            action={{ label: c.reprendreEmpty.action, href: `/${locale}/courses` }}
          />
        </section>

        {/* c) RANGÉE Mon échelle + carte de cap */}
        <div className="foyer-row">
          <section className="foyer-echelle" aria-labelledby="foyer-echelle-h">
            <p className="maison-kicker">{t(c.echelleTitle)}</p>
            <div className="foyer-echelle-holder">
              {isYema ? (
                <YemaSpine current={currentSpine} locale={loc} compact />
              ) : (
                <CefrSpine current={currentSpine as "A1" | "A2" | "B1" | "B2" | "C1"} locale={loc} compact />
              )}
            </div>
          </section>

          <section className="foyer-cap-card" aria-labelledby="foyer-cap-card-h">
            <p className="maison-kicker">{t(c.capCardTitle)}</p>
            {/* Étape 1 · placeholder. Étape 2 · contenu selon cap. */}
            {data.cap ? (
              <div className="foyer-cap-inner">
                <p className="foyer-cap-inner-h">{t(c.cap[data.cap])}.</p>
                {data.personalGoal ? (
                  <blockquote className="foyer-cap-quote">
                    <p><em>« {data.personalGoal} »</em></p>
                  </blockquote>
                ) : null}
              </div>
            ) : (
              <StateBlock
                kind="empty"
                soul={c.capCardEmpty.soul}
                action={{ label: c.capCardEmpty.action, href: `/${locale}/onboarding/student` }}
              />
            )}
          </section>
        </div>

        {/* d) MA CLASSE (ou rejoindre) */}
        <section className="foyer-classe" aria-labelledby="foyer-classe-h">
          <p className="maison-kicker">{t(c.classeTitle)}</p>
          {data.classe ? (
            <article className="foyer-classe-card">
              <p className="foyer-classe-name">{data.classe.name}</p>
              {data.classe.teacherName ? (
                <p className="foyer-classe-teacher">
                  {loc === "en" ? "With" : "Avec"} {data.classe.teacherName}
                </p>
              ) : null}
            </article>
          ) : (
            <StateBlock
              kind="empty"
              soul={c.classeEmpty.soul}
              action={{ label: c.classeEmpty.action, href: `/${locale}/discover` }}
            />
          )}
        </section>

        {/* e) L'AUTRE VOIX (si 2+ langues) */}
        {hasOther ? (
          <section className="foyer-other" aria-labelledby="foyer-other-h">
            <p className="maison-kicker">{t(c.otherVoiceKicker)}</p>
            {otherLanguages.length === 1 ? (
              <Link href={`/${locale}/dashboard?lang=${otherLanguages[0].id}`} className="foyer-other-single">
                {t(c.otherVoicePrefix)}{" "}
                <em>
                  {t(c.otherVoiceSuffix)}{" "}
                  {loc === "en" ? otherLanguages[0].nameEn : otherLanguages[0].name} →
                </em>
              </Link>
            ) : (
              <ul className="foyer-other-list">
                {otherLanguages.map((l) => (
                  <li key={l.id}>
                    <Link href={`/${locale}/dashboard?lang=${l.id}`} className="foyer-other-item">
                      <span className="foyer-other-code">{l.code}</span>
                      <span className="foyer-other-name">
                        {loc === "en" ? l.nameEn : l.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {/* f) OUTILS + HISTORIQUE */}
        <section className="foyer-tools" aria-labelledby="foyer-tools-h">
          <p className="maison-kicker">{t(c.toolsTitle)}</p>
          <div className="foyer-tools-grid">
            <Link href={`/${locale}/simulateur`} className="foyer-tool">
              <h3>{t(c.toolSim)}</h3>
              <p>{t(c.toolSimDesc)}</p>
            </Link>
            <Link href={`/${locale}/discover`} className="foyer-tool">
              <h3>{t(c.toolDiscover)}</h3>
              <p>{t(c.toolDiscoverDesc)}</p>
            </Link>
            <Link href={`/${locale}/courses`} className="foyer-tool">
              <h3>{t(c.toolCourses)}</h3>
              <p>{t(c.toolCoursesDesc)}</p>
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}

// ─── Braise · placeholder étape 1 (composant complet en étape 3) ──
function BraisePlaceholder({ braise, locale }: { braise: FoyerBraise; locale: "fr" | "en" }) {
  const label = locale === "en"
    ? `The ember burns · ${braise.jours} ${braise.jours === 1 ? "day" : "days"}`
    : `La braise brûle · ${braise.jours} ${braise.jours === 1 ? "jour" : "jours"}`;
  return (
    <div className={`braise ${braise.activeAujourdhui ? "on" : "off"}`}
         aria-label={label}>
      <span className="braise-dot" aria-hidden="true" />
      <span className="braise-label">{label}</span>
    </div>
  );
}
