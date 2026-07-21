"use client";

// /register · La porte d'entrée YEMA · commune aux deux univers.
// Accepte ?universe=monde|racines et ?plan=<slug> depuis /pricing.
// Après signup, route vers /onboarding/{universe} · si aucun univers,
// renvoie sur /pricing pour choisir une porte d'entrée.
//
// Un seul champ email/téléphone (auto-détection · +237… vs email).
// Google OAuth optionnel · si non configuré côté Supabase, le bouton
// affiche une erreur douce sans casser le flow.

import Link from "next/link";
import { useRouter } from "@/navigation";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { frTypo } from "@/components/landing/typo";
import { BrandY } from "@/components/brand/BrandY";

type Universe = "monde" | "racines";

const COPY_FR = {
  brand: "YEMA",
  kicker: "L'entrée",
  title: "Créer votre compte.",
  lede: "Gratuit pour goûter, avant tout paiement.",
  contextMonde: (plan: string) => `Vous avez choisi ${plan}.`,
  contextRacines: (plan: string) => `Vous avez choisi ${plan}.`,
  fldName: "Nom",
  fldContact: "E-mail ou téléphone",
  fldContactHint: "Format e-mail (nom@domaine) ou téléphone (+237…).",
  fldPassword: "Mot de passe",
  fldPasswordHint: "Au moins huit caractères.",
  submit: "Créer mon compte",
  submitLoading: "On ouvre la porte…",
  sep: "ou",
  google: "Continuer avec Google",
  googleUnavailable: "Google n'est pas encore branché.",
  errPassword: "Mot de passe · au moins huit caractères.",
  errContactEmpty: "Un e-mail ou un numéro, pour vous retrouver.",
  errContactInvalid: "Ce numéro n'a pas l'air complet.",
  errEmailInvalid: "Cet e-mail n'a pas l'air valide.",
  errExists: "Cet e-mail a déjà un compte. Se connecter ?",
  errGeneric: "Un souci de connexion. Réessayez dans un instant.",
  loginPrompt: "Déjà un compte ?",
  loginCta: "Se connecter",
  legal: "En créant votre compte, vous acceptez nos conditions et notre politique de confidentialité.",
  successTitle: "Vérifiez votre boîte.",
  successBody: "Nous vous avons envoyé un lien pour confirmer votre inscription.",
} as const;

const COPY_EN = {
  brand: "YEMA",
  kicker: "The entrance",
  title: "Create your account.",
  lede: "Free to taste, before any payment.",
  contextMonde: (plan: string) => `You picked ${plan}.`,
  contextRacines: (plan: string) => `You picked ${plan}.`,
  fldName: "Name",
  fldContact: "Email or phone",
  fldContactHint: "Email format (name@domain) or phone (+237…).",
  fldPassword: "Password",
  fldPasswordHint: "At least eight characters.",
  submit: "Create my account",
  submitLoading: "Opening the door…",
  sep: "or",
  google: "Continue with Google",
  googleUnavailable: "Google isn't wired up yet.",
  errPassword: "Password · at least eight characters.",
  errContactEmpty: "An email or a phone, to find you again.",
  errContactInvalid: "This number doesn't look complete.",
  errEmailInvalid: "This email doesn't look valid.",
  errExists: "This email already has an account. Sign in?",
  errGeneric: "A connection hiccup. Try again in a moment.",
  loginPrompt: "Already have an account?",
  loginCta: "Sign in",
  legal: "By creating your account, you accept our terms and privacy policy.",
  successTitle: "Check your inbox.",
  successBody: "We sent you a link to confirm your registration.",
} as const;

