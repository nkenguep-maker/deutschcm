"use client";

// /onboarding/monde · Ambiance espresso/laiton, le voyage.
// Deux étapes seulement · objectif de parcours + point de départ. La langue est
// déjà connue via le plan choisi sur /pricing (deutsch au lancement).
// Rappel de l'offre en haut si l'user vient d'un plan.
//
// Ce fichier est un Client Component. Le SSR wrapper page.tsx a déjà
// vérifié la session — on peut supposer un user auth'd au premier rendu.
// Mais la session peut expirer PENDANT le remplissage : handleFinish
// détecte les 401 et propose une reconnexion sans perdre les réponses.

import Link from "next/link";
import { useRouter } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BrandY } from "@/components/brand/BrandY";
import { SeuilGreetings } from "@/components/seuil/SeuilGreeting";
import { frTypo } from "@/components/landing/typo";
import { classifyAuthError, withTimeout } from "@/lib/authErrors";

type PathwayChoice = "STUDIES" | "VISA" | "NATURALIZATION" | "TOURISM";
type StartPoint = "beginner" | "some_basics" | "test";

function isPathwayChoice(value: unknown): value is PathwayChoice {
  return value === "STUDIES" || value === "VISA" || value === "NATURALIZATION" || value === "TOURISM";
}

const PLAN_LABEL_FR: Record<string, string> = {
  "passage-a1": "Le Passage · Allemand A1",
  "passage-a2": "Le Passage · Allemand A2",
  "passage-b1": "Le Passage · Allemand B1",
  "passage-b2": "Le Passage · Allemand B2",
  "passage-c1": "Le Passage · Allemand C1",
};
const PLAN_LABEL_EN: Record<string, string> = {
  "passage-a1": "The Passage · German A1",
  "passage-a2": "The Passage · German A2",
  "passage-b1": "The Passage · German B1",
  "passage-b2": "The Passage · German B2",
  "passage-c1": "The Passage · German C1",
};

const COPY_FR = {
  progress: (n: number) => `Étape ${n} sur 2 · une minute`,
  back: "Retour",
  next: "Continuer",
  finish: "Terminer",
  saving: "On enregistre…",
  contextPrefix: "Vous avez choisi",
  s1Kicker: "Votre objectif",
  s1Title: "À quoi doit vous servir l'allemand ?",
  s1Lede: "Le niveau reste le même pour tous. Nous adaptons une partie des situations et exemples à votre objectif.",
  whys: [
    { id: "STUDIES" as PathwayChoice, name: "Études", desc: "Université, Ausbildung, vie de campus." },
    { id: "VISA" as PathwayChoice, name: "Travailler ou m’installer", desc: "Emploi, rendez-vous, formulaires et démarches." },
    { id: "NATURALIZATION" as PathwayChoice, name: "Naturalisation", desc: "Objectif B1-B2, vie quotidienne et situations civiques." },
    { id: "TOURISM" as PathwayChoice, name: "Tourisme et voyage", desc: "Hôtel, transport, restaurant et sorties." },
  ],
  s2Kicker: "Le point de départ",
  s2Title: "Où en êtes-vous ?",
  s2Lede: "Trois options honnêtes. Aucun jugement.",
  starts: [
    { id: "beginner" as StartPoint, name: "Je débute", desc: "Premiers mots, première leçon." },
    { id: "some_basics" as StartPoint, name: "J'ai déjà des bases", desc: "Quelques cours ou souvenirs de classe." },
    { id: "test" as StartPoint, name: "Faire un test de niveau rapide", desc: "Cinq minutes, on situe votre niveau." },
  ],
  errNoWhy: "Choisissez un objectif.",
  errNoStart: "Choisissez un point de départ.",
} as const;

const COPY_EN = {
  progress: (n: number) => `Step ${n} of 2 · one minute`,
  back: "Back",
  next: "Continue",
  finish: "Finish",
  saving: "Saving…",
  contextPrefix: "You picked",
  s1Kicker: "Your goal",
  s1Title: "What should German help you do?",
  s1Lede: "The language level stays the same for everyone. We adapt part of the situations and examples to your goal.",
  whys: [
    { id: "STUDIES" as PathwayChoice, name: "Studies", desc: "University, Ausbildung and campus life." },
    { id: "VISA" as PathwayChoice, name: "Work or move abroad", desc: "Work, appointments, forms and procedures." },
    { id: "NATURALIZATION" as PathwayChoice, name: "Naturalization", desc: "B1-B2 goal, daily life and civic situations." },
    { id: "TOURISM" as PathwayChoice, name: "Tourism and travel", desc: "Hotels, transport, restaurants and outings." },
  ],
  s2Kicker: "The starting point",
  s2Title: "Where are you now?",
  s2Lede: "Three honest options. No judgment.",
  starts: [
    { id: "beginner" as StartPoint, name: "I'm starting out", desc: "First words, first lesson." },
    { id: "some_basics" as StartPoint, name: "I have some basics", desc: "A few classes or school memories." },
    { id: "test" as StartPoint, name: "Take a quick level test", desc: "Five minutes to place your level." },
  ],
  errNoWhy: "Pick a goal.",
  errNoStart: "Pick a starting point.",
} as const;

