"use client";

// /onboarding/monde · Ambiance espresso/laiton, le voyage.
// Deux étapes seulement · pourquoi + point de départ. La langue est
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
import { frTypo } from "@/components/landing/typo";
import { classifyAuthError, withTimeout } from "@/lib/authErrors";

type Why = "study" | "exam" | "envie";
type StartPoint = "beginner" | "some_basics" | "test";

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
  s1Kicker: "Le pourquoi",
  s1Title: "Pourquoi l'allemand ?",
  s1Lede: "Pour adapter vos exemples et votre rythme. Vous pourrez changer plus tard.",
  whys: [
    { id: "study" as Why, name: "Partir étudier ou travailler", desc: "Ausbildung, université, visa." },
    { id: "exam" as Why, name: "Passer un examen officiel", desc: "Une note à obtenir, une date à tenir." },
    { id: "envie" as Why, name: "Pour moi, par envie", desc: "Culture, voyage, curiosité." },
  ],
  s2Kicker: "Le point de départ",
  s2Title: "Où en êtes-vous ?",
  s2Lede: "Trois options honnêtes. Aucun jugement.",
  starts: [
    { id: "beginner" as StartPoint, name: "Je débute", desc: "Premiers mots, première leçon." },
    { id: "some_basics" as StartPoint, name: "J'ai déjà des bases", desc: "Quelques cours ou souvenirs de classe." },
    { id: "test" as StartPoint, name: "Faire un test de niveau rapide", desc: "Cinq minutes, on situe votre niveau." },
  ],
  errNoWhy: "Choisissez un motif.",
  errNoStart: "Choisissez un point de départ.",
} as const;

const COPY_EN = {
  progress: (n: number) => `Step ${n} of 2 · one minute`,
  back: "Back",
  next: "Continue",
  finish: "Finish",
  saving: "Saving…",
  contextPrefix: "You picked",
  s1Kicker: "The why",
  s1Title: "Why German?",
  s1Lede: "To adapt your examples and your rhythm. You can change later.",
  whys: [
    { id: "study" as Why, name: "Leave to study or work", desc: "Ausbildung, university, visa." },
    { id: "exam" as Why, name: "Take an official exam", desc: "A score to get, a date to hold." },
    { id: "envie" as Why, name: "For me, out of interest", desc: "Culture, travel, curiosity." },
  ],
  s2Kicker: "The starting point",
  s2Title: "Where are you now?",
  s2Lede: "Three honest options. No judgment.",
  starts: [
    { id: "beginner" as StartPoint, name: "I'm starting out", desc: "First words, first lesson." },
    { id: "some_basics" as StartPoint, name: "I have some basics", desc: "A few classes or school memories." },
    { id: "test" as StartPoint, name: "Take a quick level test", desc: "Five minutes to place your level." },
  ],
  errNoWhy: "Pick a reason.",
  errNoStart: "Pick a starting point.",
} as const;

const DRAFT_KEY = "yema.onboarding.monde.draft";

interface Draft {
  step: 1 | 2;
  why: Why | null;
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
  const [why, setWhy] = useState<Why | null>(null);
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
      const d = JSON.parse(raw) as Draft;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (d.why) setWhy(d.why);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (d.startPoint) setStartPoint(d.startPoint);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (d.step === 2) setStep(2);
    } catch { /* draft corrompu, on ignore */ }
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
    // Sauvegarde AVANT d'appeler quoi que ce soit — si la session expire
    // et qu'on doit rediriger vers /login, l'utilisateur retrouve tout.
    saveDraft();
    setSaving(true);
    setError(null);
    setErrorAction(null);
    try {
      const supabase = createClient();
      // updateUser peut throw sur session invalide — on l'englobe dans withTimeout
      // pour éviter le hang et bénéficier du finally.
      const { error: updateErr } = await withTimeout(
        supabase.auth.updateUser({
          data: {
            universe: "monde",
            onboarding: { language: "deutsch", why, startPoint },
            activeLanguage: "deutsch",
          },
        }),
      );
      if (updateErr) {
        // Si updateUser rate (session révoquée) : classifie + affiche
        const key = classifyAuthError(updateErr);
        showError(key);
        return;
      }

      // POST /api/learning-paths — check res.ok explicit
      const intentionMap: Record<string, string> = {
        study: "VISA_DEPART",
        exam: "SUR_PLACE",
        envie: "SUR_PLACE",
      };
      const lpRes = await withTimeout(fetch("/api/learning-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universe: "MONDE",
          language: "DEUTSCH",
          intention: why ? intentionMap[why] : undefined,
          onboardingAnswers: { why, startPoint },
        }),
      }));
      if (lpRes.status === 401) { showError("session_expired"); return; }
      if (!lpRes.ok) { showError("finish_error"); return; }

      // POST /api/onboarding/complete — c'est CET appel qui écrit
      // onboarded_map[STUDENT]=true dans user_metadata (proxy le lit).
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

      // Succès : on peut effacer le draft et rediriger direct.
      clearDraft();
      const dest = startPoint === "test" ? "/test-niveau" : "/dashboard";
      router.push(dest);
      router.refresh();
    } catch (err) {
      // Réseau/timeout/exception JS → parseur unifié
      showError(classifyAuthError(err));
    } finally {
      // GARANTIE : le bouton se déverrouille TOUJOURS, quelle que soit
      // l'issue. Même si router.push a démarré, si la nav échoue on
      // laisse le user retenter.
      setSaving(false);
    }
  }

  function showError(key: string) {
    setError(t(tErr(key)));
    if (key === "session_expired") {
      // Lien vers login avec next préservant l'URL onboarding actuelle
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
