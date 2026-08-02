"use client";

// /famille · sélecteur de profil « Qui apprend ce soir ? » + gestion
// des profils enfants sous compte parent. Multi-langues : un enfant
// peut avoir des langues africaines (territory=sources · échelle YEMA)
// ET/OU du monde (territory=world · échelle douce M1-M4).
//
// Sécurité mineurs · seul le parent authentifié voit ses propres
// profils. Toutes les mutations passent par /api/family/children.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { StateBlock } from "@/components/StateBlock";
import { frTypo } from "@/components/landing/typo";
import { AnimalAvatar, AVATAR_ANIMALS, ANIMAL_LABEL_FR, ANIMAL_LABEL_EN, type AvatarAnimal } from "@/components/famille/AnimalAvatar";
import { ChildPinDialog } from "@/components/famille/ChildPinDialog";
import { LANGUAGES } from "@/lib/languages";
import type { ChildLangue } from "@/lib/childScales";

interface Child {
  id: string;
  prenom: string;
  avatarAnimal: AvatarAnimal;
  age: number;
  activeLangue: string | null;
  langues: ChildLangue[];
}

const NATAL_LANGS = Object.values(LANGUAGES).filter((l) => l.territory === "sources");
const FOREIGN_LANGS = Object.values(LANGUAGES).filter((l) => l.territory === "world");

const COPY = {
  fr: {
    kicker: "L'espace famille",
    title: "Qui apprend ce soir ?",
    subtitle: "Choisissez un enfant. Ou ajoutez-en un.",
    add: "Ajouter un enfant",
    empty: {
      soul: "Aucun enfant pour l'instant. *Ajoutez le premier.*",
      action: "Ajouter un enfant",
    },
    parentSpace: "Espace parent",
    openChildSpace: "Ouvrir son espace",
    childPinTitle: "Ouvrir l'espace de {prenom}",
    childPinLabel: "Code enfant",
    childPinPlaceholder: "••••",
    childPinSubmit: "Entrer",
    childPinCancel: "Annuler",
    childPinErrGeneric: "Le code ne correspond pas. Réessaie ou demande à ton parent.",
    step: "Nouveau profil",
    prenomLbl: "Prénom",
    ageLbl: "Âge",
    animalLbl: "Animal",
    // Gate 8B · sélecteur univers EXPLICITE · brief §1 · aucune inférence
    // depuis la langue. Le parent choisit sciemment l'espace pédagogique.
    universeLbl: "Quel espace souhaitez-vous créer pour cet enfant ?",
    universeMondeLabel: "Monde",
    universeMondeDesc: "apprendre une langue internationale",
    universeRacinesLabel: "Racines",
    universeRacinesDesc: "transmettre une langue patrimoniale",
    languesLbl: "Langues à écouter",
    nativeLbl: "Langues africaines",
    foreignLbl: "Langues du monde",
    natalePick: "Notre langue de la maison",
    foreignPick: "Une langue à découvrir",
    languesHelp: "Choisissez une ou deux langues. Vous pourrez en ajouter plus tard.",
    // Lot 7B.2 · sélecteur parcours Monde · uniquement quand une langue
    // du monde (foreign) est cochée. 5 valeurs canoniques + différer.
    goalLbl: "Parcours Monde",
    goalHelp: "Uniquement pour une langue du monde. Vous pourrez le changer plus tard.",
    goalOpts: {
      STUDIES: "Études",
      WORK: "Travail",
      TRAVEL: "Voyage",
      EXAM: "Examen",
      DAILY_LIFE: "Vie quotidienne",
      LATER: "Je définirai cet objectif plus tard",
    },
    cancel: "Annuler",
    create: "Créer le profil",
    stars: (n: number) => (n <= 1 ? `${n} étoile` : `${n} étoiles`),
    total: (n: number) => (n <= 1 ? `${n} langue` : `${n} langues`),
    errName: "Prénom manquant.",
    errAge: "Âge entre 3 et 12.",
    errAnimal: "Choisissez un animal.",
    errLang: "Choisissez au moins une langue.",
    errUniverse: "Choisissez l'espace (Monde ou Racines).",
    errServer: "Impossible de créer le profil.",
  },
  en: {
    kicker: "Family space",
    title: "Who's learning tonight?",
    subtitle: "Pick a child. Or add one.",
    add: "Add a child",
    empty: {
      soul: "No child yet. *Add the first one.*",
      action: "Add a child",
    },
    parentSpace: "Parent space",
    openChildSpace: "Open child space",
    childPinTitle: "Open {prenom}'s space",
    childPinLabel: "Child PIN",
    childPinPlaceholder: "••••",
    childPinSubmit: "Enter",
    childPinCancel: "Cancel",
    childPinErrGeneric: "The PIN doesn't match. Try again or ask your parent.",
    step: "New profile",
    prenomLbl: "First name",
    ageLbl: "Age",
    animalLbl: "Animal",
    universeLbl: "Which learning space would you like to create for this child?",
    universeMondeLabel: "Monde",
    universeMondeDesc: "learn an international language",
    universeRacinesLabel: "Roots",
    universeRacinesDesc: "pass on a heritage language",
    languesLbl: "Languages to listen to",
    nativeLbl: "African languages",
    foreignLbl: "World languages",
    natalePick: "Our house language",
    foreignPick: "A language to discover",
    languesHelp: "Pick one or two. You can add more later.",
    goalLbl: "World pathway",
    goalHelp: "Only for a world language. You can change it later.",
    goalOpts: {
      STUDIES: "Studies",
      WORK: "Work",
      TRAVEL: "Travel",
      EXAM: "Exam",
      DAILY_LIFE: "Daily life",
      LATER: "I'll define this goal later",
    },
    cancel: "Cancel",
    create: "Create profile",
    stars: (n: number) => (n <= 1 ? `${n} star` : `${n} stars`),
    total: (n: number) => (n <= 1 ? `${n} language` : `${n} languages`),
    errName: "Name missing.",
    errAge: "Age between 3 and 12.",
    errAnimal: "Pick an animal.",
    errLang: "Pick at least one language.",
    errUniverse: "Pick the space (Monde or Roots).",
    errServer: "Could not create profile.",
  },
};

