"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import { Link } from "@/navigation";
import { useLocale } from "next-intl";
import { CefrStrip } from "@/components/landing/CefrStrip";
import { IconClasse } from "@/components/landing/icons";
import { LandingBrand } from "@/components/landing/LandingBrand";

export default function SetupRolePage() {
  const router = useRouter();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continueAsLearner() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/fix-role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "STUDENT" }),
      });
      if (!response.ok) throw new Error("Failed");
      router.push("/onboarding");
      router.refresh();
    } catch {
      setError(
        locale === "en"
          ? "Something went wrong. Please try again."
          : "Une erreur est survenue. Réessaie.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="lonboard landing">
      <header className="lonboard-header">
        <Link href="/" className="lnav-brand">
          <LandingBrand />
        </Link>
      </header>

      <main className="lonboard-body">
        <div className="lonboard-card">
          <div className="lonboard-eye">
            {locale === "en" ? "Access" : "Accès"}
          </div>
          <h1 className="lonboard-h">
            {locale === "en" ? "Open your " : "Ouvrez votre "}
            <em>{locale === "en" ? "learner space." : "espace apprenant."}</em>
          </h1>
          <p className="lonboard-sub">
            {locale === "en"
              ? "Teacher and center roles are granted after a verified application."
              : "Les rôles Enseignant et Centre sont accordés après vérification de la demande."}
          </p>

          {error ? <div className="lonboard-error" role="alert">{error}</div> : null}

          <div className="lonboard-choices">
            <button
              type="button"
              className="lonboard-choice"
              disabled={loading}
              onClick={continueAsLearner}
              aria-busy={loading}
            >
              <span className="lonboard-choice-icon" aria-hidden="true">
                <IconClasse size={22} />
              </span>
              <span className="lonboard-choice-body">
                <span className="lonboard-choice-title">
                  {locale === "en" ? "Learner" : "Apprenant·e"}
                </span>
                <span className="lonboard-choice-desc">
                  {locale === "en"
                    ? "Learn a language at your own pace"
                    : "Apprendre une langue à votre rythme"}
                </span>
              </span>
              <span className="lonboard-choice-arrow" aria-hidden="true">
                {loading ? "…" : "→"}
              </span>
            </button>
          </div>
        </div>
      </main>

      <footer className="lonboard-foot">
        <CefrStrip current="A1" ariaLabel="Parcours YEMA — CECRL" />
      </footer>
    </div>
  );
}
