"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Building2,
  Compass,
  GraduationCap,
  HeartHandshake,
  Home,
  Languages,
  Landmark,
  Plane,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandY } from "@/components/brand/BrandY";
import { useOnboardingSelectionMode } from "@/components/onboarding/OnboardingPreviewContext";
import { SeuilGreetings } from "@/components/seuil/SeuilGreeting";
import { FOREIGN, NATIVE } from "@/lib/languages";
import type { AdultPersonaId } from "@/lib/personas/runtime";

type Stage = "start" | "world-language" | "world" | "roots-language" | "roots" | "professional";
type PathwayVariant = "STUDIES" | "VISA" | "NATURALIZATION" | "TOURISM";
type LearningLanguageId = "deutsch" | "wolof";
const PRECONFIRMATION_DRAFT_KEY = "yema.preconfirmation.journey";

type Card = {
  id: string;
  icon: LucideIcon;
  eyebrowFr: string;
  eyebrowEn: string;
  titleFr: string;
  titleEn: string;
  bodyFr: string;
  bodyEn: string;
  persona?: Exclude<AdultPersonaId, "super_admin">;
  nextStage?: Exclude<Stage, "start">;
  pathwayVariant?: PathwayVariant;
  languageId?: LearningLanguageId;
  available?: boolean;
  tone: "world" | "roots" | "professional";
};

const START_CARDS: readonly Card[] = [
  {
    id: "world",
    icon: Compass,
    eyebrowFr: "Apprendre",
    eyebrowEn: "Learn",
    titleFr: "Une langue du monde",
    titleEn: "A world language",
    bodyFr: "Pour les études, le travail, une installation ou un voyage.",
    bodyEn: "For studies, work, moving abroad or travel.",
    nextStage: "world-language",
    tone: "world",
  },
  {
    id: "roots",
    icon: HeartHandshake,
    eyebrowFr: "Retrouver",
    eyebrowEn: "Reconnect",
    titleFr: "Une langue de famille",
    titleEn: "A family language",
    bodyFr: "Pour vous, ou pour la transmettre à vos enfants.",
    bodyEn: "For yourself, or to pass it on to your children.",
    nextStage: "roots-language",
    tone: "roots",
  },
  {
    id: "professional",
    icon: Building2,
    eyebrowFr: "Accompagner",
    eyebrowEn: "Support",
    titleFr: "Un espace professionnel",
    titleEn: "A professional space",
    bodyFr: "Pour enseigner, accompagner ou représenter un centre.",
    bodyEn: "To teach, coach, or represent a learning center.",
    nextStage: "professional",
    tone: "professional",
  },
];

const WORLD_LANGUAGE_CARDS: readonly Card[] = FOREIGN.map((language) => {
  const available = language.id === "deutsch";
  return {
    id: language.id,
    icon: Languages,
    eyebrowFr: `${language.code} · ${available ? "Disponible" : "Bientôt"}`,
    eyebrowEn: `${language.code} · ${available ? "Available" : "Coming soon"}`,
    titleFr: language.name,
    titleEn: language.nameEn,
    bodyFr: available
      ? "Disponible maintenant, du niveau A1 jusqu’aux parcours avancés."
      : "Cette langue arrive prochainement dans YEMA.",
    bodyEn: available
      ? "Available now, from A1 through advanced journeys."
      : "This language is coming to YEMA soon.",
    ...(available ? { languageId: "deutsch" as const, nextStage: "world" as const } : {}),
    available,
    tone: "world" as const,
  };
});

const ROOTS_LANGUAGE_CARDS: readonly Card[] = NATIVE.map((language) => {
  const available = language.id === "wolof";
  return {
    id: language.id,
    icon: Languages,
    eyebrowFr: `${language.code} · ${available ? "Bêta" : "Bientôt"}`,
    eyebrowEn: `${language.code} · ${available ? "Beta" : "Coming soon"}`,
    titleFr: language.name,
    titleEn: language.nameEn,
    bodyFr: available
      ? "Le parcours Racines actuellement proposé en bêta."
      : "Cette langue arrive prochainement dans YEMA.",
    bodyEn: available
      ? "The Roots journey currently offered in beta."
      : "This language is coming to YEMA soon.",
    ...(available ? { languageId: "wolof" as const, nextStage: "roots" as const } : {}),
    available,
    tone: "roots" as const,
  };
});

