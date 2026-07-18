"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import { Link } from "@/navigation";
import { useLocale } from "next-intl";
import { CefrStrip } from "@/components/landing/CefrStrip";
import {
  IconClasse,
  IconInstitution,
  IconTeacher,
} from "@/components/landing/icons";
import { LandingBrand } from "@/components/landing/LandingBrand";

type Role = "STUDENT" | "TEACHER" | "CENTER";

type RoleDef = {
  key: Role;
  Icon: (p: { size?: number }) => React.ReactElement;
  labelFR: string;
  labelEN: string;
  subFR: string;
  subEN: string;
  dest: string;
};

const ROLES: readonly RoleDef[] = [
  {
    key: "STUDENT",
    Icon: IconClasse,
    labelFR: "Apprenant·e",
    labelEN: "Learner",
    subFR: "J'apprends une langue à mon rythme",
    subEN: "I'm learning a language at my own pace",
    dest: "/dashboard",
  },
  {
    key: "TEACHER",
    Icon: IconTeacher,
    labelFR: "Enseignant·e",
    labelEN: "Teacher",
    subFR: "J'enseigne et j'accompagne des apprenant·e·s",
    subEN: "I teach and support learners",
    dest: "/teacher",
  },
  {
    key: "CENTER",
    Icon: IconInstitution,
    labelFR: "Centre de langues",
    labelEN: "Language center",
    subFR: "Je gère un centre de langues",
    subEN: "I manage a language center",
    dest: "/center",
  },
];

export default function SetupRolePage() {
  const router = useRouter();
  const locale = useLocale();
  const [loading, setLoading] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(role: Role, dest: string) {
    setLoading(role);
    setError(null);
    try {
      const r = await fetch("/api/fix-role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!r.ok) throw new Error("Failed");
      // eslint-disable-next-line react-hooks/immutability
      document.cookie = `user_role=${role};path=/;max-age=2592000`;
      router.push(dest);
    } catch {
      setError(
        locale === "en"
          ? "Something went wrong. Please try again."
          : "Une erreur est survenue. Réessaie.",
      );
      setLoading(null);
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
            {locale === "en" ? "First step" : "Première étape"}
          </div>
          <h1 className="lonboard-h">
            {locale === "en" ? "Choose your " : "Choisis ton "}
            <em>{locale === "en" ? "role." : "rôle."}</em>
          </h1>
          <p className="lonboard-sub">
            {locale === "en"
              ? "One decision, then everything opens. You can change later from your settings."
              : "Une décision, puis tout s'ouvre. Tu pourras changer depuis tes paramètres."}
          </p>

          {error ? <div className="lonboard-error">{error}</div> : null}

          <div className="lonboard-choices">
            {ROLES.map((r) => {
              const isLoading = loading === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  className="lonboard-choice"
                  disabled={loading !== null}
                  onClick={() => choose(r.key, r.dest)}
                  aria-busy={isLoading}
                >
                  <span className="lonboard-choice-icon" aria-hidden="true">
                    <r.Icon size={22} />
                  </span>
                  <span className="lonboard-choice-body">
                    <span className="lonboard-choice-title">
                      {locale === "en" ? r.labelEN : r.labelFR}
                    </span>
                    <span className="lonboard-choice-desc">
                      {locale === "en" ? r.subEN : r.subFR}
                    </span>
                  </span>
                  <span className="lonboard-choice-arrow" aria-hidden="true">
                    {isLoading ? (
                      "…"
                    ) : (
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
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="lonboard-foot">
        <CefrStrip current="A1" ariaLabel="Parcours YEMA — CECRL" />
      </footer>
    </div>
  );
}