const DRAFT_KEY = "yema.onboarding.monde.draft";

interface Draft {
  step: 1 | 2;
  why: PathwayChoice | null;
  startPoint: StartPoint | null;
}

export function OnboardingMondeForm() {
  const router = useRouter();
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const tErr = useTranslations("auth.errors");
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

  const [step, setStep] = useState<1 | 2>(1);
  const [why, setWhy] = useState<PathwayChoice | null>(null);
  const [startPoint, setStartPoint] = useState<StartPoint | null>(null);
  const [planLabel, setPlanLabel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [errorAction, setErrorAction] = useState<null | { label: string; href: string }>(null);
  const [saving, setSaving] = useState(false);

  // Restaure les réponses d'une session précédente (cas : 401 pendant
  // handleFinish → user reconnecté → arrive ici avec draft en localStorage).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Partial<Draft>;
      // Les anciens drafts study/exam/envie sont volontairement ignorés : ils
      // sont trop ambigus pour choisir automatiquement une nouvelle variante.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (isPathwayChoice(d.why)) setWhy(d.why);
      if (d.startPoint) setStartPoint(d.startPoint);
      if (d.step === 2) setStep(2);
    } catch { /* draft corrompu, on ignore */ }
  }, []);

  // Le sélecteur d'entrée connaît déjà le projet de l'apprenant : on garde
  // ce choix en un tap et on arrive directement à la dernière question.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const variant = (data.user?.user_metadata as { pathway_variant?: unknown })?.pathway_variant;
      if (!isPathwayChoice(variant)) return;
      setWhy((current) => current ?? variant);
      setStep((current) => current === 1 ? 2 : current);
    }).catch(() => { /* silent: the standard two-step path remains available */ });
  }, []);

  // Récupère le plan depuis user_metadata (posé au signup).
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
    if (step === 1 && !why) { setError(c.errNoWhy); setErrorAction(null); return; }
    if (step < 2) { setError(null); setErrorAction(null); setStep(2); }
  }
  function goBack() {
    setError(null);
    setErrorAction(null);
    if (step > 1) setStep((s) => (s - 1) as 1 | 2);
  }

  /** Sauvegarde le draft AVANT toute action risquée (401 possible). */
  function saveDraft() {
    try {
      const d: Draft = { step, why, startPoint };
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch { /* localStorage plein ou bloqué : tant pis */ }
  }
  function clearDraft() {
    try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* ok */ }
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
            universe: "monde",
            onboarding: { language: "deutsch", why, pathwayVariant: why, startPoint },
            activeLanguage: "deutsch",
          },
        }),
      );
      if (updateErr) {
        const key = classifyAuthError(updateErr);
        showError(key);
        return;
      }

      // Intention reste le champ historique de haut niveau. La personnalisation
      // précise vit dans onboardingAnswers.pathwayVariant, sans migration DB.
      const intentionMap: Record<PathwayChoice, "VISA_DEPART" | "SUR_PLACE"> = {
        STUDIES: "VISA_DEPART",
        VISA: "VISA_DEPART",
        NATURALIZATION: "SUR_PLACE",
        TOURISM: "SUR_PLACE",
      };
      const lpRes = await withTimeout(fetch("/api/learning-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universe: "MONDE",
          language: "DEUTSCH",
          intention: why ? intentionMap[why] : undefined,
          onboardingAnswers: { why, pathwayVariant: why, startPoint },
        }),
      }));
      if (lpRes.status === 401) { showError("session_expired"); return; }
      if (!lpRes.ok) { showError("finish_error"); return; }

      const ocRes = await withTimeout(fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "STUDENT",
          activeLanguage: "deutsch",
        }),
      }));
      if (ocRes.status === 401) { showError("session_expired"); return; }
      if (!ocRes.ok) { showError("finish_error"); return; }

      const ocBody = await ocRes.json().catch(() => ({} as {
        redirectTo?: string;
        postOnboardingRedirectApplied?: boolean;
      }));
      clearDraft();
      const apiDestination = typeof ocBody.redirectTo === "string" ? ocBody.redirectTo : "/dashboard";
      const dest = !ocBody.postOnboardingRedirectApplied && startPoint === "test"
        ? "/test-niveau"
        : apiDestination;
      router.push(dest);
      router.refresh();
    } catch (err) {
      showError(classifyAuthError(err));
    } finally {
      setSaving(false);
    }
  }

  function showError(key: string) {
    setError(t(tErr(key)));
    if (key === "session_expired") {
      const next = `/${locale}/onboarding/monde`;
      setErrorAction({
        label: t(tErr("session_expired_action")),
        href: `/${locale}/login?next=${encodeURIComponent(next)}`,
      });
    } else {
      setErrorAction(null);
    }
  }

  return (
    <div className="entry-page entry-universe-monde" data-universe="monde">
      <SeuilGreetings locale={loc} visibleCount={3} pool="world" variant="entry" />
      <header className="entry-header">
        <Link href={`/${locale}`} className="entry-brand" aria-label="YEMA">
          <BrandY variant="world" state="static" size={36} />
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
