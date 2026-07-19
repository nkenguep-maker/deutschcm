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
import { Braise } from "@/components/foyer/Braise";

// ─── Types remontés par /api/me/foyer et /api/me/next-lesson ─────
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
type Cap = "franchir" | "grandir" | "transmettre" | "moi";
interface FoyerData {
  prenom: string;
  cap: Cap | null;
  personalGoal: string | null;
  langues: FoyerLangue[];
  activeLangue: FoyerLangue;
  braise: FoyerBraise;
  classe: FoyerClasse | null;
}

type CapContext =
  | { kind: "franchir"; examenBlancLevel: string; leconsRestantes: number | null }
  | { kind: "grandir"; step: string; dossiersCompletes: number | null; dossiersTotal: number | null }
  | { kind: "transmettre"; conteId: string; conteTitre: string; minutes: number; soirsCetteSemaine: number }
  | { kind: "moi"; rythme: string };

interface NextLesson {
  cap: Cap | null;
  lesson: { id: string; title: string } | null;
  module: { id: string; kind: string } | null;
  minutes: number;
  capContext: CapContext | null;
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
  reprendreCta: string;
  reprendreFranchir: (level: string, remaining: number) => string;
  reprendreGrandir: string;
  reprendreTransmettreTitle: string;
  reprendreTransmettreSub: (minutes: number) => string;
  reprendreTransmettreCta: string;
  reprendreMoi: string;
  echelleTitle: string;
  capCardTitle: string;
  capCardEmpty: { soul: string; action: string };
  jalonTitle: string;
  jalonSub: (level: string) => string;
  jalonRemaining: (n: number) => string;
  jalonEmpty: string;
  procedureTitle: string;
  procedureEmpty: { soul: string; action: string };
  procedureLine: (done: number, total: number) => string;
  ritualTitle: string;
  ritualLine: (soirs: number) => string;
  rythmeTitle: string;
  rythmeLine: string;
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
  reprendreCta: "Continuer",
  reprendreFranchir: (level, remaining) =>
    remaining === 1
      ? `Encore *une leçon* avant votre examen blanc ${level}.`
      : `Encore *${remaining} leçons* avant votre examen blanc ${level}.`,
  reprendreGrandir: "À votre rythme, *ce soir*.",
  reprendreTransmettreTitle: "Le conte du soir",
  reprendreTransmettreSub: (minutes) =>
    `*À écouter ensemble* — ${minutes} min.`,
  reprendreTransmettreCta: "Écouter ce soir",
  reprendreMoi: "Une porte parmi d'autres — *à votre main*.",
  echelleTitle: "Mon échelle",
  capCardTitle: "Votre chemin",
  capCardEmpty: {
    soul: "Le chemin s'écrit — *posez votre but.*",
    action: "Compléter mon profil",
  },
  jalonTitle: "Prochain jalon",
  jalonSub: (level) => `Examen blanc ${level}`,
  jalonRemaining: (n) => n === 1 ? "1 leçon reste à faire." : `${n} leçons restent à faire.`,
  jalonEmpty: "Le curriculum se met en place.",
  procedureTitle: "Ma procédure",
  procedureEmpty: {
    soul: "Votre procédure vous ressemble — *racontez-la.*",
    action: "Décrire ma procédure",
  },
  procedureLine: (done, total) => `${done} dossier${done > 1 ? "s" : ""} sur ${total}.`,
  ritualTitle: "Le rituel",
  ritualLine: (soirs) =>
    soirs === 0
      ? "Aucun soir cette semaine. *Le foyer vous attend.*"
      : soirs === 1
        ? "Un soir cette semaine — *une voix a été portée.*"
        : `${soirs} soirs cette semaine — *chaque conte laisse une trace.*`,
  rythmeTitle: "Mon rythme",
  rythmeLine: "Sans compte à rendre. Sans compte à rebours.",
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
  reprendreCta: "Continue",
  reprendreFranchir: (level, remaining) =>
    remaining === 1
      ? `*One lesson* before your ${level} mock exam.`
      : `*${remaining} lessons* before your ${level} mock exam.`,
  reprendreGrandir: "At your pace, *tonight*.",
  reprendreTransmettreTitle: "The evening tale",
  reprendreTransmettreSub: (minutes) =>
    `*To listen together* — ${minutes} min.`,
  reprendreTransmettreCta: "Listen tonight",
  reprendreMoi: "One door among others — *yours to open*.",
  echelleTitle: "My scale",
  capCardTitle: "Your path",
  capCardEmpty: {
    soul: "The path is being written — *set your goal.*",
    action: "Complete my profile",
  },
  jalonTitle: "Next milestone",
  jalonSub: (level) => `${level} mock exam`,
  jalonRemaining: (n) => n === 1 ? "1 lesson left." : `${n} lessons left.`,
  jalonEmpty: "The curriculum is being laid out.",
  procedureTitle: "My procedure",
  procedureEmpty: {
    soul: "Your procedure is yours — *tell it.*",
    action: "Describe my procedure",
  },
  procedureLine: (done, total) => `${done} of ${total} file${total > 1 ? "s" : ""} done.`,
  ritualTitle: "The ritual",
  ritualLine: (soirs) =>
    soirs === 0
      ? "No evening this week. *The house is waiting.*"
      : soirs === 1
        ? "One evening this week — *a voice was carried.*"
        : `${soirs} evenings this week — *each tale leaves a trace.*`,
  rythmeTitle: "My pace",
  rythmeLine: "No one to answer to. No countdown.",
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
  const [nextLesson, setNextLesson] = useState<NextLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Deux fetches en parallèle — foyer bloque le rendu (structure),
    // next-lesson n'est pas bloquant (Reprendre affiche loading state).
    Promise.all([
      fetch("/api/me/foyer").then((r) => (r.ok ? r.json() : Promise.reject(new Error("foyer_fetch_failed")))),
      fetch("/api/me/next-lesson").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([foyer, next]) => {
        setData(foyer as FoyerData);
        setNextLesson(next as NextLesson | null);
      })
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

  // Bascule de langue · POST /api/language/switch puis hard reload
  // pour laisser la couture 240ms se jouer proprement (le fond change,
  // le spine change, tout le foyer se recharge dans le nouveau
  // territoire — une pièce à la fois, jamais deux en parallèle).
  const switchLanguage = async (languageId: string) => {
    document.body.classList.add("foyer-switching");
    try {
      await fetch("/api/language/switch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ languageId }),
      });
    } catch {
      // silent-fail — la page ne bougera pas, l'user peut réessayer
      document.body.classList.remove("foyer-switching");
      return;
    }
    // 240ms d'ease-glide (couture) puis rechargement.
    window.setTimeout(() => {
      window.location.reload();
    }, 240);
  };

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
          {/* Braise · composant complet · state on/off/new avec
              respiration 7s (--dur-breath) uniquement si activeAujourdhui
              et allowBreathing. */}
          <div className="foyer-braise-slot">
            <Braise
              jours={data.braise.jours}
              activeAujourdhui={data.braise.activeAujourdhui}
              locale={loc}
              reprendreHref="#foyer-reprendre-h"
              allowBreathing
              compact={false}
            />
          </div>
        </header>

