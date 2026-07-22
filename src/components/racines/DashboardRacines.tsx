"use client";

// P3 · Dashboard Racines · Solo ou Famille · honnête tant qu'aucune langue
// Racines n'est READY. Consomme /api/me/racines-dashboard uniquement.

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import { StateBlock } from "@/components/StateBlock";
import type { RacinesStepDefinition } from "@/lib/racines";

interface DashboardData {
  universe: "RACINES";
  hasLearningPath: boolean;
  learningPath?: { id: string; language: string; currentLevel: string | null };
  mode: "SOLO" | "FAMILY";
  langStatus: "READY" | "PARTIAL" | "MISSING" | null;
  anyLanguageReady: boolean;
  racinesStep: string | null;
  steps: RacinesStepDefinition[];
  children: Array<{
    id: string;
    prenom: string;
    avatarAnimal: string;
    age: number;
    activeLangue: string | null;
    langues: unknown[];
  }>;
  greetingName: string | null;
}

const COPY = {
  fr: {
    greetingFallback: "Bienvenue",
    universeLbl: "Racines · la maison",
    modeSolo: "Espace Solo",
    modeFamily: "Espace Famille",
    stepLbl: "Étape actuelle",
    noStep: "À définir",
    contentSoonSoul: "Ta langue Racines *arrive bientôt.*",
    contentSoonBody: "Nous préparons les récits, les écoutes et les activités avec des voix réelles. Ton profil est prêt — nous te préviendrons dès que la première langue ouvre.",
    contentSoonCta: "Voir mes réglages",
    stepsTitle: "Le chemin Racines",
    stepsIntro: "Cinq étapes pour habiter la langue, pas pour la certifier.",
    familyTitle: "Le foyer",
    familyIntro: "Chaque profil a sa langue et son étape.",
    childCta: "Ouvrir le profil",
    manageFamily: "Gérer les profils",
    coachTitle: "Suivi coach de langue",
    coachSoon: "Bientôt disponible — le suivi humain ouvrira avec les premiers contenus.",
    circleTitle: "Cercle Racines",
    circleSoon: "Le cercle de ta maison sera disponible prochainement.",
    loading: "La maison écoute — *un instant.*",
    errorSoul: "La voix s'est perdue en route. *Pas la tienne.*",
    errorBody: "Impossible de charger ton espace. Réessaie dans un instant.",
    retry: "Réessayer",
    noLpSoul: "Ton parcours Racines n'a pas encore été choisi.",
    noLpBody: "Passe par le seuil pour choisir Racines et ta langue.",
    noLpCta: "Choisir mon parcours",
  },
  en: {
    greetingFallback: "Welcome",
    universeLbl: "Roots · the home",
    modeSolo: "Solo space",
    modeFamily: "Family space",
    stepLbl: "Current step",
    noStep: "To be defined",
    contentSoonSoul: "Your Roots language *is coming soon.*",
    contentSoonBody: "We're preparing the tales, listens and activities with real voices. Your profile is ready — we'll let you know as soon as the first language opens.",
    contentSoonCta: "See my settings",
    stepsTitle: "The Roots path",
    stepsIntro: "Five steps to inhabit the language, not to certify it.",
    familyTitle: "The home",
    familyIntro: "Each profile has its language and its step.",
    childCta: "Open profile",
    manageFamily: "Manage profiles",
    coachTitle: "Language coach",
    coachSoon: "Coming soon — human support opens with the first content.",
    circleTitle: "Roots circle",
    circleSoon: "Your home's circle will be available soon.",
    loading: "The home listens — *just a moment.*",
    errorSoul: "The voice got lost on the way. *Not yours.*",
    errorBody: "Can't load your space. Try again in a moment.",
    retry: "Retry",
    noLpSoul: "Your Roots journey isn't chosen yet.",
    noLpBody: "Go through the threshold to choose Roots and your language.",
    noLpCta: "Choose my journey",
  },
} as const;

