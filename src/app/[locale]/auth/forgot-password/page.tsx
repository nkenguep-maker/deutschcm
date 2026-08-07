"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { frTypo } from "@/components/landing/typo";
import { sanitizeInternalNext } from "@/lib/authRedirect";
import { classifyAuthError, withTimeout } from "@/lib/authErrors";
import { createClient } from "@/lib/supabase/client";

const COPY = {
  fr: {
    kicker: "Mot de passe",
    title: "Retrouvons votre porte.",
    lede: "Entrez l’adresse e-mail de votre compte. Nous vous envoyons un lien de réinitialisation.",
    email: "Email",
    submit: "Envoyer le lien",
    sending: "Envoi…",
    success: "Le lien est parti. Vérifiez votre boîte mail et vos indésirables.",
    back: "Retour à la connexion",
    generic: "Impossible d’envoyer le lien pour le moment. Réessayez dans un instant.",
  },
  en: {
    kicker: "Password",
    title: "Let’s find your door again.",
    lede: "Enter the email address for your account. We’ll send you a reset link.",
    email: "Email",
    submit: "Send reset link",
    sending: "Sending…",
    success: "The link is on its way. Check your inbox and spam folder.",
    back: "Back to login",
    generic: "We couldn’t send the link right now. Try again in a moment.",
  },
} as const;

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const loc = locale === "en" ? "en" : "fr";
  const c = COPY[loc];
  const searchParams = useSearchParams();
  const safeNext = sanitizeInternalNext(searchParams.get("next"), `/${locale}/dashboard`);
  const typo = (value: string) => (loc === "fr" ? frTypo(value) : value);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const resetPath = `/${locale}/auth/reset-password?next=${encodeURIComponent(safeNext)}`;
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(resetPath)}`;
      const { error: resetError } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo }),
        10_000,
      );
      if (resetError) {
        const key = classifyAuthError(resetError);
        setError(key === "network" || key === "timeout" ? c.generic : c.generic);
        return;
      }
      setSent(true);
    } catch {
      setError(c.generic);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="porte-seuil">
      <header className="porte-header">
        <Link href={`/${locale}`} className="porte-brand">
          <BrandLockup orientation="horizontal" variant="world" state="static" size={28} />
        </Link>
      </header>

      <main className="porte-seuil-main">
        <div className="porte-seuil-inner">
          <p className="maison-kicker">{typo(c.kicker)}</p>
          <h1 className="porte-seuil-h">{typo(c.title)}</h1>
          <p className="porte-seuil-lede">{typo(c.lede)}</p>

          {sent ? (
            <div className="ens-form-error" role="status" aria-live="polite">
              <p>{typo(c.success)}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="porte-seuil-form" noValidate>
              <label className="ens-form-field ens-form-field-wide">
                <span>{typo(c.email)}</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              {error ? (
                <div className="ens-form-error" role="alert" aria-live="polite">
                  <p>{typo(error)}</p>
                </div>
              ) : null}

              <button type="submit" className="maison-porte-cta" disabled={loading || !email.trim()}>
                {loading ? c.sending : typo(c.submit)}
              </button>
            </form>
          )}

          <div className="porte-seuil-footer">
            <Link href={`/${locale}/login?next=${encodeURIComponent(safeNext)}`}>{typo(c.back)}</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
