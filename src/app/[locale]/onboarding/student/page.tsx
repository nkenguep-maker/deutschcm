"use client";

// /onboarding/student · Sprint « Le Cap ».
// Flux court, trois pas :
//   1. Le cap (Franchir · Grandir · Transmettre · Moi)
//      → pré-rempli depuis /register si l'utilisateur y a répondu.
//   2. La langue de départ (étrangère ou natale)
//   3. Le but concret + disponibilité + geste final
// Persistance : user_metadata (cap, activeLanguage, personalGoal,
// availability) + User.learningGoal en DB.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "@/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { FOREIGN, NATIVE, type Language } from "@/lib/languages";
import { frTypo } from "@/components/landing/typo";

type Cap = "franchir" | "grandir" | "transmettre" | "moi";
type Availability = "15" | "30" | "60" | "90";

interface Copy {
  step1Kicker: string;
  step1Title: string;
  step1TitleEm: string;
  step1Lede: string;
  caps: readonly { id: Cap; label: string; desc: string }[];

  step2Kicker: string;
  step2Title: string;
  step2TitleEm: string;
  step2Lede: string;
  worldGroup: string;
  sourcesGroup: string;
  langUnavailable: string;

  step3Kicker: string;
  step3Title: string;
  step3TitleEm: string;
  step3Lede: string;
  fldGoal: string;
  fldGoalPh: string;
  availLbl: string;
  avail: readonly { id: Availability; label: string; desc: string }[];

  back: string;
  next: string;
  finish: string;
  progressSteps: readonly string[];
  errNoCap: string;
  errNoLang: string;
  errNoGoal: string;
}

const COPY_FR: Copy = {
  step1Kicker: "Le cap",
  step1Title: "Où voulez-vous",
  step1TitleEm: "aller ?",
  step1Lede: "La maison connaît déjà quatre chemins. Choisissez celui qui vous ressemble aujourd'hui — vous pourrez toujours en emprunter un autre.",
  caps: [
    { id: "franchir",    label: "Réussir mon examen, partir",    desc: "Un dossier, un visa, un départ. La langue est le dernier verrou." },
    { id: "grandir",     label: "Progresser là où je vis",       desc: "Ancré·e ici, monter en compétence sans renier son sol." },
    { id: "transmettre", label: "Transmettre à mes enfants",     desc: "La langue de la maison, remise en vie pour la génération suivante." },
    { id: "moi",         label: "Apprendre pour moi",            desc: "Le plaisir de parler une nouvelle voix — sans compte à rendre." },
  ],

  step2Kicker: "La langue",
  step2Title: "Quelle langue",
  step2TitleEm: "va vous porter ?",
  step2Lede: "Une seule pour l'instant. Vous en ouvrirez d'autres plus tard — la maison grandit avec vous.",
  worldGroup: "Voyage vers le monde",
  sourcesGroup: "Retour aux sources",
  langUnavailable: "Bientôt — nommez-la en premier dans votre message.",

  step3Kicker: "Le but",
  step3Title: "Racontez-nous",
  step3TitleEm: "votre but.",
  step3Lede: "Une phrase qui vous ressemble. Elle sera utile — à vous, à votre enseignant·e accrédité·e s'il y en a un·e, à nos suggestions futures.",
  fldGoal: "Mon but",
  fldGoalPh: "Ex : Passer l'entretien A1 pour le regroupement familial avant l'été. Comprendre les voice notes de ma grand-mère à Louga. Passer un premier entretien technique à Berlin en décembre.",
  availLbl: "Combien de temps par jour ?",
  avail: [
    { id: "15", label: "15 min",   desc: "Court, régulier" },
    { id: "30", label: "30 min",   desc: "Le rythme qui tient" },
    { id: "60", label: "1 h",      desc: "L'immersion posée" },
    { id: "90", label: "1 h 30 +", desc: "L'intensif choisi" },
  ],

  back: "Revenir",
  next: "Continuer",
  finish: "Ouvrir ma maison",
  progressSteps: ["Cap", "Langue", "But"],
  errNoCap: "Choisissez d'abord un cap.",
  errNoLang: "Choisissez une langue.",
  errNoGoal: "Écrivez au moins une phrase — même courte.",
};

