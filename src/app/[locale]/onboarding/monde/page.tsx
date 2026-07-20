"use client";

// /onboarding/monde · Ambiance espresso/laiton, le voyage.
// Trois étapes, une minute · langue, pourquoi, point de départ.
// Réponses stockées dans user_metadata.onboarding pour personnaliser.

import Link from "next/link";
import { useRouter } from "@/navigation";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BrandY } from "@/components/brand/BrandY";
import { frTypo } from "@/components/landing/typo";

type LangId = "deutsch";
type Why = "study" | "exam" | "envie";
type StartPoint = "beginner" | "some_basics" | "test";

const COPY_FR = {
  progress: (n: number) => `Étape ${n} sur 3 · une minute`,
  back: "Retour",
  next: "Continuer",
  finish: "Terminer",
  saving: "On enregistre…",
  // Étape 1 · langue
  s1Kicker: "Le voyage",
  s1Title: "Quelle langue vous emmène ?",
  s1Lede: "Une seule au lancement. Les autres suivront.",
  langs: [
    { id: "deutsch" as LangId, name: "Allemand", status: "live" },
    { id: "anglais", name: "Anglais", status: "soon" },
    { id: "francais", name: "Français", status: "soon" },
    { id: "espagnol", name: "Espagnol", status: "soon" },
  ],
  langSoon: "bientôt",
  // Étape 2 · pourquoi
  s2Kicker: "Le pourquoi",
  s2Title: "Pourquoi cette langue ?",
  s2Lede: "Pour adapter vos exemples et votre rythme. Vous pourrez changer plus tard.",
  whys: [
    { id: "study" as Why, name: "Partir étudier ou travailler", desc: "Ausbildung, université, visa." },
    { id: "exam" as Why, name: "Passer un examen officiel", desc: "Une note à obtenir, une date à tenir." },
    { id: "envie" as Why, name: "Pour moi, par envie", desc: "Culture, voyage, curiosité." },
  ],
  // Étape 3 · point de départ
  s3Kicker: "Le point de départ",
  s3Title: "Où en êtes-vous ?",
  s3Lede: "Trois options honnêtes. Aucun jugement.",
  starts: [
    { id: "beginner" as StartPoint, name: "Je débute", desc: "Premiers mots, première leçon." },
    { id: "some_basics" as StartPoint, name: "J'ai déjà des bases", desc: "Quelques cours ou souvenirs de classe." },
    { id: "test" as StartPoint, name: "Faire un test de niveau rapide", desc: "Cinq minutes, on situe votre niveau." },
  ],
  errNoLang: "Choisissez une langue disponible.",
  errNoWhy: "Choisissez un motif.",
  errNoStart: "Choisissez un point de départ.",
} as const;

const COPY_EN = {
  progress: (n: number) => `Step ${n} of 3 · one minute`,
  back: "Back",
  next: "Continue",
  finish: "Finish",
  saving: "Saving…",
  s1Kicker: "The journey",
  s1Title: "Which language takes you along?",
  s1Lede: "Just one at launch. The others will follow.",
  langs: [
    { id: "deutsch" as LangId, name: "German", status: "live" },
    { id: "anglais", name: "English", status: "soon" },
    { id: "francais", name: "French", status: "soon" },
    { id: "espagnol", name: "Spanish", status: "soon" },
  ],
  langSoon: "soon",
  s2Kicker: "The why",
  s2Title: "Why this language?",
  s2Lede: "To adapt your examples and your rhythm. You can change later.",
  whys: [
    { id: "study" as Why, name: "Leave to study or work", desc: "Ausbildung, university, visa." },
    { id: "exam" as Why, name: "Take an official exam", desc: "A score to get, a date to hold." },
    { id: "envie" as Why, name: "For me, out of interest", desc: "Culture, travel, curiosity." },
  ],
  s3Kicker: "The starting point",
  s3Title: "Where are you now?",
  s3Lede: "Three honest options. No judgment.",
  starts: [
    { id: "beginner" as StartPoint, name: "I'm starting out", desc: "First words, first lesson." },
    { id: "some_basics" as StartPoint, name: "I have some basics", desc: "A few classes or school memories." },
    { id: "test" as StartPoint, name: "Take a quick level test", desc: "Five minutes to place your level." },
  ],
  errNoLang: "Pick an available language.",
  errNoWhy: "Pick a reason.",
  errNoStart: "Pick a starting point.",
} as const;

export default function OnboardingMondePage() {
  const router = useRouter();
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [lang, setLang] = useState<LangId | null>("deutsch"); // pre-selected live
  const [why, setWhy] = useState<Why | null>(null);
  const [startPoint, setStartPoint] = useState<StartPoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setError(null); }, [step]);

  function goNext() {
    if (step === 1 && !lang) { setError(c.errNoLang); return; }
    if (step === 2 && !why) { setError(c.errNoWhy); return; }
    if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3);
  }
  function goBack() {
    setError(null);
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  }

  async function handleFinish() {
    if (!startPoint) { setError(c.errNoStart); return; }
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          universe: "monde",
          onboarding: { language: lang, why, startPoint },
          activeLanguage: lang,
        },
      });
    } catch { /* on continue même si l'update échoue silencieusement */ }
    const dest = startPoint === "test"
      ? `/${locale}/test-niveau`
      : `/${locale}/dashboard`;
    router.push(dest);
    router.refresh();
  }

  return (
    <div className="entry-page entry-universe-monde" data-universe="monde">
      <header className="entry-header">
        <Link href={`/${locale}`} className="entry-brand" aria-label="YEMA">
          <BrandY variant="world" state="static" size={36} />
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
                        onClick={() => isLive && setLang(l.id as LangId)}
                      >
                        <span className="entry-choice-name">{t(l.name)}</span>
                        {!isLive ? (
                          <span className="entry-choice-badge">{c.langSoon}</span>
                        ) : null}
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
                {c.whys.map((w) => {
                  const active = why === w.id;
                  return (
                    <li key={w.id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={active}
                        className={`entry-choice ${active ? "on" : ""}`}
                        onClick={() => setWhy(w.id)}
                      >
                        <span className="entry-choice-name">{t(w.name)}</span>
                        <span className="entry-choice-desc">{t(w.desc)}</span>
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
