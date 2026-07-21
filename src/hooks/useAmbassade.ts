"use client";

import { useState, useCallback } from "react";
import type {
  ConversationMessage,
  ScenarioType,
  NiveauType,
  AmbassadeError,
  SessionResult,
} from "@/types/ambassade";

// Feature IA supprimée (AUDIT.md §11).
// Le hook conserve son API pour ne pas casser les imports résiduels,
// mais aucun appel réseau n'est plus émis vers /api/ambassade.

export function useAmbassade(locale: "fr" | "en" = "fr") {
  const [messages] = useState<ConversationMessage[]>([]);
  const [isLoading] = useState(false);
  const [error, setError] = useState<AmbassadeError | null>(null);
  const [concluded] = useState(false);
  const [sessionResult] = useState<SessionResult>("in_progress");
  const [scenario, setScenarioState] = useState<ScenarioType>("visa_etudiant");
  const [niveau, setNiveauState] = useState<NiveauType>("A1");

  const gone = useCallback(() => {
    setError({
      code: "AI_ERROR",
      message: locale === "en"
        ? "This feature has been removed."
        : "Cette fonctionnalité a été supprimée.",
    });
  }, [locale]);

  return {
    messages,
    isLoading,
    error,
    concluded,
    sessionResult,
    scenario,
    niveau,
    sendMessage: async (_text: string) => { gone(); },
    resetSession: () => {},
    setScenario: (s: ScenarioType) => setScenarioState(s),
    setNiveau: (n: NiveauType) => setNiveauState(n),
    startInterview: async () => { gone(); },
  };
}
