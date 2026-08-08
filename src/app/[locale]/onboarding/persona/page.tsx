"use client";

import { useLocale } from "next-intl";
import { useRouter } from "@/navigation";
import { useState } from "react";
import { BrandY } from "@/components/brand/BrandY";
import type { AdultPersonaId } from "@/lib/personas/runtime";

const OPTIONS: Array<{
  id: Exclude<AdultPersonaId, "super_admin">;
  titleFr: string;
  titleEn: string;
  bodyFr: string;
  bodyEn: string;
  eyebrowFr: string;
  eyebrowEn: string;
}> = [
  {
    id: "student_monde",
    titleFr: "Élève Monde",
    titleEn: "World learner",
    bodyFr: "J’apprends une langue étrangère. Je pourrai aussi ajouter Racines Solo au même compte.",
    bodyEn: "I’m learning a foreign language. I can also add Roots Solo to the same account.",
    eyebrowFr: "Langues du monde",
    eyebrowEn: "World languages",
  },
  {
    id: "student_racines",
    titleFr: "Élève Racines",
    titleEn: "Roots learner",
    bodyFr: "Je veux apprendre ou reprendre ma langue maternelle avec le parcours É1–É5.",
    bodyEn: "I want to learn or reconnect with my heritage language through the E1–E5 path.",
    eyebrowFr: "Langues maternelles",
    eyebrowEn: "Heritage languages",
  },
  {
    id: "family",
    titleFr: "Famille / Parent",
    titleEn: "Family / Parent",
    bodyFr: "Je gère un ou plusieurs enfants. Les enfants n’ont pas d’e-mail : ils sont rattachés à mon compte.",
    bodyEn: "I manage one or more children. Children do not need email accounts: they are attached to mine.",
    eyebrowFr: "Foyer",
    eyebrowEn: "Household",
  },
  {
    id: "teacher",
    titleFr: "Enseignant·e",
    titleEn: "Teacher",
    bodyFr: "Je veux enseigner, suivre des classes et corriger des devoirs. L’accès professionnel est validé avant activation.",
    bodyEn: "I want to teach, manage classes and review assignments. Professional access is verified before activation.",
    eyebrowFr: "Professionnel",
    eyebrowEn: "Professional",
  },
  {
    id: "coach",
    titleFr: "Coach Racines",
    titleEn: "Roots Coach",
    bodyFr: "J’accompagne des apprenants et familles Racines dans des cercles et productions.",
    bodyEn: "I guide Roots learners and families through circles and productions.",
    eyebrowFr: "Racines",
    eyebrowEn: "Roots",
  },
  {
    id: "center_admin",
    titleFr: "Centre",
    titleEn: "Center",
    bodyFr: "Je représente un centre et je veux gérer enseignants, élèves et opérations depuis un espace dédié.",
    bodyEn: "I represent a center and want to manage teachers, learners and operations from a dedicated workspace.",
    eyebrowFr: "Organisation",
    eyebrowEn: "Organization",
  },
];

export default function PersonaOnboardingPage() {
  const locale = useLocale();
  const loc = locale === "en" ? "en" : "fr";
  const router = useRouter();
  const [loading, setLoading] = useState<AdultPersonaId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(persona: Exclude<AdultPersonaId, "super_admin">) {
    setLoading(persona);
    setError(null);
    try {
      const response = await fetch("/api/onboarding/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.redirectTo !== "string") {
        throw new Error("persona_selection_failed");
      }
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError(
        loc === "en"
          ? "We could not save your choice. Please try again."
          : "Nous n’avons pas pu enregistrer votre choix. Réessayez.",
      );
      setLoading(null);
    }
  }

  return (
    <main className="onboarding-router">
      <header className="onboarding-router-head">
        <BrandY variant="world" state="static" size={72} />
        <p className="entry-kicker">{loc === "en" ? "Your YEMA space" : "Votre espace YEMA"}</p>
        <h1 className="onboarding-router-titre">
          {loc === "en" ? "What brings you to YEMA?" : "Qu’est-ce qui vous amène chez YEMA ?"}
        </h1>
        <p className="onboarding-router-sous">
          {loc === "en"
            ? "This choice determines your onboarding and the dashboard you will reopen every time you sign in."
            : "Ce choix détermine votre onboarding et le dashboard que vous retrouverez à chaque connexion."}
        </p>
      </header>

      {error ? <p className="entry-err" role="alert">{error}</p> : null}

      <section className="onboarding-router-portes" aria-label={loc === "en" ? "Persona choices" : "Choix du persona"}>
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`onboarding-router-porte ${option.id.includes("racines") || option.id === "coach" ? "onboarding-router-porte-sources" : "onboarding-router-porte-monde"}`}
            onClick={() => choose(option.id)}
            disabled={loading !== null}
            style={{ textAlign: "left" }}
          >
            <span className="onboarding-router-porte-eyebrow">
              {loc === "en" ? option.eyebrowEn : option.eyebrowFr}
            </span>
            <span className="onboarding-router-porte-titre">
              {loc === "en" ? option.titleEn : option.titleFr}
            </span>
            <span className="onboarding-router-porte-body">
              {loading === option.id
                ? (loc === "en" ? "Saving…" : "Enregistrement…")
                : (loc === "en" ? option.bodyEn : option.bodyFr)}
            </span>
          </button>
        ))}
      </section>
    </main>
  );
}
