"use client";

// /onboarding/racines · Ambiance terre/cuivre, la transmission.
// Deux étapes seulement · lien + point de départ. La langue est déjà
// connue via le plan choisi sur /pricing (wolof au lancement).
// Rappel de l'offre en haut. Aucune IA, aucun Klaus.

import Link from "next/link";
import { useRouter } from "@/navigation";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BrandY } from "@/components/brand/BrandY";
import { frTypo } from "@/components/landing/typo";

type Link_ = "understand" | "family_words" | "zero";
type StartPoint = "beginner" | "some_basics" | "childhood";

const PLAN_LABEL_FR: Record<string, string> = {
  "racines-solo": "Solo · une personne, une langue",
  "racines-famille": "Famille · deux adultes et jusqu'à quatre enfants",
};
const PLAN_LABEL_EN: Record<string, string> = {
  "racines-solo": "Solo · one person, one language",
  "racines-famille": "Family · two adults and up to four children",
};

const COPY_FR = {
  progress: (n: number) => `Étape ${n} sur 2 · une minute`,
  back: "Retour",
  next: "Continuer",
  finish: "Terminer",
  saving: "On enregistre…",
  contextPrefix: "Vous avez choisi",
  s1Kicker: "Le lien",
  s1Title: "Quel est votre lien avec la langue ?",
  s1Lede: "Pour partir du bon endroit. Il n'y a pas de mauvaise réponse.",
  links: [
    { id: "understand" as Link_, name: "Je la comprends, mais je ne la parle pas", desc: "Elle a bercé mon enfance." },
    { id: "family_words" as Link_, name: "Quelques mots, transmis en famille", desc: "Aller plus loin que les salutations." },
    { id: "zero" as Link_, name: "Je pars de zéro", desc: "C'est la langue des miens, je veux la reprendre." },
  ],
  s2Kicker: "Le point de départ",
  s2Title: "Où en êtes-vous ?",
  s2Lede: "Trois options honnêtes. Aucun jugement.",
  starts: [
    { id: "beginner" as StartPoint, name: "Je débute", desc: "Premiers sons, premières phrases." },
    { id: "some_basics" as StartPoint, name: "Quelques bases", desc: "Je reconnais, je place quelques mots." },
    { id: "childhood" as StartPoint, name: "Reprendre depuis l'enfance", desc: "La langue s'est éloignée. On revient." },
  ],
  errNoLink: "Choisissez votre lien avec la langue.",
  errNoStart: "Choisissez un point de départ.",
} as const;

const COPY_EN = {
  progress: (n: number) => `Step ${n} of 2 · one minute`,
  back: "Back",
  next: "Continue",
  finish: "Finish",
  saving: "Saving…",
  contextPrefix: "You picked",
  s1Kicker: "The bond",
  s1Title: "What's your bond with the language?",
  s1Lede: "To start from the right place. There is no wrong answer.",
  links: [
    { id: "understand" as Link_, name: "I understand it, but I don't speak it", desc: "It rocked my childhood." },
    { id: "family_words" as Link_, name: "A few words, passed down at home", desc: "Go further than greetings." },
    { id: "zero" as Link_, name: "I'm starting from zero", desc: "It's the language of my people, I want to reclaim it." },
  ],
  s2Kicker: "The starting point",
  s2Title: "Where are you now?",
  s2Lede: "Three honest options. No judgment.",
  starts: [
    { id: "beginner" as StartPoint, name: "I'm starting out", desc: "First sounds, first sentences." },
    { id: "some_basics" as StartPoint, name: "Some basics", desc: "I recognize, I place a few words." },
    { id: "childhood" as StartPoint, name: "Reclaim from childhood", desc: "The language drifted. We come back." },
  ],
  errNoLink: "Pick your bond with the language.",
  errNoStart: "Pick a starting point.",
} as const;

export default function OnboardingRacinesPage() {
  const router = useRouter();
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

  const [step, setStep] = useState<1 | 2>(1);
  const [link, setLink] = useState<Link_ | null>(null);
  const [startPoint, setStartPoint] = useState<StartPoint | null>(null);
  const [planLabel, setPlanLabel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const plan = (data.user?.user_metadata as { plan?: string })?.plan;
      if (!plan) return;
      const map = loc === "en" ? PLAN_LABEL_EN : PLAN_LABEL_FR;
      setPlanLabel(map[plan] ?? "");
    }).catch(() => { /* silent */ });
  }, [loc]);

  function goNext() {
    if (step === 1 && !link) { setError(c.errNoLink); return; }
    if (step < 2) { setError(null); setStep(2); }
  }
  function goBack() {
    setError(null);
    if (step > 1) setStep((s) => (s - 1) as 1 | 2);
  }

  async function handleFinish() {
    if (!startPoint) { setError(c.errNoStart); return; }
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          universe: "racines",
          onboarding: { language: "wolof", link, startPoint },
          activeLanguage: "wolof",
        },
      });
      // Crée aussi le LearningPath côté DB (source de vérité v1).
      const intentionMap: Record<string, string> = {
        understand: "RACINES_SOI",
        family_words: "TRANSMISSION",
        zero: "RACINES_SOI",
      };
      await fetch("/api/learning-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universe: "RACINES",
          language: "WOLOF",
          intention: link ? intentionMap[link] : undefined,
          onboardingAnswers: { link, startPoint },
        }),
      });
    } catch { /* on continue même si l'update échoue */ }
    // Chemin NU · router de @/navigation ajoute la locale
    router.push("/dashboard");
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
        </div>
      </header>

      <main className="entry-main">
        <div className="entry-card entry-card-onboarding">
          {planLabel ? (
            <div className="entry-context" role="note">
              <span className="entry-context-dot" aria-hidden="true" />
              <span className="entry-context-text">
                {t(c.contextPrefix)} <em>{planLabel}</em>.
              </span>
            </div>
          ) : null}

          <p className="entry-kicker">
            {step === 1 ? t(c.s1Kicker) : t(c.s2Kicker)}
            <span aria-hidden="true"> · </span>
            <span className="entry-kicker-progress">{t(c.progress(step))}</span>
          </p>

          {step === 1 ? (
            <>
              <h1 className="entry-h">{t(c.s1Title)}</h1>
              <p className="entry-lede">{t(c.s1Lede)}</p>
              <ul className="entry-choices" role="radiogroup" aria-label={t(c.s1Title)}>
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
          ) : (
            <>
              <h1 className="entry-h">{t(c.s2Title)}</h1>
              <p className="entry-lede">{t(c.s2Lede)}</p>
              <ul className="entry-choices" role="radiogroup" aria-label={t(c.s2Title)}>
                {c.starts.map((s) => {
                  const active = startPoint === s.id;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={active}
                        className={`entry-choice ${active ? "on" : ""}`}
                        onClick={() => setStartPoint(s.id)}
                      >
                        <span className="entry-choice-name">{t(s.name)}</span>
                        <span className="entry-choice-desc">{t(s.desc)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

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
            {step < 2 ? (
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
