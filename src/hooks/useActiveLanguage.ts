"use client";

import { useCallback, useEffect, useState } from "react";
import { getLanguage, type Language } from "@/lib/languages";

// useActiveLanguage · lit la langue active du compte depuis
// user_metadata.activeLanguage (miroir DB non requis, choix client).
// Fallback : "deutsch" (allemand — première langue disponible).
//
// setActiveLanguage(id) persiste via /api/language/switch et met à jour
// l'état local pour re-render immédiat.

interface State {
  language: Language;
  loading: boolean;
  supportedIds: string[];
}

export function useActiveLanguage() {
  const [state, setState] = useState<State>({
    language: getLanguage("deutsch"),
    loading: true,
    supportedIds: [],
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        const id = d?.activeLanguage ?? "deutsch";
        // supportedLanguages : liste des langues que l'utilisateur suit
        // ou enseigne. Aujourd'hui, si absente, on retourne juste la
        // langue de base pour la démo.
        const supported: string[] = Array.isArray(d?.supportedLanguages)
          ? d.supportedLanguages
          : [id];
        setState({
          language: getLanguage(id),
          loading: false,
          supportedIds: supported,
        });
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setActiveLanguage = useCallback(async (id: string) => {
    const lang = getLanguage(id);
    setState((s) => ({ ...s, language: lang }));
    try {
      await fetch("/api/language/switch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ languageId: id }),
      });
    } catch {
      // silencieux — le choix local reste, la persistance retentera
      // au prochain call
    }
  }, []);

  return { ...state, setActiveLanguage };
}
