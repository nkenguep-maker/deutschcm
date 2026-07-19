"use client";

// /login · Sprint 8 « La porte réduite ».
// Fond --seuil-bg, le Y, une phrase, un formulaire sobre.
// Réutilise les tokens du Seuil existant, sans respiration ambiante
// (--dur-breath est réservé au seuil de la landing).

import Link from "next/link";
import { useRouter } from "@/navigation";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { frTypo } from "@/components/landing/typo";

interface Copy {
  kicker: string;
  title: string;
  titleEm: string;
  lede: string;
  fldEmail: string;
  fldPassword: string;
  submit: string;
  submitLoading: string;
  errInvalid: string;
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
  errInvalid: "Ces identifiants n'ont pas ouvert la porte. Réessayez.",
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
  errInvalid: "These credentials didn't open the door. Try again.",
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
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data.user) {
      setError(c.errInvalid);
      setLoading(false);
      return;
    }
    router.push(next ?? `/${locale}/dashboard`);
    router.refresh();
  }

  return (
    <div className="porte-seuil">
      <header className="porte-header">
        <Link href={`/${locale}`} className="porte-brand">
          <span aria-hidden="true" className="porte-brand-y">Y</span>
          <span className="porte-brand-word">YEMA</span>
        </Link>
      </header>

      <main className="porte-seuil-main">
        <div className="porte-seuil-inner">
          <p className="maison-kicker">{t(c.kicker)}</p>
          <h1 className="porte-seuil-h">
            {t(c.title)} <em>{t(c.titleEm)}</em>
          </h1>
          <p className="porte-seuil-lede">{t(c.lede)}</p>

          <form onSubmit={handleLogin} className="porte-seuil-form" noValidate>
            <label className="ens-form-field ens-form-field-wide">
              <span>{t(c.fldEmail)}</span>
              <input type="email" required autoComplete="email"
                     value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="ens-form-field ens-form-field-wide">
              <span>{t(c.fldPassword)}</span>
              <input type="password" required autoComplete="current-password"
                     value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error ? <p className="ens-form-error" role="alert">{error}</p> : null}
            <button type="submit" className="maison-porte-cta" disabled={loading}>
              {loading ? c.submitLoading : t(c.submit)}
            </button>
          </form>

          <div className="porte-seuil-footer">
            <p>
              {t(c.noAccount)}{" "}
              <Link href={`/${locale}/register`}>{t(c.register)}</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
