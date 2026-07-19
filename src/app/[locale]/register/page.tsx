"use client";

// /register · Sprint 8 « La porte ». Élève UNIQUEMENT.
// Les rôles TEACHER et CENTER ne s'inscrivent plus ici : la maison
// les rencontre d'abord (voir /enseignants et /landing B2B).
//
// Flux :
//   1. Le compte (nom, email, mot de passe, cap)
//   2. Le cap devient le but du compte (pilote dashboard + pricing)
// Une ligne sous le formulaire renvoie vers les portes B2B.

import Link from "next/link";
import { useRouter } from "@/navigation";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { frTypo } from "@/components/landing/typo";
import { BrandLockup } from "@/components/brand/BrandLockup";

type Cap = "franchir" | "grandir" | "transmettre" | "moi";

interface Copy {
  brand: string;
  kicker: string;
  title: string;
  titleEm: string;
  lede: string;
  fldName: string;
  fldEmail: string;
  fldPassword: string;
  capLbl: string;
  caps: readonly { id: Cap; label: string }[];
  consent: string;
  ageConsent: string;
  submit: string;
  submitLoading: string;
  otherLbl: string;
  otherEm: string;
  otherTeacher: string;
  otherCenter: string;
  alreadyLbl: string;
  alreadyLink: string;
  successTitle: string;
  successBody: string;
  errPassword: string;
  errConsent: string;
  errAge: string;
  errInvalid: string;
}

const COPY_FR: Copy = {
  brand: "YEMA",
  kicker: "Créer votre compte",
  title: "Choisissez votre cap.",
  titleEm: "La maison s'ouvre.",
  lede: "Un compte apprenant·e. La première leçon est gratuite. La maison rencontre les enseignants et les centres d'une autre manière.",
  fldName: "Prénom",
  fldEmail: "Email",
  fldPassword: "Mot de passe",
  capLbl: "Votre cap",
  caps: [
    { id: "franchir",    label: "Réussir mon examen, partir" },
    { id: "grandir",     label: "Progresser là où je vis" },
    { id: "transmettre", label: "Transmettre à mes enfants" },
    { id: "moi",         label: "Apprendre pour moi" },
  ],
  consent: "J'accepte les conditions générales et la politique de confidentialité.",
  ageConsent: "Je confirme avoir au moins 16 ans.",
  submit: "Créer mon compte",
  submitLoading: "Création…",
  otherLbl: "Enseignant·e ? Centre ?",
  otherEm: "La maison vous rencontre d'abord.",
  otherTeacher: "Enseignant·e — l'accréditation",
  otherCenter: "Centre — réserver une démo",
  alreadyLbl: "Déjà un compte ?",
  alreadyLink: "Se connecter",
  successTitle: "Vérifiez votre email.",
  successBody: "Nous vous avons envoyé un lien pour confirmer votre inscription.",
  errPassword: "Choisissez un mot de passe d'au moins 6 caractères.",
  errConsent: "Merci d'accepter les conditions.",
  errAge: "Vous devez confirmer votre âge.",
  errInvalid: "Cette adresse ne fonctionne pas — essayez-en une autre.",
};

