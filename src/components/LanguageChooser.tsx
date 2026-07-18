"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useActiveLanguage } from "@/hooks/useActiveLanguage";
import { FOREIGN, NATIVE, type Language } from "@/lib/languages";
import { frTypo } from "@/components/landing/typo";

// LanguageChooser · dropdown Kaffeehaus pour choisir la langue active.
// UX proche du SpaceSwitcher :
//   · trigger : puce brass avec code 2-lettres + nom langue
//   · menu   : 2 sections (Étrangères A1→C1, Natales É1→É5) avec
//              le status affiché (disponible / bientôt)
//   · click sur une langue → persistance via /api/language/switch,
//     hard reload de la page pour recharger le contexte (spine,
//     territoire, copy) proprement.

export function LanguageChooser() {
  const { language, loading, setActiveLanguage } = useActiveLanguage();
  const locale = useLocale();
  const t = useTranslations("space");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (loading) return null;

  const label = (l: Language) => (locale === "en" ? l.nameEn : l.name);
  const applyTypo = (s: string) => (locale === "fr" ? frTypo(s) : s);

  const statusLabel: Record<Language["status"], string> = locale === "en"
    ? { live: "Available", next: "Next", soon: "Soon" }
    : { live: "Disponible", next: "Bientôt", soon: "À venir" };

  const pick = async (l: Language) => {
    if (l.id === language.id) {
      setOpen(false);
      return;
    }
    if (l.status !== "live") {
      // pas d'action si non dispo — retour visuel simple
      setOpen(false);
      return;
    }
    await setActiveLanguage(l.id);
    // Hard reload : plusieurs composants du shell (dashboard, spine)
    // lisent activeLanguage au mount. Un reload garantit une hydratation
    // fraîche partout.
    window.location.reload();
  };

  const langAria = locale === "en"
    ? `Change learning language. Current: ${language.nameEn}`
    : `Changer la langue d'apprentissage. Actuelle : ${language.name}`;

  return (
    <div ref={ref} className="lang-chooser">
      <button
        type="button"
        className="lang-chooser-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={langAria}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="lang-chooser-code" aria-hidden="true">{language.code}</span>
        <span className="lang-chooser-name">{applyTypo(label(language))}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path
            d="M2 4 L5 7 L8 4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="lang-chooser-menu" role="listbox" aria-label={t("menuAria")}>
          <div className="lang-chooser-section">
            <p className="lang-chooser-section-lbl">
              {locale === "en" ? "Foreign · CEFR A1→C1" : "Étrangères · CECRL A1→C1"}
            </p>
            {FOREIGN.map((l) => (
              <LangItem key={l.id} lang={l} active={l.id === language.id}
                        label={applyTypo(label(l))}
                        status={statusLabel[l.status]}
                        disabled={l.status !== "live"}
                        onPick={() => pick(l)} />
            ))}
          </div>
          <div className="lang-chooser-section lang-chooser-section-sources">
            <p className="lang-chooser-section-lbl">
              {locale === "en" ? "Native · YEMA É1→É5" : "Natales · YEMA É1→É5"}
            </p>
            {NATIVE.map((l) => (
              <LangItem key={l.id} lang={l} active={l.id === language.id}
                        label={applyTypo(label(l))}
                        status={statusLabel[l.status]}
                        disabled={l.status !== "live"}
                        onPick={() => pick(l)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LangItem({ lang, active, label, status, disabled, onPick }: {
  lang: Language;
  active: boolean;
  label: string;
  status: string;
  disabled: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      aria-disabled={disabled}
      className={`lang-chooser-item ${active ? "active" : ""} ${disabled ? "off" : ""}`}
      onClick={onPick}
      disabled={disabled && !active}
    >
      <span className="lang-chooser-item-code" aria-hidden="true">{lang.code}</span>
      <span className="lang-chooser-item-lbl">{label}</span>
      <span className={`lang-chooser-item-status ${lang.status}`}>{status}</span>
    </button>
  );
}