const WORLD_CARDS: readonly Card[] = [
  {
    id: "studies",
    icon: GraduationCap,
    eyebrowFr: "Projet",
    eyebrowEn: "Goal",
    titleFr: "Étudier",
    titleEn: "Study",
    bodyFr: "Université, Ausbildung et vie de campus.",
    bodyEn: "University, Ausbildung and campus life.",
    persona: "student_monde",
    pathwayVariant: "STUDIES",
    tone: "world",
  },
  {
    id: "visa",
    icon: Landmark,
    eyebrowFr: "Projet",
    eyebrowEn: "Goal",
    titleFr: "Travailler ou m’installer",
    titleEn: "Work or move abroad",
    bodyFr: "Emploi, démarches, rendez-vous et situations administratives.",
    bodyEn: "Work, procedures, appointments and administrative situations.",
    persona: "student_monde",
    pathwayVariant: "VISA",
    tone: "world",
  },
  {
    id: "naturalization",
    icon: Home,
    eyebrowFr: "Projet",
    eyebrowEn: "Goal",
    titleFr: "Vivre durablement sur place",
    titleEn: "Live there long-term",
    bodyFr: "Vie quotidienne, autonomie et repères civiques.",
    bodyEn: "Everyday life, independence and civic reference points.",
    persona: "student_monde",
    pathwayVariant: "NATURALIZATION",
    tone: "world",
  },
  {
    id: "tourism",
    icon: Plane,
    eyebrowFr: "Projet",
    eyebrowEn: "Goal",
    titleFr: "Voyager",
    titleEn: "Travel",
    bodyFr: "Transport, hôtel, sorties et conversations simples.",
    bodyEn: "Transport, hotels, outings and simple conversations.",
    persona: "student_monde",
    pathwayVariant: "TOURISM",
    tone: "world",
  },
];

const ROOTS_CARDS: readonly Card[] = [
  {
    id: "roots-solo",
    icon: UserRound,
    eyebrowFr: "Racines",
    eyebrowEn: "Roots",
    titleFr: "Pour moi",
    titleEn: "For me",
    bodyFr: "Retrouver la langue à mon rythme, dans mon propre espace.",
    bodyEn: "Reconnect with the language at my own pace, in my own space.",
    persona: "student_racines",
    tone: "roots",
  },
  {
    id: "roots-family",
    icon: UsersRound,
    eyebrowFr: "Racines",
    eyebrowEn: "Roots",
    titleFr: "Pour ma famille",
    titleEn: "For my family",
    bodyFr: "Commencer en adulte, puis créer les espaces des enfants.",
    bodyEn: "Start as an adult, then create spaces for your children.",
    persona: "family",
    tone: "roots",
  },
];

const PROFESSIONAL_CARDS: readonly Card[] = [
  {
    id: "teacher",
    icon: GraduationCap,
    eyebrowFr: "Professionnel",
    eyebrowEn: "Professional",
    titleFr: "Enseigner",
    titleEn: "Teach",
    bodyFr: "Créer votre profil Enseignant et demander son activation.",
    bodyEn: "Create your Teacher profile and request its activation.",
    persona: "teacher",
    tone: "professional",
  },
  {
    id: "coach",
    icon: HeartHandshake,
    eyebrowFr: "Professionnel",
    eyebrowEn: "Professional",
    titleFr: "Accompagner Racines",
    titleEn: "Coach Roots",
    bodyFr: "Déposer une demande pour accompagner les apprenants.",
    bodyEn: "Submit a request to support Roots learners.",
    persona: "coach",
    tone: "roots",
  },
  {
    id: "center",
    icon: Building2,
    eyebrowFr: "Organisation",
    eyebrowEn: "Organization",
    titleFr: "Représenter un centre",
    titleEn: "Represent a center",
    bodyFr: "Créer l’espace de votre organisation et ses accès vérifiés.",
    bodyEn: "Create your organization space and its verified access.",
    persona: "center_admin",
    tone: "professional",
  },
];

function cardsFor(stage: Stage): readonly Card[] {
  if (stage === "world-language") return WORLD_LANGUAGE_CARDS;
  if (stage === "world") return WORLD_CARDS;
  if (stage === "roots-language") return ROOTS_LANGUAGE_CARDS;
  if (stage === "roots") return ROOTS_CARDS;
  if (stage === "professional") return PROFESSIONAL_CARDS;
  return START_CARDS;
}

function cardFromPreconfirmationDraft(value: unknown): { card: Card; languageId: LearningLanguageId | null } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const draft = value as { persona?: unknown; pathwayVariant?: unknown; languageId?: unknown };
  const card = [...WORLD_CARDS, ...ROOTS_CARDS, ...PROFESSIONAL_CARDS].find((card) =>
    card.persona === draft.persona && card.pathwayVariant === draft.pathwayVariant,
  );
  if (!card) return null;

  const defaultLanguage = card.persona === "student_monde"
    ? "deutsch"
    : card.persona === "student_racines" || card.persona === "family"
      ? "wolof"
      : null;
  const languageId = draft.languageId === "deutsch" || draft.languageId === "wolof"
    ? draft.languageId
    : defaultLanguage;
  if (card.persona === "student_monde" && languageId !== "deutsch") return null;
  if ((card.persona === "student_racines" || card.persona === "family") && languageId !== "wolof") return null;
  return { card, languageId };
}

