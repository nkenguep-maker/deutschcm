"use client";

// AddChildDialog · extrait de l'ancien /famille pour préserver la parité
// fonctionnelle sur la route canonique /family. Aucune modification de
// logique métier · POST canonique /api/family/children · sélecteur univers
// EXPLICITE (Gate 8B) · learningGoal uniquement MONDE (Lot 7B.2).

import { useState } from "react";
import {
  AnimalAvatar,
  AVATAR_ANIMALS,
  ANIMAL_LABEL_FR,
  ANIMAL_LABEL_EN,
  type AvatarAnimal,
} from "@/components/famille/AnimalAvatar";
import { frTypo } from "@/components/landing/typo";
import { LANGUAGES } from "@/lib/languages";
import type { ChildLangue } from "@/lib/childScales";

const NATAL_LANGS = Object.values(LANGUAGES).filter((l) => l.territory === "sources");
const FOREIGN_LANGS = Object.values(LANGUAGES).filter((l) => l.territory === "world");

export type AddChildDialogCopy = {
  step: string;
  prenomLbl: string;
  ageLbl: string;
  animalLbl: string;
  universeLbl: string;
  universeMondeLabel: string;
  universeMondeDesc: string;
  universeRacinesLabel: string;
  universeRacinesDesc: string;
  languesLbl: string;
  languesHelp: string;
  nativeLbl: string;
  foreignLbl: string;
  goalLbl: string;
  goalHelp: string;
  goalOpts: {
    STUDIES: string;
    WORK: string;
    TRAVEL: string;
    EXAM: string;
    DAILY_LIFE: string;
    LATER: string;
  };
  cancel: string;
  create: string;
  errName: string;
  errAge: string;
  errAnimal: string;
  errLang: string;
  errUniverse: string;
  errServer: string;
};

export interface AddChildCreatedResult {
  id: string;
  prenom: string;
  avatarAnimal: AvatarAnimal;
  age: number;
  activeLangue: string | null;
  langues: ChildLangue[];
}

type Props = {
  loc: "fr" | "en";
  copy: AddChildDialogCopy;
  onCancel: () => void;
  onCreated: (child: AddChildCreatedResult) => void;
};

export function AddChildDialog({ loc, copy, onCancel, onCreated }: Props) {
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
    if (!universe) return setErr(copy.errUniverse);
    if (totalLangues === 0) return setErr(copy.errLang);
    setSubmitting(true);
    const langues = [
      ...natal.map((id) => ({ langue: id, type: "native" })),
      ...foreign.map((id) => ({ langue: id, type: "foreign" })),
    ];
    // Gate 8B · learningGoal Monde envoyé UNIQUEMENT si universe MONDE.
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
        onCreated(data.child as AddChildCreatedResult);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="famille-dialog"
      role="dialog"
      aria-modal="true"
      aria-label={copy.step}
      data-testid="add-child-dialog"
    >
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
            data-testid="add-child-prenom"
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
            valeur par défaut · le parent doit choisir sciemment. */}
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
                  data-testid={`add-child-universe-${u.id}`}
                >
                  <span className="famille-lang-name" style={{ fontWeight: 600 }}>{u.label}</span>
                  <span className="famille-lang-code" style={{ fontSize: 11, marginTop: 2 }}>{u.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

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

        {/* Gate 8B · parcours Monde · visible UNIQUEMENT si universe MONDE. */}
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

        {err ? <p className="famille-err" role="alert" data-testid="add-child-error">{err}</p> : null}
        <div className="famille-dialog-actions">
          <button
            type="button"
            className="famille-btn ghost"
            onClick={onCancel}
            data-testid="add-child-cancel"
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            className="famille-btn primary"
            onClick={submit}
            disabled={submitting || !universe}
            data-testid="add-child-submit"
          >
            {copy.create}
          </button>
        </div>
      </div>
    </div>
  );
}
