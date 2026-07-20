"use client";

// /onboarding/racines · Ambiance terre/cuivre, la transmission.
// Trois étapes intimes · langue africaine, lien à la langue, pour qui.
// Vocabulaire de retour, pas de performance. Aucune IA, aucun Klaus ici.

import Link from "next/link";
import { useRouter } from "@/navigation";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BrandY } from "@/components/brand/BrandY";
import { frTypo } from "@/components/landing/typo";

type Link_ = "understand" | "family_words" | "zero";
type Audience = "self" | "kids";

// Doctrine · n'affiche que les langues réellement disponibles au
// lancement · citer 2+ langues ensemble, jamais une seule.
const COPY_FR = {
  progress: (n: number) => `Étape ${n} sur 3 · une minute`,
  back: "Retour",
  next: "Continuer",
  finish: "Terminer",
  saving: "On enregistre…",
  s1Kicker: "Les racines",
  s1Title: "Quelle langue voulez-vous retrouver ?",
  s1Lede: "Choisissez celle des vôtres. D'autres viendront rejoindre la maison.",
  langs: [
    { id: "wolof",   name: "Wolof",   status: "live" },
    { id: "bassa",   name: "Bassa",   status: "soon" },
    { id: "douala",  name: "Douala",  status: "soon" },
    { id: "lingala", name: "Lingala", status: "soon" },
  ],
  langSoon: "bientôt",
  s2Kicker: "Le lien",
  s2Title: "Quel est votre lien avec cette langue ?",
  s2Lede: "Pour partir du bon endroit. Il n'y a pas de mauvaise réponse.",
  links: [
    { id: "understand" as Link_, name: "Je la comprends, mais je ne la parle pas", desc: "Elle a bercé mon enfance." },
    { id: "family_words" as Link_, name: "Quelques mots, transmis en famille", desc: "Aller plus loin que les salutations." },
    { id: "zero" as Link_, name: "Je pars de zéro", desc: "C'est la langue des miens, je veux la reprendre." },
  ],
  s3Kicker: "Pour qui",
  s3Title: "Pour qui apprenez-vous ?",
  s3Lede: "Le foyer suit votre choix. Vous pourrez ajouter des profils plus tard.",
  audiences: [
    { id: "self" as Audience, name: "Pour moi", desc: "Solo, à mon rythme." },
    { id: "kids" as Audience, name: "Pour mes enfants aussi", desc: "Famille · profils enfants à créer dans l'espace." },
  ],
  errNoLang: "Choisissez une langue disponible.",
  errNoLink: "Choisissez votre lien avec la langue.",
  errNoAudience: "Choisissez pour qui vous apprenez.",
} as const;

const COPY_EN = {
  progress: (n: number) => `Step ${n} of 3 · one minute`,
  back: "Back",
  next: "Continue",
  finish: "Finish",
  saving: "Saving…",
  s1Kicker: "The roots",
  s1Title: "Which language do you want to find again?",
  s1Lede: "Pick the one that's yours. Others will join the house.",
  langs: [
    { id: "wolof",   name: "Wolof",   status: "live" },
    { id: "bassa",   name: "Bassa",   status: "soon" },
    { id: "douala",  name: "Douala",  status: "soon" },
    { id: "lingala", name: "Lingala", status: "soon" },
  ],
  langSoon: "soon",
  s2Kicker: "The bond",
  s2Title: "What's your bond with this language?",
  s2Lede: "To start from the right place. There is no wrong answer.",
  links: [
    { id: "understand" as Link_, name: "I understand it, but I don't speak it", desc: "It rocked my childhood." },
    { id: "family_words" as Link_, name: "A few words, passed down at home", desc: "Go further than greetings." },
    { id: "zero" as Link_, name: "I'm starting from zero", desc: "It's the language of my people, I want to reclaim it." },
  ],
  s3Kicker: "For whom",
  s3Title: "Who are you learning for?",
  s3Lede: "The home follows your choice. You can add profiles later.",
  audiences: [
    { id: "self" as Audience, name: "For me", desc: "Solo, at my own pace." },
    { id: "kids" as Audience, name: "For my children too", desc: "Family · child profiles to create in the space." },
  ],
  errNoLang: "Pick an available language.",
  errNoLink: "Pick your bond with the language.",
  errNoAudience: "Pick who you are learning for.",
} as const;