function copyFor(stage: Stage, locale: "fr" | "en") {
  const english = locale === "en";
  if (stage === "world-language") {
    return english
      ? { kicker: "Your language", title: "Which language would you like to learn?", body: "Choose your language before tailoring your journey." }
      : { kicker: "Votre langue", title: "Quelle langue souhaitez-vous apprendre ?", body: "Choisissez votre langue avant de personnaliser votre parcours. Les prochaines langues sont déjà visibles." };
  }
  if (stage === "world") {
    return english
      ? { kicker: "Your project", title: "What should this language help you do?", body: "We will adapt situations and examples to this goal." }
      : { kicker: "Votre projet", title: "À quoi doit vous servir cette langue ?", body: "Nous adapterons les situations et les exemples à ce projet." };
  }
  if (stage === "roots-language") {
    return english
      ? { kicker: "Your language", title: "Which language would you like to reconnect with?", body: "Choose the language before shaping your Roots journey." }
      : { kicker: "Votre langue", title: "Quelle langue souhaitez-vous retrouver ?", body: "Choisissez votre langue avant de dessiner votre parcours Racines. Les prochaines langues sont déjà visibles." };
  }
  if (stage === "roots") {
    return english
      ? { kicker: "Your Roots journey", title: "Who is this language journey for?", body: "You can add another journey to the same account later." }
      : { kicker: "Votre parcours Racines", title: "Pour qui commence ce parcours ?", body: "Vous pourrez ajouter un autre parcours à ce même compte plus tard." };
  }
  if (stage === "professional") {
    return english
      ? { kicker: "Professional access", title: "How would you like to contribute?", body: "Professional access is reviewed by YEMA before it is activated." }
      : { kicker: "Accès professionnel", title: "Comment souhaitez-vous contribuer ?", body: "Les accès professionnels sont validés par YEMA avant leur activation." };
  }
  return english
    ? { kicker: "Your YEMA journey", title: "What brings you to YEMA?", body: "One choice now. Your first experience follows." }
    : { kicker: "Votre parcours YEMA", title: "Qu’est-ce qui vous amène chez YEMA ?", body: "Un choix maintenant. Votre première expérience arrive juste après." };
}

