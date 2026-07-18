"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CefrStrip } from "@/components/landing/CefrStrip";
import { LandingBrand } from "@/components/landing/LandingBrand";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError(t("errorInvalid"));
      setLoading(false);
      return;
    }

    try {
      const profileRes = await fetch("/api/auth/profile");
      const profile = await profileRes.json();

      const role: string = profile.role || "STUDENT";
      const onboardingDone: boolean = profile.onboardingDone || false;

      document.cookie = `user_role=${role};path=/;max-age=2592000`;
      document.cookie = `onboarding_done=${onboardingDone};path=/;max-age=2592000`;

      if (!onboardingDone) {
        if (role === "CENTER") {
          router.push("/onboarding/center");
          return;
        }
        if (role === "TEACHER") {
          router.push("/onboarding/teacher");
          return;
        }
        if (role === "ADMIN") {
          router.push("/admin");
          return;
        }
        router.push("/onboarding/student");
      } else {
        if (next) {
          router.push(next);
          return;
        }
        if (role === "CENTER") {
          router.push("/center");
          return;
        }
        if (role === "TEACHER") {
          router.push("/teacher");
          return;
        }
        if (role === "ADMIN") {
          router.push("/admin");
          return;
        }
        router.push("/dashboard");
      }
    } catch {
      router.push("/dashboard");
    }
  }

  return (
    <div className="lauth landing">
      <header className="lauth-header">
        <Link href="/" className="lnav-brand">
          <LandingBrand />
        </Link>
        <Link href="/register" className="lauth-alt-link">
          {t("subscribe")}
        </Link>
      </header>

      <main className="lauth-body">
        <div className="lauth-card">
          <div className="lauth-eye">{t("loginTitle")}</div>
          <h1 className="lauth-h">
            {locale === "en" ? "Welcome " : "Bon "}
            <em>{locale === "en" ? "back." : "retour."}</em>
          </h1>
          <p className="lauth-sub">{t("loginSubtitle")}</p>

          {error && <div className="lauth-error">{error}</div>}

          <form onSubmit={handleLogin} noValidate>
            <div className="lauth-field">
              <label htmlFor="login-email" className="lauth-lbl">
                {t("email")}
              </label>
              <input
                id="login-email"
                className="lauth-input"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
              />
            </div>

            <div className="lauth-field">
              <label htmlFor="login-password" className="lauth-lbl">
                {t("password")}
              </label>
              <input
                id="login-password"
                className="lauth-input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="lauth-submit" disabled={loading}>
              {loading ? tc("loading") : `${t("loginBtn")} →`}
            </button>
          </form>

          <p className="lauth-alt">
            {t("noAccount")}{" "}
            <Link href="/register" className="lauth-alt-link">
              {t("subscribe")}
            </Link>
          </p>
        </div>
      </main>

      <footer className="lauth-foot">
        <CefrStrip current="A1" ariaLabel="Parcours Yema — CECRL" />
      </footer>
    </div>
  );
}