const COPY_EN: Copy = {
  step1Kicker: "The cap",
  step1Title: "Where do you want",
  step1TitleEm: "to go?",
  step1Lede: "The house already knows four paths. Pick the one that looks like you today — you can always change roads.",
  caps: [
    { id: "franchir",    label: "Pass my exam, leave",      desc: "A file, a visa, a departure. Language is the last lock." },
    { id: "grandir",     label: "Grow where I live",        desc: "Rooted here, growing skill without denying the ground." },
    { id: "transmettre", label: "Pass on to my children",   desc: "The home language, brought back to life for the next generation." },
    { id: "moi",         label: "Learn for me",             desc: "The pleasure of speaking a new voice — without owing anyone." },
  ],

  step2Kicker: "The language",
  step2Title: "Which language",
  step2TitleEm: "will carry you?",
  step2Lede: "One for now. You'll open others later — the house grows with you.",
  worldGroup: "A journey outward",
  sourcesGroup: "A return to the source",
  langUnavailable: "Soon — name it first in your message.",

  step3Kicker: "The goal",
  step3Title: "Tell us",
  step3TitleEm: "your goal.",
  step3Lede: "A sentence that looks like you. It matters — to you, to your accredited teacher if you have one, to our future suggestions.",
  fldGoal: "My goal",
  fldGoalPh: "E.g.: Pass the A1 interview for family reunification before summer. Understand my grandmother's voice notes from Louga. Land a first technical interview in Berlin by December.",
  availLbl: "How much time each day?",
  avail: [
    { id: "15", label: "15 min",   desc: "Short, regular" },
    { id: "30", label: "30 min",   desc: "The rhythm that sticks" },
    { id: "60", label: "1 h",      desc: "Grounded immersion" },
    { id: "90", label: "1 h 30 +", desc: "Chosen intensive" },
  ],

  back: "Back",
  next: "Continue",
  finish: "Open my house",
  progressSteps: ["Cap", "Language", "Goal"],
  errNoCap: "Pick a cap first.",
  errNoLang: "Pick a language.",
  errNoGoal: "Write at least one sentence — even a short one.",
};