export default function PersonaOnboardingPage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectionMode = useOnboardingSelectionMode();
  const preview = selectionMode === "preview";
  const preconfirmation = selectionMode === "preconfirmation";
  const selectedPlan = searchParams.get("plan");
  const selectedAddon = searchParams.get("addon");
  const teacherAddonRequested = searchParams.get("prof") === "1";
  const postOnboardingNext = searchParams.get("next");
  const hasOfferIntent = Boolean(selectedPlan || selectedAddon || teacherAddonRequested);
  const [stage, setStage] = useState<Stage>("start");
  const [loading, setLoading] = useState<AdultPersonaId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewChoice, setPreviewChoice] = useState<Card | null>(null);
  const [learningLanguage, setLearningLanguage] = useState<LearningLanguageId | null>(null);
  const preconfirmationReplayRef = useRef(false);
  const copy = copyFor(stage, loc);
  const cards = cardsFor(stage);
  const greetingPool = stage === "world" || stage === "world-language"
    ? "world"
    : stage === "roots" || stage === "roots-language"
      ? "sources"
      : "all";

  useEffect(() => {
    if (selectionMode !== "live" || preconfirmationReplayRef.current) return;
    try {
      const raw = window.localStorage.getItem(PRECONFIRMATION_DRAFT_KEY);
      if (!raw) return;
      const draft = cardFromPreconfirmationDraft(JSON.parse(raw));
      if (!draft) {
        window.localStorage.removeItem(PRECONFIRMATION_DRAFT_KEY);
        return;
      }
      preconfirmationReplayRef.current = true;
      void choose(draft.card, draft.languageId);
    } catch {
      window.localStorage.removeItem(PRECONFIRMATION_DRAFT_KEY);
    }
    // The draft is intentionally replayed only when this mode mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionMode]);

  async function choose(card: Card, languageId: LearningLanguageId | null = learningLanguage) {
    if (card.nextStage) {
      setError(null);
      if (card.languageId) {
        setLearningLanguage(card.languageId);
      } else if (card.id === "world" || card.id === "roots" || card.id === "professional") {
        setLearningLanguage(null);
      }
      setStage(card.nextStage);
      return;
    }
    if (!card.persona) return;

    if (preview) {
      setPreviewChoice(card);
      return;
    }

    if (preconfirmation) {
      window.localStorage.setItem(
        PRECONFIRMATION_DRAFT_KEY,
        JSON.stringify({ persona: card.persona, pathwayVariant: card.pathwayVariant, languageId }),
      );
      setPreviewChoice(card);
      return;
    }

    setLoading(card.persona);
    setError(null);
    try {
      const response = await fetch("/api/onboarding/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: card.persona,
          pathwayVariant: card.pathwayVariant,
          languageId,
          selectedPlan,
          selectedAddon,
          teacherAddonRequested,
          postOnboardingNext,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.redirectTo !== "string") {
        throw new Error("persona_selection_failed");
      }
      window.localStorage.removeItem(PRECONFIRMATION_DRAFT_KEY);
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
    <main className={`onboarding-router ${stage === "roots" || stage === "roots-language" ? "onboarding-router-roots" : ""}`}>
      <SeuilGreetings locale={loc} visibleCount={2} pool={greetingPool} variant="entry" />
      <header className="onboarding-router-head">
        <div className="onboarding-router-brand-row">
          {stage !== "start" ? (
            <button
              type="button"
              className="onboarding-router-back"
              onClick={() => {
                setError(null);
                setStage(
                  stage === "world" ? "world-language" :
                  stage === "roots" ? "roots-language" :
                  "start",
                );
              }}
              aria-label={loc === "en" ? "Back to journey choices" : "Retour aux choix de parcours"}
              title={loc === "en" ? "Back" : "Retour"}
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
          ) : <span className="onboarding-router-back-space" aria-hidden="true" />}
          <BrandY variant={stage === "roots" ? "sources" : "world"} state="static" size={64} />
          <span className="onboarding-router-back-space" aria-hidden="true" />
        </div>
        <p className="entry-kicker">{copy.kicker}</p>
        <h1 className="onboarding-router-titre">{copy.title}</h1>
        <p className="onboarding-router-sous">{copy.body}</p>
        {hasOfferIntent ? (
          <div className="entry-context" role="note">
            <span className="entry-context-dot" aria-hidden="true" />
            <span className="entry-context-text">
              {loc === "en"
                ? "Your selection is saved with this account. No payment is requested during onboarding."
                : "Votre sélection est enregistrée avec ce compte. Aucun paiement n’est demandé pendant l’onboarding."}
            </span>
          </div>
        ) : null}
      </header>

      {error ? <p className="entry-err" role="alert">{error}</p> : null}

      {preview || preconfirmation ? (
        <p className="onboarding-router-preview" role="status">
          {preconfirmation
            ? (previewChoice
              ? (loc === "en"
                ? `${previewChoice.titleEn} is ready. Confirm your email to start with this journey.`
                : `${previewChoice.titleFr} est prêt. Confirmez votre e-mail pour démarrer avec ce parcours.`)
              : (loc === "en"
                ? "Prepare your journey now. Your choices will be applied after email confirmation."
                : "Préparez votre parcours maintenant. Vos choix seront appliqués après confirmation de l’e-mail."))
            : previewChoice
            ? (loc === "en"
              ? `${previewChoice.titleEn} selected. In the live journey, this opens the next tailored step.`
              : `${previewChoice.titleFr} sélectionné. Dans le parcours réel, cela ouvre la prochaine étape adaptée.`)
            : (loc === "en"
              ? "Preview mode: explore the choices freely. No account is created."
              : "Mode aperçu : explorez librement les choix. Aucun compte n’est créé.")}
        </p>
      ) : null}

      <section
        className={`onboarding-router-portes onboarding-router-portes-${stage}`}
        aria-label={loc === "en" ? "Journey choices" : "Choix de parcours"}
      >
        {cards.map((card) => {
          const Icon = card.icon;
          const isSaving = loading === card.persona;
          return (
            <button
              key={card.id}
              type="button"
              className={`onboarding-router-porte onboarding-router-porte-${card.tone} ${card.available === false ? "onboarding-router-porte-coming" : ""}`}
              onClick={() => choose(card)}
              disabled={loading !== null || card.available === false}
            >
              <Icon className="onboarding-router-porte-icon" size={22} strokeWidth={1.65} aria-hidden="true" />
              <span className="onboarding-router-porte-eyebrow">
                {loc === "en" ? card.eyebrowEn : card.eyebrowFr}
              </span>
              <span className="onboarding-router-porte-titre">
                {loc === "en" ? card.titleEn : card.titleFr}
              </span>
              <span className="onboarding-router-porte-body">
                {isSaving
                  ? (loc === "en" ? "Saving your journey…" : "Votre parcours est enregistré…")
                  : (loc === "en" ? card.bodyEn : card.bodyFr)}
              </span>
            </button>
          );
        })}
      </section>
    </main>
  );
}
