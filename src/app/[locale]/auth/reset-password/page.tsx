"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { frTypo } from "@/components/landing/typo";
import { sanitizeInternalNext } from "@/lib/authRedirect";
import { classifyAuthError, withTimeout } from "@/lib/authErrors";
import { createClient } from "@/lib/supabase/client";

const COPY = {
  fr: {
    kicker: "Nouveau mot de passe",
    title: "Choisissez une nouvelle clé.",
    lede: "Votre nouveau mot de passe doit contenir au moins huit caractères.",
    password: "Nouveau mot de passe",
    confirm: "Confirmer le mot de passe",
    submit: "Enregistrer",
    saving: "Enregistrement…",
    mismatch: "Les deux mots de passe ne correspondent pas.",
    short: "Le mot de passe doit contenir au moins huit caractères.",
    invalid: "Ce lien n’est plus valide. Demandez un nouveau lien de réinitialisation.",
    generic: "Impossible d’enregistrer le nouveau mot de passe. Réessayez.",
    success: "Mot de passe mis à jour. Votre espace s’ouvre…",
    requestNew: "Demander un nouveau lien",
  },
  en: {
    kicker: "New password",
    title: "Choose a new key.",
    lede: "Your new password must contain at least eight characters.",
    password: "New password",
    confirm: "Confirm password",
    submit: "Save password",
    saving: "Saving…",
    mismatch: "The two passwords do not match.",
    short: "Your password must contain at least eight characters.",
    invalid: "This link is no longer valid. Request a new password reset link.",
    generic: "We couldn’t save the new password. Try again.",
    success: "Password updated. Opening your space…",
    requestNew: "Request a new link",
  },
} as const;

export default function ResetPasswordPage() {
  const locale = useLocale();
  const loc = locale === "en" ? "en" : "fr";
  const c = COPY[loc];
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeNext = sanitizeInternalNext(searchParams.get("next"), `/${locale}/dashboard`);
  const typo = (value: string) => (loc === "fr" ? frTypo(value) : value);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    withTimeout(supabase.auth.getUser(), 10_000)
      .then(({ data }) => {
        if (!active) return;
        setValidSession(Boolean(data.user));
      })
      .catch(() => {
        if (!active) return;
        setValidSession(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(c.short);
      return;
    }
    if (password !== confirmPassword) {
      setError(c.mismatch);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await withTimeout(
        supabase.auth.updateUser({ password }),
        10_000,
      );
      if (updateError) {
        const key = classifyAuthError(updateError);
        setError(key === "network" || key === "timeout" ? c.generic : c.generic);
        return;
      }
      setSuccess(true);
      window.setTimeout(() => {
        router.replace(safeNext);
        router.refresh();
      }, 600);
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

          {checking ? (
            <p className="porte-seuil-lede">…</p>
          ) : !validSession ? (
            <div className="ens-form-error" role="alert">
              <p>{typo(c.invalid)}</p>
              <Link className="ens-form-error-link" href={`/${locale}/auth/forgot-password?next=${encodeURIComponent(safeNext)}`}>
                {typo(c.requestNew)}
              </Link>
            </div>
          ) : success ? (
            <div className="ens-form-error" role="status" aria-live="polite">
              <p>{typo(c.success)}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="porte-seuil-form" noValidate>
              <label className="ens-form-field ens-form-field-wide">
                <span>{typo(c.password)}</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <label className="ens-form-field ens-form-field-wide">
                <span>{typo(c.confirm)}</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </label>

              {error ? (
                <div className="ens-form-error" role="alert" aria-live="polite">
                  <p>{typo(error)}</p>
                </div>
              ) : null}

              <button type="submit" className="maison-porte-cta" disabled={loading}>
                {loading ? c.saving : typo(c.submit)}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
