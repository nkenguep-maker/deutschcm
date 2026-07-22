"use client";

// /onboarding/racines · Ambiance terre/cuivre, la transmission.
// Deux étapes seulement · lien + point de départ. La langue est déjà
// connue via le plan choisi sur /pricing (wolof au lancement).
// Rappel de l'offre en haut. Aucune IA, aucun Klaus.
//
// Client Component — le SSR wrapper page.tsx vérifie déjà la session.
// handleFinish détecte les 401 en cours et propose une reconnexion
// sans perdre les réponses (persistées en localStorage).

import Link from "next/link";
import { useRouter } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BrandY } from "@/components/brand/BrandY";
import { frTypo } from "@/components/landing/typo";
import { classifyAuthError, withTimeout } from "@/lib/authErrors";

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

const DRAFT_KEY = "yema.onboarding.racines.draft";

interface Draft {
  step: 1 | 2;
  link: Link_ | null;
  startPoint: StartPoint | null;
}

export function OnboardingRacinesForm() {
  const router = useRouter();
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const tErr = useTranslations("auth.errors");
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

  const [step, setStep] = useState<1 | 2>(1);
  const [link, setLink] = useState<Link_ | null>(null);
  const [startPoint, setStartPoint] = useState<StartPoint | null>(null);
  const [planLabel, setPlanLabel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [errorAction, setErrorAction] = useState<null | { label: string; href: string }>(null);
  const [saving, setSaving] = useState(false);

  // Restaure les réponses (cas : 401 → user reconnecté → back ici)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Draft;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (d.link) setLink(d.link);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (d.startPoint) setStartPoint(d.startPoint);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (d.step === 2) setStep(2);
    } catch { /* draft corrompu */ }
  }, []);

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
    if (step === 1 && !link) { setError(c.errNoLink); setErrorAction(null); return; }
    if (step < 2) { setError(null); setErrorAction(null); setStep(2); }
  }
  function goBack() {
    setError(null);
    setErrorAction(null);
    if (step > 1) setStep((s) => (s - 1) as 1 | 2);
  }

  function saveDraft() {
    try {
      const d: Draft = { step, link, startPoint };
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch { /* ok */ }
  }
  function clearDraft() {
    try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* ok */ }
  }

  function showError(key: string) {
    setError(t(tErr(key)));
    if (key === "session_expired") {
      const next = `/${locale}/onboarding/racines`;
      setErrorAction({
        label: t(tErr("session_expired_action")),
        href: `/${locale}/login?next=${encodeURIComponent(next)}`,
      });
    } else {
      setErrorAction(null);
    }
  }

  async function handleFinish() {
    if (!startPoint) { setError(c.errNoStart); setErrorAction(null); return; }
    saveDraft();
    setSaving(true);
    setError(null);
    setErrorAction(null);
    try {
      const supabase = createClient();
      const { error: updateErr } = await withTimeout(
        supabase.auth.updateUser({
          data: {
            universe: "racines",
            onboarding: { language: "wolof", link, startPoint },
            activeLanguage: "wolof",
          },
        }),
      );
      if (updateErr) { showError(classifyAuthError(updateErr)); return; }

      const intentionMap: Record<string, string> = {
        understand: "RACINES_SOI",
        family_words: "TRANSMISSION",
        zero: "RACINES_SOI",
      };
      const lpRes = await withTimeout(fetch("/api/learning-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universe: "RACINES",
          language: "WOLOF",
          intention: link ? intentionMap[link] : undefined,
          onboardingAnswers: { link, startPoint },
        }),
      }));
      if (lpRes.status === 401) { showError("session_expired"); return; }
      if (!lpRes.ok) { showError("finish_error"); return; }

      const ocRes = await withTimeout(fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "STUDENT",
          activeLanguage: "wolof",
        }),
      }));
      if (ocRes.status === 401) { showError("session_expired"); return; }
      if (!ocRes.ok) { showError("finish_error"); return; }

      // Racines · aucun contenu de découverte n'est encore actif (§14-15).
      // On persiste néanmoins le point de départ Racines (É1-É5) dérivé du
      // startPoint pour préparer le futur : beginner→E1, some_basics→E2, test→E3.
      const racinesStep = startPoint === "beginner" ? "E1" : startPoint === "some_basics" ? "E2" : "E3";
      await fetch("/api/funnel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patch: { racinesStep } }),
      }).catch(() => {});
      clearDraft();
      // Le router /onboarding décide la prochaine étape · en Racines pour
      // l'instant : /decouverte/attente (langue soon).
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      showError(classifyAuthError(err));
    } finally {
      setSaving(false);
    }
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

          {error ? (
            <div className="entry-err" role="alert" aria-live="polite">
              <p>{error}</p>
              {errorAction ? (
                <p className="entry-err-actions">
                  <Link href={errorAction.href} className="entry-err-link">
                    {errorAction.label}
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}

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
