"use client";

// /register · porte d'entrée publique YEMA.
// L'inscription ne dépend d'aucun plan commercial : l'utilisateur crée son
// compte puis passe par l'onboarding Monde/Racines avant d'ouvrir son espace.

import Link from "next/link";
import { useRouter } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { frTypo } from "@/components/landing/typo";
import { BrandY } from "@/components/brand/BrandY";
import { classifyAuthError, withTimeout, type AuthErrorKey } from "@/lib/authErrors";
import { sanitizeInternalNext } from "@/lib/authRedirect";

type Universe = "monde" | "racines";

const COPY_FR = {
  brand: "YEMA",
  kicker: "L'entrée",
  title: "Créer votre compte.",
  lede: "Commencez votre parcours YEMA et reprenez-le sur n’importe quel appareil.",
  contextMonde: "Vous entrez par l’univers Monde.",
  contextRacines: "Vous entrez par l’univers Racines.",
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
  errContactInvalid: "Ce n'est ni un e-mail ni un numéro valide.",
  loginPrompt: "Déjà un compte ?",
  loginCta: "Se connecter",
  legal: "En créant votre compte, vous acceptez nos conditions et notre politique de confidentialité.",
  successTitle: "Vérifiez votre boîte.",
  successBody: "Nous vous avons envoyé un lien pour confirmer votre inscription. Votre parcours commencera juste après.",
} as const;

const COPY_EN = {
  brand: "YEMA",
  kicker: "The entrance",
  title: "Create your account.",
  lede: "Start your YEMA journey and pick it up again on any device.",
  contextMonde: "You’re entering through the World universe.",
  contextRacines: "You’re entering through the Roots universe.",
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
  errContactEmpty: "An email or a phone, so we can find you again.",
  errContactInvalid: "That doesn't look like a valid email or phone number.",
  loginPrompt: "Already have an account?",
  loginCta: "Sign in",
  legal: "By creating your account, you accept our terms and privacy policy.",
  successTitle: "Check your inbox.",
  successBody: "We sent you a link to confirm your registration. Your journey starts right after that.",
} as const;

function isPhoneLike(value: string): boolean {
  const normalized = value.trim().replace(/[\s-]/g, "");
  return /^\+?\d{7,}$/.test(normalized);
}

function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const t = (value: string) => (loc === "fr" ? frTypo(value) : value);

  const universeParam = searchParams.get("universe");
  const universe: Universe | null =
    universeParam === "monde" || universeParam === "racines" ? universeParam : null;
  const rawNext = searchParams.get("next");
  const safeNext = sanitizeInternalNext(rawNext, `/${locale}/dashboard`);
  const loginHref = rawNext
    ? `/${locale}/login?next=${encodeURIComponent(safeNext)}`
    : `/${locale}/login`;

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const tErr = useTranslations("auth.errors");
  const errorFromKey = (key: AuthErrorKey): string => t(tErr(key));

  useEffect(() => {
    document.querySelector<HTMLInputElement>("input[data-autofocus]")?.focus();
  }, []);

  const onboardingRoute = universe === "racines"
    ? "/onboarding/racines"
    : universe === "monde"
      ? "/onboarding/monde"
      : "/onboarding";
  const localizedOnboardingRoute = `/${locale}${onboardingRoute}`;

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmed = contact.trim();
    if (!trimmed) {
      setError(t(c.errContactEmpty));
      return;
    }
    if (password.length < 8) {
      setError(t(c.errPassword));
      return;
    }

    const usePhone = isPhoneLike(trimmed);
    const useEmail = isEmailLike(trimmed);
    if (!usePhone && !useEmail) {
      setError(t(c.errContactInvalid));
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const options = {
        data: {
          full_name: fullName || null,
          universe: universe ?? null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(localizedOnboardingRoute)}`,
      };

      const credentials = usePhone
        ? { phone: trimmed.replace(/[\s-]/g, ""), password, options }
        : { email: trimmed, password, options };

      const { data, error: signUpError } = await withTimeout(
        supabase.auth.signUp(credentials),
      );

      if (signUpError) {
        setError(errorFromKey(classifyAuthError(signUpError)));
        return;
      }

      try {
        document.cookie = "user_role=STUDENT;path=/;max-age=2592000";
        document.cookie = "active_space=STUDENT;path=/;max-age=2592000";
      } catch {
        // Legacy display cookies only; authorization does not trust them.
      }

      if (data.session) {
        const syncResponse = await fetch("/api/auth/sync", { method: "POST" });
        if (!syncResponse.ok) {
          await supabase.auth.signOut();
          setError(errorFromKey("generic"));
          return;
        }
        await supabase.auth.refreshSession();
        router.push(onboardingRoute);
        router.refresh();
        return;
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
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(localizedOnboardingRoute)}`;
      const { error: oauthError } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: { access_type: "offline", prompt: "consent" },
          },
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

  const universeClass = universe === "racines"
    ? "entry-universe-racines"
    : universe === "monde"
      ? "entry-universe-monde"
      : "";

  return (
    <div className={`entry-page ${universeClass}`} data-universe={universe ?? "none"}>
      <header className="entry-header">
        <Link href={`/${locale}`} className="entry-brand" aria-label={c.brand}>
          <BrandY variant={universe === "racines" ? "sources" : "world"} state="static" size={36} />
        </Link>
        <p className="entry-header-alt">
          {t(c.loginPrompt)}{" "}
          <Link href={loginHref} className="entry-header-link">{t(c.loginCta)}</Link>
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

              {universe ? (
                <div className="entry-context" role="note">
                  <span className="entry-context-dot" aria-hidden="true" />
                  <span className="entry-context-text">
                    {t(universe === "racines" ? c.contextRacines : c.contextMonde)}
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
                    onChange={(event) => setFullName(event.target.value)}
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
                    onChange={(event) => setContact(event.target.value)}
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
                    onChange={(event) => setPassword(event.target.value)}
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