        {/* b) REPRENDRE — configuré par cap (étape 2) */}
        <ReprendreSection
          copy={c}
          locale={loc}
          urlLocale={locale}
          cap={data.cap}
          nextLesson={nextLesson}
          t={t}
        />

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

          <CapCard
            copy={c}
            locale={loc}
            urlLocale={locale}
            cap={data.cap}
            personalGoal={data.personalGoal}
            capContext={nextLesson?.capContext ?? null}
            t={t}
          />
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

        {/* e) L'AUTRE VOIX (si 2+ langues) — bascule via API + transition
             ease-glide 240ms sur le fond (voir CSS .foyer). */}
        {hasOther ? (
          <section className="foyer-other" aria-labelledby="foyer-other-h">
            <p className="maison-kicker">{t(c.otherVoiceKicker)}</p>
            {otherLanguages.length === 1 ? (
              <button
                type="button"
                className="foyer-other-single"
                onClick={() => switchLanguage(otherLanguages[0].id)}
              >
                {t(c.otherVoicePrefix)}{" "}
                <em>
                  {t(c.otherVoiceSuffix)}{" "}
                  {loc === "en" ? otherLanguages[0].nameEn : otherLanguages[0].name} →
                </em>
              </button>
            ) : (
              <ul className="foyer-other-list">
                {otherLanguages.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      className="foyer-other-item"
                      onClick={() => switchLanguage(l.id)}
                    >
                      <span className="foyer-other-code">{l.code}</span>
                      <span className="foyer-other-name">
                        {loc === "en" ? l.nameEn : l.name}
                      </span>
                    </button>
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

// ─── b) REPRENDRE · configuré par cap ─────────────────────────────
function ReprendreSection({ copy, locale, urlLocale, cap, nextLesson, t }: {
  copy: FoyerCopy;
  locale: "fr" | "en";
  urlLocale: string;
  cap: Cap | null;
  nextLesson: NextLesson | null;
  t: (s: string) => string;
}) {
  const hasNext = nextLesson?.lesson && nextLesson?.module;

  // Cas TRANSMETTRE : conte du soir en tête (pas une leçon académique)
  if (cap === "transmettre" && nextLesson?.capContext?.kind === "transmettre") {
    const ctx = nextLesson.capContext;
    return (
      <section className="foyer-reprendre" aria-labelledby="foyer-reprendre-h">
        <p className="maison-kicker">{t(copy.reprendreEye)}</p>
        <div className="foyer-reprendre-body">
          <p className="foyer-reprendre-title">{t(copy.reprendreTransmettreTitle)} — <em>{ctx.conteTitre}</em></p>
          <p className="foyer-reprendre-sub"
             dangerouslySetInnerHTML={{ __html: renderStars(t(copy.reprendreTransmettreSub(ctx.minutes))) }} />
          <div className="foyer-reprendre-cta-row">
            <Link href={`/${urlLocale}/hoeren`} className="foyer-reprendre-cta">
              {t(copy.reprendreTransmettreCta)} →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Cas franchir / grandir / moi : leçon à reprendre
  if (!hasNext) {
    return (
      <section className="foyer-reprendre" aria-labelledby="foyer-reprendre-h">
        <p className="maison-kicker">{t(copy.reprendreEye)}</p>
        <StateBlock
          kind="empty"
          soul={copy.reprendreEmpty.soul}
          action={{ label: copy.reprendreEmpty.action, href: `/${urlLocale}/courses` }}
        />
      </section>
    );
  }

  // Note contextuelle selon cap
  let note: string | null = null;
  if (cap === "franchir" && nextLesson?.capContext?.kind === "franchir" && nextLesson.capContext.leconsRestantes !== null) {
    note = copy.reprendreFranchir(nextLesson.capContext.examenBlancLevel, nextLesson.capContext.leconsRestantes);
  } else if (cap === "grandir") {
    note = copy.reprendreGrandir;
  } else if (cap === "moi" || cap === null) {
    note = copy.reprendreMoi;
  }

  return (
    <section className="foyer-reprendre" aria-labelledby="foyer-reprendre-h">
      <p className="maison-kicker">{t(copy.reprendreEye)}</p>
      <div className="foyer-reprendre-body">
        <p className="foyer-reprendre-title">{nextLesson.lesson!.title}</p>
        {note ? (
          <p className="foyer-reprendre-sub"
             dangerouslySetInnerHTML={{ __html: renderStars(t(note)) }} />
        ) : null}
        <div className="foyer-reprendre-cta-row">
          <Link
            href={`/${urlLocale}/courses/${nextLesson.lesson!.id}/modules/${nextLesson.module!.id}`}
            className="foyer-reprendre-cta"
          >
            {t(copy.reprendreCta)} →
          </Link>
          {nextLesson.minutes > 0 ? (
            <span className="foyer-reprendre-min">{nextLesson.minutes} min</span>
          ) : null}
        </div>
      </div>
      {/* Locale utilisée par les strings, on ignore ici */}
      {locale === "en" ? null : null}
    </section>
  );
}

// ─── c) CAP CARD · configuré par cap ──────────────────────────────
function CapCard({ copy, locale, urlLocale, cap, personalGoal, capContext, t }: {
  copy: FoyerCopy;
  locale: "fr" | "en";
  urlLocale: string;
  cap: Cap | null;
  personalGoal: string | null;
  capContext: CapContext | null;
  t: (s: string) => string;
}) {
  if (!cap) {
    return (
      <section className="foyer-cap-card" aria-labelledby="foyer-cap-card-h">
        <p className="maison-kicker">{t(copy.capCardTitle)}</p>
        <StateBlock
          kind="empty"
          soul={copy.capCardEmpty.soul}
          action={{ label: copy.capCardEmpty.action, href: `/${urlLocale}/onboarding/student` }}
        />
      </section>
    );
  }

  // FRANCHIR · prochain jalon
  if (cap === "franchir" && capContext?.kind === "franchir") {
    return (
      <section className="foyer-cap-card" aria-labelledby="foyer-cap-card-h">
        <p className="maison-kicker">{t(copy.jalonTitle)}</p>
        <p className="foyer-cap-inner-h">{t(copy.jalonSub(capContext.examenBlancLevel))}</p>
        {capContext.leconsRestantes !== null ? (
          <p className="foyer-cap-note">{t(copy.jalonRemaining(capContext.leconsRestantes))}</p>
        ) : (
          <p className="foyer-cap-note foyer-cap-note-mute">{t(copy.jalonEmpty)}</p>
        )}
        {personalGoal ? (
          <blockquote className="foyer-cap-quote">
            <p><em>« {personalGoal} »</em></p>
          </blockquote>
        ) : null}
      </section>
    );
  }

  // GRANDIR · ma procédure
  if (cap === "grandir" && capContext?.kind === "grandir") {
    const hasData = capContext.dossiersTotal !== null && capContext.dossiersCompletes !== null;
    return (
      <section className="foyer-cap-card" aria-labelledby="foyer-cap-card-h">
        <p className="maison-kicker">{t(copy.procedureTitle)}</p>
        {hasData ? (
          <>
            <p className="foyer-cap-inner-h">
              {t(copy.procedureLine(capContext.dossiersCompletes!, capContext.dossiersTotal!))}
            </p>
            {personalGoal ? (
              <blockquote className="foyer-cap-quote">
                <p><em>« {personalGoal} »</em></p>
              </blockquote>
            ) : null}
          </>
        ) : (
          <StateBlock
            kind="empty"
            soul={copy.procedureEmpty.soul}
            action={{ label: copy.procedureEmpty.action, href: `/${urlLocale}/settings` }}
          />
        )}
      </section>
    );
  }

  // TRANSMETTRE · le rituel
  if (cap === "transmettre" && capContext?.kind === "transmettre") {
    return (
      <section className="foyer-cap-card" aria-labelledby="foyer-cap-card-h">
        <p className="maison-kicker">{t(copy.ritualTitle)}</p>
        <p className="foyer-cap-inner-h"
           dangerouslySetInnerHTML={{ __html: renderStars(t(copy.ritualLine(capContext.soirsCetteSemaine))) }} />
        {personalGoal ? (
          <blockquote className="foyer-cap-quote">
            <p><em>« {personalGoal} »</em></p>
          </blockquote>
        ) : null}
      </section>
    );
  }

  // MOI · mon rythme
  return (
    <section className="foyer-cap-card" aria-labelledby="foyer-cap-card-h">
      <p className="maison-kicker">{t(copy.rythmeTitle)}</p>
      <p className="foyer-cap-inner-h">{t(copy.rythmeLine)}</p>
      {personalGoal ? (
        <blockquote className="foyer-cap-quote">
          <p><em>« {personalGoal} »</em></p>
        </blockquote>
      ) : null}
      {locale === "en" ? null : null}
    </section>
  );
}

// Rend les *...* en <em> laiton dans les string via innerHTML.
function renderStars(s: string): string {
  return s.replace(/\*([^*]+)\*/g, '<em class="foyer-em">$1</em>');
}