export default function OnboardingRacinesPage() {
  const router = useRouter();
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [lang, setLang] = useState<string | null>("wolof");
  const [link, setLink] = useState<Link_ | null>(null);
  const [audience, setAudience] = useState<Audience | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setError(null); }, [step]);

  function goNext() {
    if (step === 1 && !lang) { setError(c.errNoLang); return; }
    if (step === 2 && !link) { setError(c.errNoLink); return; }
    if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3);
  }
  function goBack() {
    setError(null);
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  }

  async function handleFinish() {
    if (!audience) { setError(c.errNoAudience); return; }
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          universe: "racines",
          onboarding: { language: lang, link, audience },
          activeLanguage: lang,
        },
      });
    } catch { /* on continue même si l'update échoue */ }
    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  return (
    <div className="entry-page entry-universe-racines" data-universe="racines">
      <header className="entry-header">
        <Link href={`/${locale}`} className="entry-brand" aria-label="YEMA">
          <BrandY variant="sources" state="static" size={36} />
        </Link>
        <div className="entry-progress" aria-label={c.progress(step)}>
          <span className={`entry-progress-dot ${step >= 1 ? "on" : ""}`} aria-hidden="true" />
          <span className={`entry-progress-dot ${step >= 2 ? "on" : ""}`} aria-hidden="true" />
          <span className={`entry-progress-dot ${step >= 3 ? "on" : ""}`} aria-hidden="true" />
        </div>
      </header>

      <main className="entry-main">
        <div className="entry-card entry-card-onboarding">
          <p className="entry-kicker">
            {step === 1 ? t(c.s1Kicker) : step === 2 ? t(c.s2Kicker) : t(c.s3Kicker)}
            <span aria-hidden="true"> · </span>
            <span className="entry-kicker-progress">{t(c.progress(step))}</span>
          </p>

          {step === 1 ? (
            <>
              <h1 className="entry-h">{t(c.s1Title)}</h1>
              <p className="entry-lede">{t(c.s1Lede)}</p>
              <ul className="entry-choices" role="radiogroup" aria-label={t(c.s1Title)}>
                {c.langs.map((l) => {
                  const isLive = l.status === "live";
                  const active = lang === l.id;
                  return (
                    <li key={l.id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={!isLive}
                        className={`entry-choice ${active ? "on" : ""} ${!isLive ? "entry-choice-soon" : ""}`}
                        onClick={() => isLive && setLang(l.id)}
                      >
                        <span className="entry-choice-name">{t(l.name)}</span>
                        {!isLive ? <span className="entry-choice-badge">{c.langSoon}</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h1 className="entry-h">{t(c.s2Title)}</h1>
              <p className="entry-lede">{t(c.s2Lede)}</p>
              <ul className="entry-choices" role="radiogroup" aria-label={t(c.s2Title)}>
                {c.links.map((l) => {
                  const active = link === l.id;
                  return (
                    <li key={l.id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={active}
                        className={`entry-choice ${active ? "on" : ""}`}
                        onClick={() => setLink(l.id)}
                      >
                        <span className="entry-choice-name">{t(l.name)}</span>
                        <span className="entry-choice-desc">{t(l.desc)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h1 className="entry-h">{t(c.s3Title)}</h1>
              <p className="entry-lede">{t(c.s3Lede)}</p>
              <ul className="entry-choices" role="radiogroup" aria-label={t(c.s3Title)}>
                {c.audiences.map((a) => {
                  const active = audience === a.id;
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={active}
                        className={`entry-choice ${active ? "on" : ""}`}
                        onClick={() => setAudience(a.id)}
                      >
                        <span className="entry-choice-name">{t(a.name)}</span>
                        <span className="entry-choice-desc">{t(a.desc)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}

          {error ? <p className="entry-err" role="alert">{error}</p> : null}

          <div className="entry-nav-row">
            <button
              type="button"
              className="entry-cta entry-cta-ghost"
              onClick={goBack}
              disabled={step === 1 || saving}
            >
              ← {t(c.back)}
            </button>
            {step < 3 ? (
              <button type="button" className="entry-cta entry-cta-primary" onClick={goNext}>
                {t(c.next)} →
              </button>
            ) : (
              <button type="button" className="entry-cta entry-cta-primary" onClick={handleFinish} disabled={saving}>
                {saving ? t(c.saving) : t(c.finish)} →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