const PLAN_LABEL_FR: Record<string, string> = {
  "passage-a1": "Le Passage · Allemand A1",
  "passage-a2": "Le Passage · Allemand A2",
  "passage-b1": "Le Passage · Allemand B1",
  "passage-b2": "Le Passage · Allemand B2",
  "passage-c1": "Le Passage · Allemand C1",
  "racines-solo": "Solo · une personne, une langue",
  "racines-famille": "Famille · deux adultes et jusqu'à quatre enfants",
};
const PLAN_LABEL_EN: Record<string, string> = {
  "passage-a1": "The Passage · German A1",
  "passage-a2": "The Passage · German A2",
  "passage-b1": "The Passage · German B1",
  "passage-b2": "The Passage · German B2",
  "passage-c1": "The Passage · German C1",
  "racines-solo": "Solo · one person, one language",
  "racines-famille": "Family · two adults and up to four children",
};

/** Détecte si la valeur ressemble à un téléphone (+237… ou digits). */
function isPhoneLike(v: string): boolean {
  const s = v.trim().replace(/[\s-]/g, "");
  return /^\+?\d{7,}$/.test(s);
}
function isEmailLike(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

  const universeParam = searchParams.get("universe");
  const universe: Universe | null =
    universeParam === "monde" || universeParam === "racines" ? universeParam : null;
  const plan = searchParams.get("plan") ?? "";
  const prof = searchParams.get("prof") === "1";

  const planLabel = useMemo(() => {
    const map = loc === "en" ? PLAN_LABEL_EN : PLAN_LABEL_FR;
    const base = map[plan] ?? "";
    if (base && prof) return loc === "en" ? `${base} + teacher` : `${base} + professeur`;
    return base;
  }, [plan, prof, loc]);

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-focus premier champ visible au mount (accessibilité)
  useEffect(() => {
    const el = document.querySelector<HTMLInputElement>("input[data-autofocus]");
    el?.focus();
  }, []);

  // Après signup, on va TOUJOURS dans le tunnel d'onboarding.
  // - Si univers connu (register?universe=monde|racines) : direct vers la bonne page.
  // - Sinon : /onboarding est un router qui demande l'univers puis dirige.
  //   (Ancien comportement : /pricing → boucle publique, l'user perdait le fil.)
  const onboardingRoute = universe === "racines"
    ? "/onboarding/racines"
    : universe === "monde"
      ? "/onboarding/monde"
      : "/onboarding";

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = contact.trim();
    if (!trimmed) { setError(c.errContactEmpty); return; }
    if (password.length < 8) { setError(c.errPassword); return; }

    const usePhone = isPhoneLike(trimmed);
    const useEmail = isEmailLike(trimmed);
    if (!usePhone && !useEmail) {
      setError(loc === "en" ? "That doesn't look like an email or a phone." : "Ce n'est ni un e-mail ni un numéro.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const options = {
      data: {
        full_name: fullName || null,
        role: "STUDENT" as const,
        universe: universe ?? null,
        plan: plan || null,
        prof,
      },
      // Callback URL est ABSOLU (pas next-intl) · on passe le chemin
      // complet avec locale pour que le handler redirige correctement.
      emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/${locale}${onboardingRoute}`)}`,
    };

    const credentials = usePhone
      ? { phone: trimmed.replace(/[\s-]/g, ""), password, options }
      : { email: trimmed, password, options };

    const { data, error: signUpError } = await supabase.auth.signUp(credentials);

    if (signUpError) {
      const msg = signUpError.message?.toLowerCase() ?? "";
      if (msg.includes("already") || msg.includes("exists") || msg.includes("registered")) {
        setError(c.errExists);
      } else if (msg.includes("email")) {
        setError(c.errEmailInvalid);
      } else if (msg.includes("phone")) {
        setError(c.errContactInvalid);
      } else {
        setError(c.errGeneric);
      }
      setLoading(false);
      return;
    }

    // Cookie rôle pour le middleware (ne bloque pas si échec)
    try {
      document.cookie = `user_role=STUDENT;path=/;max-age=2592000`;
      document.cookie = `active_space=STUDENT;path=/;max-age=2592000`;
    } catch { /* ok */ }

    if (data.session) {
      // Session immédiate (téléphone confirmation sms, ou email confirmé).
      // Router de @/navigation AJOUTE déjà la locale · on passe un
      // chemin NU pour éviter /fr/fr/onboarding/…
      router.push(onboardingRoute);
      router.refresh();
      return;
    }
    // Sinon on montre l'écran « vérifiez votre boîte »
    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/${locale}${onboardingRoute}`)}`;
      const params = new URLSearchParams();
      if (universe) params.set("universe", universe);
      if (plan) params.set("plan", plan);
      if (prof) params.set("prof", "1");
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${redirectTo}${params.toString() ? `&${params.toString()}` : ""}`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (oauthError) {
        setError(c.googleUnavailable);
        setGoogleLoading(false);
      }
      // Redirect handled by supabase · loading stays true
    } catch {
      setError(c.googleUnavailable);
      setGoogleLoading(false);
    }
  }

  const universeClass = universe === "racines" ? "entry-universe-racines" : universe === "monde" ? "entry-universe-monde" : "";

  return (
    <div className={`entry-page ${universeClass}`} data-universe={universe ?? "none"}>
      <header className="entry-header">
        <Link href={`/${locale}`} className="entry-brand" aria-label={c.brand}>
          <BrandY variant={universe === "racines" ? "sources" : "world"} state="static" size={36} />
        </Link>
        <p className="entry-header-alt">
          {t(c.loginPrompt)}{" "}
          <Link href={`/${locale}/login`} className="entry-header-link">{t(c.loginCta)}</Link>
        </p>
      </header>

      <main className="entry-main">
        <div className="entry-card">
          {success ? (
            <div className="entry-success">
              <h1 className="entry-h">{t(c.successTitle)}</h1>
              <p className="entry-lede">{t(c.successBody)}</p>
            </div>
          ) : (
            <>
              <p className="entry-kicker">{t(c.kicker).toUpperCase()}</p>
              <h1 className="entry-h">{t(c.title)}</h1>
              <p className="entry-lede">{t(c.lede)}</p>

              {planLabel ? (
                <div className="entry-context" role="note">
                  <span className="entry-context-dot" aria-hidden="true" />
                  <span className="entry-context-text">
                    {universe === "racines"
                      ? t(c.contextRacines(planLabel))
                      : t(c.contextMonde(planLabel))}
                  </span>
                </div>
              ) : null}

              <form onSubmit={handleRegister} className="entry-form" noValidate>
                <label className="entry-field">
                  <span className="entry-field-lbl">{t(c.fldName)}</span>
                  <input
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="entry-input"
                    data-autofocus
                  />
                </label>

                <label className="entry-field">
                  <span className="entry-field-lbl">{t(c.fldContact)}</span>
                  <input
                    type="text"
                    inputMode="email"
                    required
                    autoComplete="username"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="entry-input"
                    aria-describedby="contact-hint"
                  />
                  <span id="contact-hint" className="entry-field-hint">{t(c.fldContactHint)}</span>
                </label>

                <label className="entry-field">
                  <span className="entry-field-lbl">{t(c.fldPassword)}</span>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="entry-input"
                    aria-describedby="password-hint"
                  />
                  <span id="password-hint" className="entry-field-hint">{t(c.fldPasswordHint)}</span>
                </label>

                {error ? <p className="entry-err" role="alert">{error}</p> : null}

                <button type="submit" className="entry-cta entry-cta-primary" disabled={loading}>
                  {loading ? t(c.submitLoading) : t(c.submit)}
                </button>

                <div className="entry-sep" aria-hidden="true"><span>{c.sep}</span></div>

                <button
                  type="button"
                  className="entry-cta entry-cta-ghost"
                  onClick={handleGoogle}
                  disabled={googleLoading || loading}
                >
                  <span className="entry-google-dot" aria-hidden="true" />
                  {t(c.google)}
                </button>
              </form>

              <p className="entry-legal">{t(c.legal)}</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