export function DashboardRacines({ locale }: { locale: "fr" | "en" }) {
  const c = COPY[locale];
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setLoading(true);
    fetch("/api/me/racines-dashboard")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch"))))
      .then((d) => setData(d as DashboardData))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  if (loading) {
    return (
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 16px" }}>
        <StateBlock kind="loading" soul={c.loading} />
      </main>
    );
  }
  if (error || !data) {
    return (
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 16px" }}>
        <StateBlock kind="error" soul={c.errorSoul} body={c.errorBody} action={{ label: c.retry, onClick: load }} />
      </main>
    );
  }

  if (!data.hasLearningPath) {
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "80px 16px" }}>
        <StateBlock kind="empty" centered soul={c.noLpSoul} body={c.noLpBody} action={{ label: c.noLpCta, href: "/onboarding" }} />
      </main>
    );
  }

  const greeting = data.greetingName?.split(" ")[0] ?? c.greetingFallback;
  const currentStep = data.steps.find((s) => s.key === data.racinesStep);
  const stepLabel = currentStep ? (locale === "en" ? currentStep.labelEn : currentStep.labelFr) : c.noStep;

  return (
    <main className="racines-dash" style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px 96px" }}>
      {/* En-tête */}
      <header style={{ marginBottom: 24 }}>
        <p style={{
          margin: "0 0 6px", color: "var(--brass)",
          fontFamily: "var(--font-jetbrains, monospace)", fontSize: 11,
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}>{c.universeLbl}</p>
        <h1 style={{
          fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 28,
          color: "var(--creme)", margin: "0 0 6px", overflowWrap: "anywhere",
        }}>{greeting}</h1>
        <p style={{ color: "var(--creme-mute)", fontSize: 14, margin: 0 }}>
          {data.mode === "FAMILY" ? c.modeFamily : c.modeSolo}
          {" · "}
          <span style={{ color: "var(--creme-soft)" }}>{c.stepLbl} {data.racinesStep ?? "—"} · {stepLabel}</span>
        </p>
      </header>

      {/* Contenu langue · état honnête tant que MISSING */}
      {(!data.anyLanguageReady || data.langStatus !== "READY") && (
        <section style={{ marginBottom: 24 }}>
          <StateBlock
            kind="empty"
            centered
            soul={c.contentSoonSoul}
            body={c.contentSoonBody}
            action={{ label: c.contentSoonCta, href: "/settings" }}
          />
        </section>
      )}

      {/* Foyer · liste des profils enfants réels */}
      {data.mode === "FAMILY" && (
        <section style={{ marginBottom: 24 }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 22, color: "var(--creme)", margin: "0 0 4px" }}>
                {c.familyTitle}
              </h2>
              <p style={{ color: "var(--creme-mute)", fontSize: 13, margin: 0 }}>{c.familyIntro}</p>
            </div>
            <Link href="/famille" className="row-btn" style={{ minHeight: 40 }}>
              {c.manageFamily}
            </Link>
          </header>
          <ul className="data-list" aria-label={c.familyTitle}>
            {data.children.map((child) => (
              <li key={child.id} className="data-card">
                <div className="data-card-head">
                  <span style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "var(--brass-glow)", border: "1px solid var(--brass-edge)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    color: "var(--brass)", fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontSize: 18, flexShrink: 0,
                  }} aria-hidden="true">{child.prenom.charAt(0).toUpperCase()}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="data-card-title">{child.prenom}</p>
                    <p className="data-card-sub">
                      {child.age} {locale === "en" ? "yrs" : "ans"}
                      {child.activeLangue ? ` · ${child.activeLangue}` : ""}
                    </p>
                  </div>
                  <Link href={`/famille/enfant/${child.id}`} className="row-btn" style={{ flexShrink: 0, minHeight: 40 }}>
                    {c.childCta}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Chemin Racines · définitions doctrinales */}
      <section style={{ marginBottom: 24 }}>
        <header style={{ marginBottom: 12 }}>
          <h2 style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 22, color: "var(--creme)", margin: "0 0 4px" }}>
            {c.stepsTitle}
          </h2>
          <p style={{ color: "var(--creme-mute)", fontSize: 13, margin: 0 }}>{c.stepsIntro}</p>
        </header>
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {data.steps.map((s) => {
            const isCurrent = s.key === data.racinesStep;
            return (
              <li key={s.key} className="data-card" style={{ borderColor: isCurrent ? "var(--brass)" : "var(--creme-hair)" }}>
                <div className="data-card-head">
                  <span style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: isCurrent ? "var(--brass)" : "var(--espresso-2)",
                    color: isCurrent ? "var(--espresso)" : "var(--creme-mute)",
                    border: `1px solid ${isCurrent ? "var(--brass)" : "var(--creme-hair)"}`,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-jetbrains, monospace)", fontWeight: 700, fontSize: 12,
                    flexShrink: 0,
                  }} aria-hidden="true">{s.key}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="data-card-title">{locale === "en" ? s.labelEn : s.labelFr}</p>
                    <p className="data-card-sub">{locale === "en" ? s.descriptionEn : s.descriptionFr}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Coach · toujours bientôt en P3 (RACINES_COACH_OPERATIONAL=false) */}
      <section style={{ marginBottom: 24, padding: "14px 16px", background: "rgba(244, 235, 220, 0.02)", border: "1px dashed var(--creme-hair)", borderRadius: 14 }}>
        <p style={{ margin: "0 0 4px", color: "var(--creme)", fontSize: 14, fontWeight: 500 }}>
          {c.coachTitle}
          <span style={{ marginLeft: 8, fontSize: 10, padding: "2px 8px", background: "var(--brass-glow)", color: "var(--brass)", border: "1px solid var(--brass-edge)", borderRadius: 99, fontFamily: "var(--font-jetbrains, monospace)" }}>{locale === "en" ? "Coming soon" : "Bientôt"}</span>
        </p>
        <p style={{ margin: 0, color: "var(--creme-mute)", fontSize: 12, lineHeight: 1.5 }}>{c.coachSoon}</p>
      </section>

      {/* Cercle · P4 décidera Circle vs Class · P3 rend un empty state */}
      <section style={{ padding: "14px 16px", background: "rgba(244, 235, 220, 0.02)", border: "1px dashed var(--creme-hair)", borderRadius: 14 }}>
        <p style={{ margin: "0 0 4px", color: "var(--creme)", fontSize: 14, fontWeight: 500 }}>{c.circleTitle}</p>
        <p style={{ margin: 0, color: "var(--creme-mute)", fontSize: 12, lineHeight: 1.5 }}>{c.circleSoon}</p>
      </section>
    </main>
  );
}
