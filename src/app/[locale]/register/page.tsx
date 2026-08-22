"use client";

import Link from "next/link";
import { useRouter } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { frTypo } from "@/components/landing/typo";
import { BrandY } from "@/components/brand/BrandY";
import { SeuilGreetings } from "@/components/seuil/SeuilGreeting";
import { classifyAuthError, withTimeout, type AuthErrorKey } from "@/lib/authErrors";
import { sanitizeInternalNext } from "@/lib/authRedirect";
import {
  createPreconfirmationIdentity,
  PRECONFIRMATION_DRAFT_KEY,
  PRECONFIRMATION_IDENTITY_KEY,
} from "@/lib/preconfirmationJourney";

type Universe = "monde" | "racines";

type SelectedPlan =
  | "passage-a1"
  | "passage-a2"
  | "passage-b1"
  | "passage-b2"
  | "passage-c1"
  | "racines-solo"
  | "racines-famille";

const VALID_PLANS = new Set<SelectedPlan>([
  "passage-a1",
  "passage-a2",
  "passage-b1",
  "passage-b2",
  "passage-c1",
  "racines-solo",
  "racines-famille",
]);

const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

function parseSelectedPlan(value: string | null): SelectedPlan | null {
  return value && VALID_PLANS.has(value as SelectedPlan) ? value as SelectedPlan : null;
}

const COPY = {
  fr: {
    kicker: "L'entrée",
    title: "Créer votre compte.",
    lede: "Votre identité reste la même dans tous vos espaces YEMA.",
    firstName: "Prénom",
    lastName: "Nom",
    email: "E-mail",
    password: "Mot de passe",
    passwordHint: "Au moins huit caractères.",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
    submit: "Créer mon compte",
    loading: "On ouvre la porte…",
    google: "Continuer avec Google",
    googleUnavailable: "Google n'est pas encore branché.",
    emailInvalid: "Entrez une adresse e-mail valide.",
    nameMissing: "Renseignez votre prénom et votre nom.",
    passwordInvalid: "Le mot de passe doit contenir au moins huit caractères.",
    loginPrompt: "Déjà un compte ?",
    loginCta: "Se connecter",
    legalBefore: "En créant votre compte, vous acceptez nos ",
    legalTerms: "conditions d’utilisation",
    legalMiddle: " et notre ",
    legalPrivacy: "politique de confidentialité.",
    successTitle: "Vérifiez votre boîte.",
    successBody: "Votre lien de confirmation est en route. Vous pouvez déjà préparer votre parcours.",
    successContinue: "Préparer mon parcours",
    successLogin: "J’ai confirmé mon adresse",
    successChangeEmail: "Corriger mon adresse",
    resend: "Renvoyer l’e-mail de confirmation",
    resending: "Nouvel envoi en cours…",
    resendHelp: "Regardez aussi dans les indésirables.",
    resendSent: "Un nouveau lien a été demandé. Vérifiez votre boîte de réception.",
    resendRateLimited: "Trop de demandes pour le moment. Attendez un peu avant de réessayer.",
    resendError: "Le nouvel e-mail n’a pas pu être demandé. Réessayez dans un instant.",
  },
  en: {
    kicker: "The entrance",
    title: "Create your account.",
    lede: "Your identity stays the same across all your YEMA spaces.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    password: "Password",
    passwordHint: "At least eight characters.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    submit: "Create my account",
    loading: "Opening the door…",
    google: "Continue with Google",
    googleUnavailable: "Google isn't wired up yet.",
    emailInvalid: "Enter a valid email address.",
    nameMissing: "Enter your first and last name.",
    passwordInvalid: "Your password must contain at least eight characters.",
    loginPrompt: "Already have an account?",
    loginCta: "Sign in",
    legalBefore: "By creating your account, you accept our ",
    legalTerms: "terms of use",
    legalMiddle: " and ",
    legalPrivacy: "privacy policy.",
    successTitle: "Check your inbox.",
    successBody: "Your confirmation link is on its way. You can already prepare your journey.",
    successContinue: "Prepare my journey",
    successLogin: "I confirmed my email",
    successChangeEmail: "Correct my email",
    resend: "Resend confirmation email",
    resending: "Requesting a new email…",
    resendHelp: "Please check your spam folder too.",
    resendSent: "A new link was requested. Check your inbox.",
    resendRateLimited: "Too many requests for now. Please wait a little before trying again.",
    resendError: "We could not request a new email. Please try again shortly.",
  },
} as const;

function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function getSupabaseClient() {
  const { createClient } = await import("@/lib/supabase/client");
  return createClient();
}