const COPY_EN: Copy = {
  brand: "YEMA",
  kicker: "Create your account",
  title: "Pick your cap.",
  titleEm: "The house opens.",
  lede: "A learner account. The first lesson is free. The house meets teachers and centers another way.",
  fldName: "First name",
  fldEmail: "Email",
  fldPassword: "Password",
  capLbl: "Your cap",
  caps: [
    { id: "franchir",    label: "Pass my exam, leave" },
    { id: "grandir",     label: "Grow where I live" },
    { id: "transmettre", label: "Pass on to my children" },
    { id: "moi",         label: "Learn for me" },
  ],
  consent: "I accept the terms and the privacy policy.",
  ageConsent: "I confirm I am at least 16.",
  submit: "Create my account",
  submitLoading: "Creating…",
  otherLbl: "Teacher? Center?",
  otherEm: "The house meets you first.",
  otherTeacher: "Teacher — accreditation",
  otherCenter: "Center — book a demo",
  alreadyLbl: "Already have an account?",
  alreadyLink: "Log in",
  successTitle: "Check your email.",
  successBody: "We sent you a link to confirm your registration.",
  errPassword: "Choose a password of at least 6 characters.",
  errConsent: "Please accept the terms.",
  errAge: "You must confirm your age.",
  errInvalid: "This address didn't work — try another one.",
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cap, setCap] = useState<Cap>("franchir");
  const [consent, setConsent] = useState(false);
  const [ageConsent, setAgeConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) { setError(c.errPassword); setLoading(false); return; }
    if (!consent) { setError(c.errConsent); setLoading(false); return; }
    if (!ageConsent) { setError(c.errAge); setLoading(false); return; }

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: "STUDENT", cap },
        emailRedirectTo: next
          ? `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`
          : `${location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message || c.errInvalid);
      setLoading(false);
      return;
    }

    if (data.session) {
      await fetch("/api/fix-role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "STUDENT", cap }),
      }).catch(() => {});
      document.cookie = `user_role=STUDENT;path=/;max-age=2592000`;
      document.cookie = `active_space=STUDENT;path=/;max-age=2592000`;
      router.push("/onboarding/student");
      router.refresh();
      return;
    }
    setSuccess(true);
    setLoading(false);
  }

  return (
    <div className="porte-page">
      <header className="porte-header">
        <Link href={`/${locale}`} className="porte-brand">
          <BrandLockup orientation="horizontal" variant="world" state="static" size={28} />
        </Link>
        <p className="porte-alt">
          {c.alreadyLbl}{" "}
          <Link href={`/${locale}/login`}>{t(c.alreadyLink)}</Link>
        </p>
      </header>

      <main className="porte-main">
        <div className="porte-card">
          {success ? (
            <div className="porte-success">
              <h1 className="porte-h">{t(c.successTitle)}</h1>
              <p className="porte-lede">{t(c.successBody)}</p>
            </div>
          ) : (
            <>
              <p className="maison-kicker" style={{ textAlign: "center" }}>{t(c.kicker)}</p>
              <h1 className="porte-h">
                {t(c.title)} <em>{t(c.titleEm)}</em>
              </h1>
              <p className="porte-lede">{t(c.lede)}</p>

              <form onSubmit={handleRegister} className="porte-form" noValidate>
                <label className="ens-form-field">
                  <span>{t(c.fldName)}</span>
                  <input type="text" required autoComplete="given-name"
                         value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </label>
                <label className="ens-form-field">
                  <span>{t(c.fldEmail)}</span>
                  <input type="email" required autoComplete="email"
                         value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <label className="ens-form-field ens-form-field-wide">
                  <span>{t(c.fldPassword)}</span>
                  <input type="password" required autoComplete="new-password" minLength={6}
                         value={password} onChange={(e) => setPassword(e.target.value)} />
                </label>

                <fieldset className="porte-caps">
                  <legend>{t(c.capLbl)}</legend>
                  <div className="porte-caps-grid">
                    {c.caps.map((k) => (
                      <label key={k.id} className={`porte-cap ${cap === k.id ? "on" : ""}`}>
                        <input
                          type="radio"
                          name="cap"
                          value={k.id}
                          checked={cap === k.id}
                          onChange={() => setCap(k.id)}
                        />
                        <span>{t(k.label)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="porte-check">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
                  <span>{t(c.consent)}</span>
                </label>
                <label className="porte-check">
                  <input type="checkbox" checked={ageConsent} onChange={(e) => setAgeConsent(e.target.checked)} required />
                  <span>{t(c.ageConsent)}</span>
                </label>

                {error ? <p className="ens-form-error" role="alert">{error}</p> : null}

                <button type="submit" className="maison-porte-cta" disabled={loading}>
                  {loading ? c.submitLoading : t(c.submit)}
                </button>
              </form>

              <div className="porte-other">
                <p className="porte-other-lbl">
                  {t(c.otherLbl)} <em>{t(c.otherEm)}</em>
                </p>
                <div className="porte-other-links">
                  <Link href={`/${locale}/enseignants`} className="maison-link-strong">
                    {t(c.otherTeacher)}
                  </Link>
                  <Link href={`/${locale}/landing`} className="maison-link-strong">
                    {t(c.otherCenter)}
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
