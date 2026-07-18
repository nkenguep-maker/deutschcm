"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CefrStrip } from "@/components/landing/CefrStrip";
import {
  IconClasse,
  IconInstitution,
  IconTeacher,
} from "@/components/landing/icons";
import { LandingBrand } from "@/components/landing/LandingBrand";

type Role = "STUDENT" | "TEACHER" | "CENTER";

const ONBOARDING_DEST: Record<Role, string> = {
  STUDENT: "/onboarding/student",
  TEACHER: "/onboarding/teacher",
  CENTER: "/onboarding/center",
};

const ROLE_ICONS: Record<Role, React.ComponentType<{ size?: number }>> = {
  STUDENT: IconClasse,
  TEACHER: IconTeacher,
  CENTER: IconInstitution,
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [consent, setConsent] = useState(false);
  const [ageConsent, setAgeConsent] = useState(false);

  const getRoleLabel = (key: Role) =>
    t(
      key === "STUDENT"
        ? "roleStudent"
        : key === "TEACHER"
          ? "roleTeacher"
          : "roleCenter",
    );

  const getRoleDesc = (key: Role) =>
    t(
      key === "STUDENT"
        ? "roleStudentDesc"
        : key === "TEACHER"
          ? "roleTeacherDesc"
          : "roleCenterDesc",
    );

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) return;
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError(t("passwordError"));
      setLoading(false);
      return;
    }
    if (!consent) {
      setError(t("consentRequired"));
      setLoading(false);
      return;
    }
    if (!ageConsent) {
      setError(t("ageConsentRequired"));
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: selectedRole },
        emailRedirectTo: next
          ? `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`
          : `${location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Créer User + UserRole côté DB (rôle de base, onboarded=false)
      // et synchroniser user_metadata.roles pour le middleware.
      await fetch("/api/fix-role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      }).catch(() => {});
      document.cookie = `user_role=${selectedRole};path=/;max-age=2592000`;
      document.cookie = `active_space=${selectedRole};path=/;max-age=2592000`;
      router.push(ONBOARDING_DEST[selectedRole]);
      router.refresh();
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  const roles: readonly Role[] = ["STUDENT", "TEACHER", "CENTER"];

  return (
    <div className="lauth landing">
      <header className="lauth-header">
        <Link href="/" className="lnav-brand">
          <LandingBrand />
        </Link>
        <Link href="/login" className="lauth-alt-link">
          {t("signIn")}
        </Link>
      </header>

      <main className="lauth-body">
        <div className="lauth-card">
          {success ? (
            <div className="lauth-success">
              <div className="lauth-success-icon" aria-hidden="true">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 7l9 6 9-6" />
                  <rect x="3" y="6" width="18" height="13" rx="2" />
                </svg>
              </div>
              <h2 className="h">{t("confirmTitle")}</h2>
              <p>
                {t("confirmSent")} <b>{email}</b>.
              </p>
              <p>
                {t("confirmClick")}{" "}
                <b>
                  {selectedRole ? getRoleLabel(selectedRole) : ""}
                </b>
                .
              </p>
              <Link
                href="/login"
                className="lauth-submit"
                style={{ display: "inline-block", marginTop: 22, textDecoration: "none" }}
              >
                {t("backToLogin")}
              </Link>
            </div>
          ) : selectedRole === null ? (
            <>
              <div className="lauth-eye">{t("createAccount")}</div>
              <h1 className="lauth-h">
                {locale === "en" ? "Choose your " : "Choisis ton "}
                <em>{locale === "en" ? "role." : "rôle."}</em>
              </h1>
              <p className="lauth-sub">{t("chooseRoleHint")}</p>

              <div className="lauth-roles">
                {roles.map((role) => {
                  const Icon = ROLE_ICONS[role];
                  return (
                    <button
                      key={role}
                      type="button"
                      className="lauth-role"
                      onClick={() => setSelectedRole(role)}
                    >
                      <span className="lauth-role-icon" aria-hidden="true">
                        <Icon size={22} />
                      </span>
                      <span className="lauth-role-body">
                        <span className="lauth-role-title">{getRoleLabel(role)}</span>
                        <span className="lauth-role-desc">{getRoleDesc(role)}</span>
                      </span>
                      <span className="lauth-role-arrow" aria-hidden="true">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        >
                          <path d="M4 3l4 4-4 4" />
                        </svg>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="lauth-role-head">
                <span className="lauth-role-tag">
                  {getRoleLabel(selectedRole)}
                </span>
                <button
                  type="button"
                  className="lauth-role-change"
                  onClick={() => setSelectedRole(null)}
                >
                  {t("changeRole")}
                </button>
              </div>

              <h1 className="lauth-h">
                {locale === "en" ? "One " : "Un "}
                <em>{locale === "en" ? "account." : "compte."}</em>
              </h1>
              <p className="lauth-sub">{t("chooseRoleHint")}</p>

              {error && <div className="lauth-error">{error}</div>}

              <form onSubmit={handleRegister} noValidate>
                <div className="lauth-field">
                  <label htmlFor="reg-name" className="lauth-lbl">
                    {t("fullName")}
                  </label>
                  <input
                    id="reg-name"
                    className="lauth-input"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("fullNamePlaceholder")}
                  />
                </div>

                <div className="lauth-field">
                  <label htmlFor="reg-email" className="lauth-lbl">
                    {t("email")}
                  </label>
                  <input
                    id="reg-email"
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
                  <label htmlFor="reg-password" className="lauth-lbl">
                    {t("password")}
                  </label>
                  <input
                    id="reg-password"
                    className="lauth-input"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("passwordMin")}
                  />
                </div>

                <label className="lauth-consent">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>
                    {t("consentBefore")}
                    <a href="/terms" target="_blank" rel="noopener noreferrer">
                      {t("consentTerms")}
                    </a>
                    {t("consentMiddle")}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer">
                      {t("consentPrivacy")}
                    </a>
                    {t("consentAfter")}
                  </span>
                </label>

                <label className="lauth-consent">
                  <input
                    type="checkbox"
                    checked={ageConsent}
                    onChange={(e) => setAgeConsent(e.target.checked)}
                  />
                  <span>{t("ageConsentLabel")}</span>
                </label>

                <button
                  type="submit"
                  className="lauth-submit"
                  disabled={loading || !consent || !ageConsent}
                >
                  {loading ? tc("loading") : `${t("registerBtn")} →`}
                </button>
              </form>
            </>
          )}

          {!success && (
            <p className="lauth-alt">
              {t("hasAccount")}{" "}
              <Link href="/login" className="lauth-alt-link">
                {t("signIn")}
              </Link>
            </p>
          )}
        </div>
      </main>

      <footer className="lauth-foot">
        <CefrStrip current="A1" ariaLabel="Parcours Yema — CECRL" />
      </footer>
    </div>
  );
}