function clearPreconfirmationStorage() {
  try {
    window.localStorage.removeItem(PRECONFIRMATION_DRAFT_KEY);
    window.localStorage.removeItem(PRECONFIRMATION_IDENTITY_KEY);
  } catch {
    // Registration must remain available when browser storage is disabled.
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const loc = locale === "en" ? "en" : "fr";
  const c = COPY[loc];
  const t = (value: string) => (loc === "fr" ? frTypo(value) : value);
  const tErr = useTranslations("auth.errors");

  const universeParam = searchParams.get("universe");
  const universe: Universe | null = universeParam === "monde" || universeParam === "racines"
    ? universeParam
    : null;
  const selectedPlan = parseSelectedPlan(searchParams.get("plan"));
  const rootsSoloSelected = searchParams.get("addon") === "roots-solo";
  const rootsCoachSelected = searchParams.get("addon") === "roots-coach";
  const teacherAddonRequested = searchParams.get("prof") === "1";
  const rawNext = searchParams.get("next");
  const safeNext = sanitizeInternalNext(rawNext, `/${locale}/dashboard`);
  const loginHref = rawNext
    ? `/${locale}/login?next=${encodeURIComponent(safeNext)}`
    : `/${locale}/login`;

  const personaIntentQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedPlan) params.set("plan", selectedPlan);
    if (rootsSoloSelected) params.set("addon", "roots-solo");
    else if (rootsCoachSelected) params.set("addon", "roots-coach");
    if (teacherAddonRequested) params.set("prof", "1");
    if (rawNext) params.set("next", safeNext);
    const suffix = params.toString();
    return suffix ? `?${suffix}` : "";
  }, [rawNext, rootsCoachSelected, rootsSoloSelected, safeNext, selectedPlan, teacherAddonRequested]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "rate_limited" | "error">("idle");
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  const errorFromKey = (key: AuthErrorKey): string => t(tErr(key));
  const localizedPersonaRoute = `/${locale}/onboarding/persona${personaIntentQuery}`;
  const appPersonaRoute = `/onboarding/persona${personaIntentQuery}`;
  const preconfirmationOnboardingHref = `/${locale}/pre-onboarding${personaIntentQuery}`;

  useEffect(() => {
    document.querySelector<HTMLInputElement>("input[data-autofocus]")?.focus();
  }, []);

  useEffect(() => {
    if (success) successHeadingRef.current?.focus();
  }, [success]);

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setResendState("idle");

    const first = firstName.trim();
    const last = lastName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!first || !last) {
      setError(t(c.nameMissing));
      return;
    }
    if (!isEmailLike(normalizedEmail)) {
      setError(t(c.emailInvalid));
      return;
    }
    if (password.length < 8) {
      setError(t(c.passwordInvalid));
      return;
    }

    setLoading(true);
    try {
      const supabase = await getSupabaseClient();
      const fullName = `${first} ${last}`;
      const selectedAddon = rootsSoloSelected ? "roots-solo" : rootsCoachSelected ? "roots-coach" : null;
      const { data, error: signUpError } = await withTimeout(
        supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: fullName,
              first_name: first,
              last_name: last,
              universe: universe ?? null,
              selected_plan: selectedPlan,
              selected_addons: selectedAddon ? [selectedAddon] : [],
              teacher_addon_requested: teacherAddonRequested,
              post_onboarding_next: rawNext ? safeNext : null,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(localizedPersonaRoute)}`,
          },
        }),
      );

      if (signUpError) {
        setError(errorFromKey(classifyAuthError(signUpError)));
        return;
      }

      if (data.session) {
        clearPreconfirmationStorage();
        const syncResponse = await fetch("/api/auth/sync", { method: "POST" });
        if (!syncResponse.ok) {
          await supabase.auth.signOut();
          setError(errorFromKey("generic"));
          return;
        }
        await supabase.auth.refreshSession();
        router.push(appPersonaRoute);
        router.refresh();
        return;
      }

      if (data.user?.id) {
        try {
          window.localStorage.removeItem(PRECONFIRMATION_DRAFT_KEY);
          window.localStorage.setItem(
            PRECONFIRMATION_IDENTITY_KEY,
            JSON.stringify(createPreconfirmationIdentity(data.user.id)),
          );
        } catch {
          // The confirmation flow still works without same-device draft recovery.
        }
      }
      setSuccess(true);
    } catch (registerError) {
      setError(errorFromKey(classifyAuthError(registerError)));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      const supabase = await getSupabaseClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(localizedPersonaRoute)}`;
      const { error: oauthError } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo, queryParams: { access_type: "offline", prompt: "consent" } },
        }),
      );
      if (oauthError) setError(t(c.googleUnavailable));
    } catch (oauthError) {
      const key = classifyAuthError(oauthError);
      setError(key === "network" || key === "timeout" ? errorFromKey(key) : t(c.googleUnavailable));
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleResendConfirmation() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!isEmailLike(normalizedEmail)) return;

    setResendState("sending");
    try {
      const supabase = await getSupabaseClient();
      const { error: resendError } = await withTimeout(
        supabase.auth.resend({
          type: "signup",
          email: normalizedEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(localizedPersonaRoute)}`,
          },
        }),
      );
      if (resendError) {
        setResendState(classifyAuthError(resendError) === "rate_limited" ? "rate_limited" : "error");
        return;
      }
      setResendState("sent");
    } catch (resendError) {
      setResendState(classifyAuthError(resendError) === "rate_limited" ? "rate_limited" : "error");
    }
  }

  return (
    <div className={`entry-page ${universe === "racines" ? "entry-universe-racines" : universe === "monde" ? "entry-universe-monde" : ""}`}>
      <SeuilGreetings
        locale={loc}
        visibleCount={3}
        pool={universe === "monde" ? "world" : universe === "racines" ? "sources" : "all"}
        variant="entry"
      />
      <header className="entry-header">
        <Link href={`/${locale}`} className="entry-brand" aria-label="YEMA">
          <BrandY variant={universe === "racines" ? "sources" : "world"} state="static" size={36} />
        </Link>
        <p className="entry-header-alt">
          {t(c.loginPrompt)}{" "}<Link href={loginHref} className="entry-header-link">{t(c.loginCta)}</Link>
        </p>
      </header>

      <main className="entry-main">
        <div className="entry-card">
          {success ? (
            <div className="entry-success">
              <h1 ref={successHeadingRef} className="entry-h" tabIndex={-1}>{t(c.successTitle)}</h1>
              <p className="entry-lede">{t(c.successBody)}</p>
              <p className="entry-success-help">{t(c.resendHelp)}</p>
              <div className="entry-success-actions">
                <Link href={preconfirmationOnboardingHref} className="entry-cta entry-cta-primary">{t(c.successContinue)}</Link>
                <Link href={loginHref} className="entry-cta entry-cta-ghost">{t(c.successLogin)}</Link>
                <button
                  type="button"
                  className="entry-cta entry-cta-ghost"
                  onClick={handleResendConfirmation}
                  disabled={resendState === "sending"}
                >
                  {t(resendState === "sending" ? c.resending : c.resend)}
                </button>
                <button
                  type="button"
                  className="entry-cta entry-cta-ghost"
                  onClick={() => {
                    clearPreconfirmationStorage();
                    setResendState("idle");
                    setSuccess(false);
                  }}
                >
                  {t(c.successChangeEmail)}
                </button>
              </div>
              {resendState !== "idle" && resendState !== "sending" ? (
                <p className={`entry-success-feedback ${resendState === "sent" ? "is-success" : "is-error"}`} role="status">
                  {t(resendState === "sent" ? c.resendSent : resendState === "rate_limited" ? c.resendRateLimited : c.resendError)}
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <p className="entry-kicker">{t(c.kicker).toUpperCase()}</p>
              <h1 className="entry-h">{t(c.title)}</h1>
              <p className="entry-lede">{t(c.lede)}</p>

              {selectedPlan || rootsSoloSelected || rootsCoachSelected || teacherAddonRequested ? (
                <div className="entry-context" role="note">
                  <span className="entry-context-dot" aria-hidden="true" />
                  <span className="entry-context-text">
                    {loc === "en" ? "Your selected offer will be kept through onboarding." : "Votre choix d’offre sera conservé pendant l’onboarding."}
                  </span>
                </div>
              ) : null}

              <form onSubmit={handleRegister} className="entry-form" noValidate>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label className="entry-field">
                    <span className="entry-field-lbl">{t(c.firstName)}</span>
                    <input data-autofocus type="text" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="entry-input" required />
                  </label>
                  <label className="entry-field">
                    <span className="entry-field-lbl">{t(c.lastName)}</span>
                    <input type="text" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="entry-input" required />
                  </label>
                </div>

                <label className="entry-field">
                  <span className="entry-field-lbl">{t(c.email)}</span>
                  <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="entry-input" required />
                </label>

                <label className="entry-field">
                  <span className="entry-field-lbl">{t(c.password)}</span>
                  <span className="entry-password-wrap">
                    <input type={passwordVisible ? "text" : "password"} autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="entry-input" required />
                    <button
                      type="button"
                      className="entry-password-toggle"
                      onClick={() => setPasswordVisible((visible) => !visible)}
                      aria-label={t(passwordVisible ? c.hidePassword : c.showPassword)}
                      title={t(passwordVisible ? c.hidePassword : c.showPassword)}
                    >
                      {passwordVisible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                    </button>
                  </span>
                  <span className="entry-field-hint">{t(c.passwordHint)}</span>
                </label>

                {error ? <p className="entry-err" role="alert">{error}</p> : null}
                <button type="submit" className="entry-cta entry-cta-primary" disabled={loading}>
                  {loading ? t(c.loading) : t(c.submit)}
                </button>
                {GOOGLE_AUTH_ENABLED ? (
                  <>
                    <div className="entry-sep" aria-hidden="true"><span>{loc === "en" ? "or" : "ou"}</span></div>
                    <button type="button" className="entry-cta entry-cta-ghost" onClick={handleGoogle} disabled={googleLoading || loading}>
                      <span className="entry-google-dot" aria-hidden="true" />
                      {t(c.google)}
                    </button>
                  </>
                ) : null}
              </form>

              <p className="entry-legal">
                {t(c.legalBefore)}
                <Link href={`/${locale}/terms`} className="entry-legal-link">{t(c.legalTerms)}</Link>
                {t(c.legalMiddle)}
                <Link href={`/${locale}/privacy`} className="entry-legal-link">{t(c.legalPrivacy)}</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