export default function FamillePage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = COPY[loc];
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

  const [children, setChildren] = useState<Child[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  // Gate 8K · state pour ChildPinDialog · uniquement en mémoire React.
  const [pinChild, setPinChild] = useState<Child | null>(null);

  useEffect(() => {
    fetch("/api/family/children")
      .then((r) => (r.ok ? r.json() : { children: [] }))
      .then((d) => setChildren(d.children as Child[]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="famille-shell">
        <StateBlock
          kind="loading"
          soul={loc === "en" ? "The house opens — *just a moment.*" : "La maison s'ouvre — *un instant.*"}
        />
      </main>
    );
  }

  return (
    <main className="famille-shell">
      <header className="famille-header">
        <p className="famille-kicker">{t(c.kicker).toUpperCase()}</p>
        <h1 className="famille-title">{t(c.title)}</h1>
        <p className="famille-sub">{t(c.subtitle)}</p>
      </header>

      {children && children.length === 0 ? (
        <StateBlock
          kind="empty"
          soul={c.empty.soul}
          action={{ label: c.empty.action, onClick: () => setShowAdd(true) }}
          centered
        />
      ) : (
        <ul className="famille-grid">
          {(children ?? []).map((child) => {
            const activeLangue = child.langues.find((l) => l.langue === child.activeLangue) ?? child.langues[0];
            const totalStars = child.langues.reduce((sum, l) => sum + l.etoiles, 0);
            return (
              <li key={child.id} className="famille-card-item" data-testid="family-child-card">
                <Link href={`/${locale}/famille/enfant/${child.id}`} className="famille-card">
                  <AnimalAvatar animal={child.avatarAnimal} size={112} ariaLabel={loc === "en" ? ANIMAL_LABEL_EN[child.avatarAnimal] : ANIMAL_LABEL_FR[child.avatarAnimal]} />
                  <p className="famille-card-name">{child.prenom}</p>
                  <p className="famille-card-meta">
                    {child.age}
                    {activeLangue ? (
                      <> · {loc === "en" ? LANGUAGES[activeLangue.langue]?.nameEn : LANGUAGES[activeLangue.langue]?.name}</>
                    ) : null}
                  </p>
                  <p className="famille-card-meta famille-card-meta-langues">
                    {c.total(child.langues.length)}
                  </p>
                  <p className="famille-card-stars">✦ {c.stars(totalStars)}</p>
                </Link>
                {/* Gate 8K · action explicite « Ouvrir son espace » ·
                    déclenche le dialogue PIN canonique. Le Link legacy
                    reste (accessible parents/QA) mais l'action PIN est
                    le vrai flow enfant produit. */}
                <button
                  type="button"
                  className="famille-btn ghost"
                  onClick={() => setPinChild(child)}
                  style={{ marginTop: 8, minHeight: 44, width: "100%" }}
                  data-testid="family-child-open-space"
                  aria-label={`${c.openChildSpace} · ${child.prenom}`}
                >
                  {c.openChildSpace}
                </button>
              </li>
            );
          })}
          <li className="famille-card-item">
            <button
              type="button"
              className="famille-card famille-card-add"
              onClick={() => setShowAdd(true)}
              aria-label={c.add}
            >
              <span className="famille-card-add-plus" aria-hidden="true">+</span>
              <p className="famille-card-name">{c.add}</p>
            </button>
          </li>
        </ul>
      )}

      <div className="famille-footer">
        <Link href={`/${locale}/dashboard`} className="famille-footer-link">
          {c.parentSpace} →
        </Link>
      </div>

      {showAdd ? (
        <AddChildDialog
          loc={loc}
          copy={c}
          onCancel={() => setShowAdd(false)}
          onCreated={(child) => {
            setChildren((prev) => [...(prev ?? []), child]);
            setShowAdd(false);
          }}
        />
      ) : null}

      {/* Gate 8K · dialogue PIN enfant · rendu conditionnel sur
          pinChild · le composant gère lui-même POST /api/child-session
          + navigation vers /{locale}/dashboard sur 200. */}
      {pinChild ? (
        <ChildPinDialog
          child={{ id: pinChild.id, prenom: pinChild.prenom, avatarAnimal: pinChild.avatarAnimal }}
          locale={locale}
          copy={{
            title: c.childPinTitle,
            pinLbl: c.childPinLabel,
            pinPlaceholder: c.childPinPlaceholder,
            submit: c.childPinSubmit,
            cancel: c.childPinCancel,
            errGeneric: c.childPinErrGeneric,
          }}
          onClose={() => setPinChild(null)}
        />
      ) : null}
    </main>
  );
}

// ── Dialogue Ajouter un enfant · multi-langues ────────────────────
function AddChildDialog({
  loc,
  copy,
  onCancel,
  onCreated,
}: {
  loc: "fr" | "en";
  copy: (typeof COPY)["fr"];
  onCancel: () => void;
  onCreated: (c: Child) => void;
}) {
  const [prenom, setPrenom] = useState("");
  const [age, setAge] = useState<number>(6);
  const [animal, setAnimal] = useState<AvatarAnimal>("chouette");
  const [natal, setNatal] = useState<string[]>([]);
  const [foreign, setForeign] = useState<string[]>([]);
  // Gate 8B · univers explicite · aucune valeur par défaut · sélection
  // obligatoire par le parent. Brief §1 · aucune inférence depuis la langue.
  const [universe, setUniverse] = useState<"MONDE" | "RACINES" | null>(null);
  // Lot 7B.2 · parcours Monde optionnel · "LATER" = envoi null au serveur.
  const [goal, setGoal] = useState<"STUDIES" | "WORK" | "TRAVEL" | "EXAM" | "DAILY_LIFE" | "LATER">("LATER");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const totalLangues = natal.length + foreign.length;

  const submit = async () => {
    setErr(null);
    if (!prenom.trim()) return setErr(copy.errName);
    if (age < 3 || age > 12) return setErr(copy.errAge);
    if (!animal) return setErr(copy.errAnimal);
    // Gate 8B · univers doit être choisi AVANT langue.
    if (!universe) return setErr(copy.errUniverse);
    if (totalLangues === 0) return setErr(copy.errLang);
    setSubmitting(true);
    const langues = [
      ...natal.map((id) => ({ langue: id, type: "native" })),
      ...foreign.map((id) => ({ langue: id, type: "foreign" })),
    ];
    // Gate 8B · learningGoal Monde envoyé UNIQUEMENT si universe MONDE ·
    // Racines force null (le serveur normalise mais le client est propre).
    const learningGoal = universe === "MONDE" && goal !== "LATER" ? goal : null;
    try {
      const res = await fetch("/api/family/children", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prenom: prenom.trim(), age, avatarAnimal: animal, langues, learningGoal, universe }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(String(data.error ?? copy.errServer));
      } else {
        onCreated(data.child as Child);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="famille-dialog" role="dialog" aria-modal="true" aria-label={copy.step}>
      <div className="famille-dialog-inner">
        <p className="famille-kicker">{t(copy.step).toUpperCase()}</p>
        <label className="famille-field">
          <span className="famille-field-lbl">{t(copy.prenomLbl)}</span>
          <input
            type="text"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            maxLength={24}
            className="famille-input"
          />
        </label>
        <label className="famille-field">
          <span className="famille-field-lbl">{t(copy.ageLbl)}</span>
          <input
            type="number"
            min={3}
            max={12}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="famille-input"
          />
        </label>
        <div className="famille-field">
          <span className="famille-field-lbl">{t(copy.animalLbl)}</span>
          <div className="famille-animal-row" role="radiogroup" aria-label={copy.animalLbl}>
            {AVATAR_ANIMALS.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={animal === a}
                className={`famille-animal-pick ${animal === a ? "active" : ""}`}
                onClick={() => setAnimal(a)}
              >
                <AnimalAvatar animal={a} size={56} ariaLabel={loc === "en" ? ANIMAL_LABEL_EN[a] : ANIMAL_LABEL_FR[a]} />
              </button>
            ))}
          </div>
        </div>

        {/* Gate 8B · sélecteur univers EXPLICITE · brief §1 · aucune
            valeur par défaut · le parent doit choisir sciemment. Placé
            AVANT les langues pour éviter toute inférence implicite. */}
        <div className="famille-field" data-universe-selector>
          <span className="famille-field-lbl">{t(copy.universeLbl)}</span>
          <div className="famille-lang-list" role="radiogroup" aria-label={copy.universeLbl}>
            {([
              { id: "MONDE" as const, label: copy.universeMondeLabel, desc: copy.universeMondeDesc },
              { id: "RACINES" as const, label: copy.universeRacinesLabel, desc: copy.universeRacinesDesc },
            ]).map((u) => {
              const on = universe === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={`famille-lang-chip ${on ? "on" : ""}`}
                  onClick={() => setUniverse(u.id)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "10px 14px" }}
                >
                  <span className="famille-lang-name" style={{ fontWeight: 600 }}>{u.label}</span>
                  <span className="famille-lang-code" style={{ fontSize: 11, marginTop: 2 }}>{u.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Langues : deux groupes distincts pour poser la nuance côté
            parent (natale = maison ; étrangère = découverte). Côté
            enfant, la nuance disparaît (même monde chaleureux).
            Gate 8B · le choix de langue ne modifie JAMAIS universe. */}
        <div className="famille-field">
          <span className="famille-field-lbl">{t(copy.languesLbl)}</span>
          <p className="famille-help">{t(copy.languesHelp)}</p>

          <p className="famille-field-sublbl">{t(copy.nativeLbl)}</p>
          <div className="famille-lang-list">
            {NATAL_LANGS.map((l) => {
              const on = natal.includes(l.id);
              return (
                <button
                  key={l.id}
                  type="button"
                  className={`famille-lang-chip ${on ? "on" : ""}`}
                  onClick={() => toggle(natal, setNatal, l.id)}
                  aria-pressed={on}
                >
                  <span className="famille-lang-code">{l.code}</span>
                  <span className="famille-lang-name">{loc === "en" ? l.nameEn : l.name}</span>
                </button>
              );
            })}
          </div>

          <p className="famille-field-sublbl">{t(copy.foreignLbl)}</p>
          <div className="famille-lang-list">
            {FOREIGN_LANGS.map((l) => {
              const on = foreign.includes(l.id);
              return (
                <button
                  key={l.id}
                  type="button"
                  className={`famille-lang-chip ${on ? "on" : ""}`}
                  onClick={() => toggle(foreign, setForeign, l.id)}
                  aria-pressed={on}
                >
                  <span className="famille-lang-code">{l.code}</span>
                  <span className="famille-lang-name">{loc === "en" ? l.nameEn : l.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gate 8B · parcours Monde · visible UNIQUEMENT si universe MONDE
            (JAMAIS déduit de la langue · brief §1). Racines n'affiche
            jamais ce sélecteur. */}
        {universe === "MONDE" ? (
          <div className="famille-field" data-goal-field>
            <span className="famille-field-lbl">{t(copy.goalLbl)}</span>
            <p className="famille-help">{t(copy.goalHelp)}</p>
            <div className="famille-lang-list" role="radiogroup" aria-label={copy.goalLbl}>
              {(["STUDIES", "WORK", "TRAVEL", "EXAM", "DAILY_LIFE", "LATER"] as const).map((k) => {
                const on = goal === k;
                return (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={`famille-lang-chip ${on ? "on" : ""}`}
                    onClick={() => setGoal(k)}
                  >
                    <span className="famille-lang-name">{copy.goalOpts[k]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {err ? <p className="famille-err" role="alert">{err}</p> : null}
        <div className="famille-dialog-actions">
          <button type="button" className="famille-btn ghost" onClick={onCancel}>{copy.cancel}</button>
          <button
            type="button"
            className="famille-btn primary"
            onClick={submit}
            /* Gate 8B · submit désactivé tant qu'universe n'est pas choisi
               (brief §1 · aucune valeur par défaut). */
            disabled={submitting || !universe}
          >
            {copy.create}
          </button>
        </div>
      </div>
    </div>
  );
}
