"use client";

// /login · Sprint 8 « La porte réduite ».
// Fond --seuil-bg, le Y, une phrase, un formulaire sobre.
// Réutilise les tokens du Seuil existant, sans respiration ambiante
// (--dur-breath est réservé au seuil de la landing).

import Link from "next/link";
import { useRouter } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { frTypo } from "@/components/landing/typo";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { classifyAuthError, withTimeout } from "@/lib/authErrors";

interface Copy {
  kicker: string;
  title: string;
  titleEm: string;
  lede: string;
  fldEmail: string;
  fldPassword: string;
  submit: string;
  submitLoading: string;
  noAccount: string;
  register: string;
}

const COPY_FR: Copy = {
  kicker: "Se connecter",
  title: "Rentrez.",
  titleEm: "On vous attendait.",
  lede: "Votre parcours vous attend là où vous l'avez laissé.",
  fldEmail: "Email",
  fldPassword: "Mot de passe",
  submit: "Ouvrir ma maison",
  submitLoading: "Ouverture…",
  noAccount: "Pas encore de compte ?",
  register: "Créer un compte",
};

const COPY_EN: Copy = {
  kicker: "Log in",
  title: "Come in.",
  titleEm: "We were waiting for you.",
  lede: "Your path is waiting where you left it.",
  fldEmail: "Email",
  fldPassword: "Password",
  submit: "Open my house",
  submitLoading: "Opening…",
  noAccount: "No account yet?",
  register: "Create an account",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const tErr = useTranslations("auth.errors");
  const applyTypo = (s: string) => (loc === "fr" ? frTypo(s) : s);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorKey(null);
    setResendState("idle");
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
      );
      if (signInError || !data.user) {
        setErrorKey(classifyAuthError(signInError));
        return;
      }
      router.push(next ?? `/${locale}/dashboard`);
      router.refresh();
    } catch (err) {
      setErrorKey(classifyAuthError(err));
    } finally {
      // GARANTIE : le bouton se déverrouille TOUJOURS, quelle que soit
      // l'issue. Sans ce finally, une exception synchrone ou async non
      // catchée laisserait le bouton figé sur « Ouverture… » (bug prod).
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    if (!email) return;
    setResendState("sending");
    try {
      const supabase = createClient();
      const { error: resendError } = await withTimeout(
        supabase.auth.resend({ type: "signup", email }),
        10_000,
      );
      setResendState(resendError ? "error" : "sent");
    } catch {
      setResendState("error");
    }
  }

  const errorMsg = errorKey ? applyTypo(tErr(errorKey)) : null;
  const showResend = errorKey === "email_not_confirmed" && email.length > 0;

  return (
    <div className="porte-seuil">
      <header className="porte-header">
        <Link href={`/${locale}`} className="porte-brand">
          <BrandLockup orientation="horizontal" variant="world" state="static" size={28} />
        </Link>
      </header>

      <main className="porte-seuil-main">
        <div className="porte-seuil-inner">
          <p className="maison-kicker">{applyTypo(c.kicker)}</p>
          <h1 className="porte-seuil-h">
            {applyTypo(c.title)} <em>{applyTypo(c.titleEm)}</em>
          </h1>
          <p className="porte-seuil-lede">{applyTypo(c.lede)}</p>

          <form onSubmit={handleLogin} className="porte-seuil-form" noValidate>
            <label className="ens-form-field ens-form-field-wide">
              <span>{applyTypo(c.fldEmail)}</span>
              <input type="email" required autoComplete="email"
                     value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="ens-form-field ens-form-field-wide">
              <span>{applyTypo(c.fldPassword)}</span>
              <input type="password" required autoComplete="current-password"
                     value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>

            {errorMsg && (
              <div className="ens-form-error" role="alert" aria-live="polite">
                <p>{errorMsg}</p>
                {showResend && (
                  <div className="ens-form-error-actions">
                    {resendState === "sent" ? (
                      <span className="ens-form-error-hint">
                        {applyTypo(tErr("email_not_confirmed_sent"))}
                      </span>
                    ) : resendState === "error" ? (
                      <>
                        <button
                          type="button"
                          className="ens-form-error-link"
                          onClick={handleResendConfirmation}
                        >
                          {applyTypo(tErr("email_not_confirmed_action"))}
                        </button>
                        <span className="ens-form-error-hint">
                          {applyTypo(tErr("email_not_confirmed_error"))}
                        </span>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="ens-form-error-link"
                        onClick={handleResendConfirmation}
                        disabled={resendState === "sending"}
                      >
                        {applyTypo(
                          resendState === "sending"
                            ? tErr("email_not_confirmed_action") + "…"
                            : tErr("email_not_confirmed_action"),
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="maison-porte-cta" disabled={loading}>
              {loading ? c.submitLoading : applyTypo(c.submit)}
            </button>
          </form>

          <div className="porte-seuil-footer">
            <p>
              {applyTypo(c.noAccount)}{" "}
              <Link href={`/${locale}/register`}>{applyTypo(c.register)}</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