export default function StudentOnboardingPage() {
  const router = useRouter();
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

  const [step, setStep] = useState(0);
  const [cap, setCap] = useState<Cap | null>(null);
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [personalGoal, setPersonalGoal] = useState("");
  const [availability, setAvailability] = useState<Availability>("30");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-remplissage : si /register a stocké le cap en user_metadata,
  // on l'utilise. Sinon on laisse null et l'utilisateur choisit.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as Record<string, unknown> | undefined;
      const preCap = meta?.cap as Cap | undefined;
      if (preCap) setCap(preCap);
    });
  }, []);

  const canGoNext = useMemo(() => {
    if (step === 0) return cap !== null;
    if (step === 1) return languageId !== null;
    if (step === 2) return personalGoal.trim().length >= 4;
    return false;
  }, [step, cap, languageId, personalGoal]);

  const handleNext = () => {
    if (step === 0 && !cap) { setError(c.errNoCap); return; }
    if (step === 1 && !languageId) { setError(c.errNoLang); return; }
    setError(null);
    setStep((s) => Math.min(2, s + 1));
  };
  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const handleFinish = async () => {
    if (!personalGoal.trim()) { setError(c.errNoGoal); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          role: "STUDENT",
          cap,
          activeLanguage: languageId,
          personalGoal: personalGoal.trim(),
          availability,
          profileData: {
            learningGoal: personalGoal.trim(),
            availability,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? "onboarding_failed");
      router.push("/dashboard");
    } catch (err) {
      setError(loc === "en"
        ? "Something didn't reach us. Try again."
        : "Quelque chose ne nous est pas parvenu. Réessayez.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cap-page">
      <header className="cap-header">
        <Link href={`/${locale}`} className="cap-brand">
          <BrandLockup orientation="horizontal" variant="world" state="static" size={28} />
        </Link>
        <ol className="cap-progress" aria-label={c.progressSteps.join(" · ")}>
          {c.progressSteps.map((label, i) => (
            <li key={label} className={`cap-progress-step ${i < step ? "done" : i === step ? "on" : "next"}`}>
              <span className="cap-progress-dot" aria-hidden="true" />
              <span className="cap-progress-lbl">{label}</span>
            </li>
          ))}
        </ol>
      </header>

      <main className="cap-main">
        {step === 0 ? (
          <StepCap
            copy={c}
            selected={cap}
            onPick={(v) => { setCap(v); setError(null); }}
            t={t}
          />
        ) : step === 1 ? (
          <StepLang
            copy={c}
            selected={languageId}
            onPick={(v) => { setLanguageId(v); setError(null); }}
            locale={loc}
            t={t}
          />
        ) : (
          <StepGoal
            copy={c}
            goal={personalGoal}
            setGoal={setPersonalGoal}
            availability={availability}
            setAvailability={setAvailability}
            t={t}
          />
        )}

        {error ? <p className="cap-err" role="alert">{error}</p> : null}

        <div className="cap-actions">
          {step > 0 ? (
            <button type="button" className="cap-btn-ghost" onClick={handleBack} disabled={saving}>
              ← {c.back}
            </button>
          ) : <span />}
          {step < 2 ? (
            <button type="button" className="cap-btn-primary" onClick={handleNext} disabled={!canGoNext || saving}>
              {c.next} →
            </button>
          ) : (
            <button type="button" className="cap-btn-primary" onClick={handleFinish} disabled={!canGoNext || saving}>
              {saving ? (loc === "en" ? "Opening…" : "Ouverture…") : c.finish}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Step 1 · le cap ────────────────────────────────────────────
function StepCap({ copy, selected, onPick, t }: {
  copy: Copy; selected: Cap | null; onPick: (v: Cap) => void;
  t: (s: string) => string;
}) {
  return (
    <section className="cap-step">
      <p className="maison-kicker">{t(copy.step1Kicker)}</p>
      <h1 className="cap-h">
        {t(copy.step1Title)} <em>{t(copy.step1TitleEm)}</em>
      </h1>
      <p className="cap-lede">{t(copy.step1Lede)}</p>

      <ul className="cap-choices" role="radiogroup">
        {copy.caps.map((k) => {
          const on = selected === k.id;
          return (
            <li key={k.id}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                className={`cap-choice ${on ? "on" : ""}`}
                onClick={() => onPick(k.id)}
              >
                <span className="cap-choice-title">{t(k.label)}</span>
                <span className="cap-choice-desc">{t(k.desc)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ─── Step 2 · la langue ────────────────────────────────────────
function StepLang({ copy, selected, onPick, locale, t }: {
  copy: Copy; selected: string | null; onPick: (id: string) => void;
  locale: "fr" | "en";
  t: (s: string) => string;
}) {
  const renderCard = (l: Language) => {
    const on = selected === l.id;
    const available = l.status === "live" || l.status === "next";
    return (
      <li key={l.id}>
        <button
          type="button"
          role="radio"
          aria-checked={on}
          className={`cap-lang ${on ? "on" : ""} ${!available ? "off" : ""}`}
          onClick={() => available && onPick(l.id)}
          disabled={!available}
        >
          <span className="cap-lang-code" aria-hidden="true">{l.code}</span>
          <span className="cap-lang-body">
            <span className="cap-lang-name">{locale === "en" ? l.nameEn : l.name}</span>
            <span className="cap-lang-region">{locale === "en" ? l.regionEn : l.region}</span>
            {!available ? (
              <span className="cap-lang-soon">{t(copy.langUnavailable)}</span>
            ) : null}
          </span>
        </button>
      </li>
    );
  };

  return (
    <section className="cap-step">
      <p className="maison-kicker">{t(copy.step2Kicker)}</p>
      <h1 className="cap-h">
        {t(copy.step2Title)} <em>{t(copy.step2TitleEm)}</em>
      </h1>
      <p className="cap-lede">{t(copy.step2Lede)}</p>

      <div className="cap-lang-groups">
        <div className="cap-lang-group">
          <p className="cap-lang-group-lbl">{t(copy.worldGroup)}</p>
          <ul className="cap-lang-grid" role="radiogroup" aria-label={copy.worldGroup}>
            {FOREIGN.map(renderCard)}
          </ul>
        </div>
        <div className="cap-lang-group">
          <p className="cap-lang-group-lbl">{t(copy.sourcesGroup)}</p>
          <ul className="cap-lang-grid" role="radiogroup" aria-label={copy.sourcesGroup}>
            {NATIVE.map(renderCard)}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─── Step 3 · le but concret ────────────────────────────────────
function StepGoal({ copy, goal, setGoal, availability, setAvailability, t }: {
  copy: Copy;
  goal: string; setGoal: (v: string) => void;
  availability: Availability; setAvailability: (v: Availability) => void;
  t: (s: string) => string;
}) {
  return (
    <section className="cap-step">
      <p className="maison-kicker">{t(copy.step3Kicker)}</p>
      <h1 className="cap-h">
        {t(copy.step3Title)} <em>{t(copy.step3TitleEm)}</em>
      </h1>
      <p className="cap-lede">{t(copy.step3Lede)}</p>

      <label className="cap-field">
        <span>{t(copy.fldGoal)}</span>
        <textarea
          rows={4}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder={t(copy.fldGoalPh)}
          maxLength={500}
        />
      </label>

      <fieldset className="cap-avail">
        <legend>{t(copy.availLbl)}</legend>
        <div className="cap-avail-grid">
          {copy.avail.map((a) => {
            const on = availability === a.id;
            return (
              <label key={a.id} className={`cap-avail-choice ${on ? "on" : ""}`}>
                <input
                  type="radio"
                  name="availability"
                  value={a.id}
                  checked={on}
                  onChange={() => setAvailability(a.id)}
                />
                <span>
                  <span className="cap-avail-title">{a.label}</span>
                  <span className="cap-avail-desc">{t(a.desc)}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}
