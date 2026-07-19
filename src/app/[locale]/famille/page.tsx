"use client";

// /famille · sélecteur de profil « Qui apprend ce soir ? » + gestion
// des profils enfants sous compte parent. C'est la porte d'entrée de
// l'espace Famille. Un enfant est un ChildProfile — pas de compte,
// pas d'email, pas de mot de passe.
//
// Sécurité mineurs · seul le parent authentifié voit ses propres
// profils. L'ajout et la suppression passent par /api/family/children,
// qui résout parentUserId serveur-side.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { StateBlock } from "@/components/StateBlock";
import { frTypo } from "@/components/landing/typo";
import { AnimalAvatar, AVATAR_ANIMALS, ANIMAL_LABEL_FR, ANIMAL_LABEL_EN, type AvatarAnimal } from "@/components/famille/AnimalAvatar";
import { LANGUAGES } from "@/lib/languages";

interface Child {
  id: string;
  prenom: string;
  avatarAnimal: AvatarAnimal;
  age: number;
  langue: string;
  echelleYema: string;
  etoiles: number;
}

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
    step: "Nouveau profil",
    prenomLbl: "Prénom",
    ageLbl: "Âge",
    animalLbl: "Animal",
    langueLbl: "Langue à écouter",
    cancel: "Annuler",
    create: "Créer le profil",
    stars: (n: number) => (n <= 1 ? `${n} étoile` : `${n} étoiles`),
    level: "Niveau",
    errName: "Prénom manquant.",
    errAge: "Âge entre 3 et 12.",
    errAnimal: "Choisissez un animal.",
    errLang: "Choisissez une langue.",
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
    step: "New profile",
    prenomLbl: "First name",
    ageLbl: "Age",
    animalLbl: "Animal",
    langueLbl: "Language to listen to",
    cancel: "Cancel",
    create: "Create profile",
    stars: (n: number) => (n <= 1 ? `${n} star` : `${n} stars`),
    level: "Level",
    errName: "Name missing.",
    errAge: "Age between 3 and 12.",
    errAnimal: "Pick an animal.",
    errLang: "Pick a language.",
  },
};

/** Restreint aux langues « sources » (natales) — la formule Famille
 *  cible la transmission, pas les langues étrangères. */
const NATAL_LANGS = Object.values(LANGUAGES).filter((l) => l.territory === "sources");

export default function FamillePage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = COPY[loc];
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

  const [children, setChildren] = useState<Child[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

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
          {(children ?? []).map((child) => (
            <li key={child.id} className="famille-card-item">
              <Link href={`/${locale}/famille/enfant/${child.id}`} className="famille-card">
                <AnimalAvatar animal={child.avatarAnimal} size={112} ariaLabel={loc === "en" ? ANIMAL_LABEL_EN[child.avatarAnimal] : ANIMAL_LABEL_FR[child.avatarAnimal]} />
                <p className="famille-card-name">{child.prenom}</p>
                <p className="famille-card-meta">
                  {child.age} · {loc === "en" ? LANGUAGES[child.langue]?.nameEn : LANGUAGES[child.langue]?.name}
                </p>
                <p className="famille-card-stars">✦ {c.stars(child.etoiles)}</p>
              </Link>
            </li>
          ))}
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
    </main>
  );
}

// ── Dialogue Ajouter un enfant ─────────────────────────────────────
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
  const [langue, setLangue] = useState<string>(NATAL_LANGS[0]?.id ?? "bassa");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

  const submit = async () => {
    setErr(null);
    if (!prenom.trim()) return setErr(copy.errName);
    if (age < 3 || age > 12) return setErr(copy.errAge);
    if (!animal) return setErr(copy.errAnimal);
    if (!langue) return setErr(copy.errLang);
    setSubmitting(true);
    try {
      const res = await fetch("/api/family/children", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prenom: prenom.trim(), age, avatarAnimal: animal, langue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(String(data.error ?? "error"));
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
        <label className="famille-field">
          <span className="famille-field-lbl">{t(copy.langueLbl)}</span>
          <select
            value={langue}
            onChange={(e) => setLangue(e.target.value)}
            className="famille-select"
          >
            {NATAL_LANGS.map((l) => (
              <option key={l.id} value={l.id}>
                {loc === "en" ? l.nameEn : l.name}
              </option>
            ))}
          </select>
        </label>
        {err ? <p className="famille-err" role="alert">{err}</p> : null}
        <div className="famille-dialog-actions">
          <button type="button" className="famille-btn ghost" onClick={onCancel}>{copy.cancel}</button>
          <button type="button" className="famille-btn primary" onClick={submit} disabled={submitting}>
            {copy.create}
          </button>
        </div>
      </div>
    </div>
  );
}
