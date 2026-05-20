"use client";

import { useState, useRef, useCallback } from "react";
import type {
  ConversationMessage,
  ScenarioType,
  NiveauType,
  HistoryItem,
  AmbassadeError,
  AmbassadeResponse,
  SessionResult,
} from "@/types/ambassade";

export function useAmbassade(locale: "fr" | "en" = "fr") {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AmbassadeError | null>(null);
  const [concluded, setConcluded] = useState(false);
  const [sessionResult, setSessionResult] = useState<SessionResult>("in_progress");
  const [scenario, setScenarioState] = useState<ScenarioType>("visa_etudiant");
  const [niveau, setNiveauState] = useState<NiveauType>("A1");
  const historyRef = useRef<HistoryItem[]>([]);

  const resetSession = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    setError(null);
    setConcluded(false);
    setSessionResult("in_progress");
    historyRef.current = [];
  }, []);

  const setScenario = useCallback((s: ScenarioType) => {
    setScenarioState(s);
  }, []);

  const setNiveau = useCallback((n: NiveauType) => {
    setNiveauState(n);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || concluded) return;

      const userId = `${Date.now()}-user`;

      setMessages((prev) => [
        ...prev,
        {
          id: userId,
          role: "user",
          textDE: text,
          translation: "",
          timestamp: new Date(),
        },
      ]);
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/ambassade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            scenario,
            niveau,
            locale,
            history: historyRef.current,
          }),
        });

        if (!res.ok) {
          const err: AmbassadeError = await res.json();
          setError(err);
          setMessages((prev) => prev.filter((m) => m.id !== userId));
          return;
        }

        const data: AmbassadeResponse = await res.json();

        setMessages((prev) =>
          prev.map((m) =>
            m.id === userId
              ? {
                  ...m,
                  evaluation: data.evaluation,
                  pedagogicalTip: data.pedagogicalTip,
                  correctionDE: data.correctionDE,
                }
              : m
          )
        );

        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-agent`,
            role: "agent",
            textDE: data.agentResponseDE,
            translation: data.translation,
            timestamp: new Date(),
          },
        ]);

        historyRef.current = [
          ...historyRef.current,
          { role: "user", parts: [{ text }] },
          { role: "model", parts: [{ text: data.agentResponseDE }] },
        ];

        if (data.sessionConcluded) {
          setConcluded(true);
          setSessionResult(data.sessionResult);
        }
      } catch {
        setError({
          code: "AI_ERROR",
          message: locale === "en"
            ? "Connection error. Check your internet connection."
            : "Erreur de connexion. Vérifie ta connexion internet.",
        });
        setMessages((prev) => prev.filter((m) => m.id !== userId));
      } finally {
        setIsLoading(false);
      }
    },
    [scenario, niveau, locale, concluded]
  );

  const startInterview = useCallback(async () => {
    if (historyRef.current.length > 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ambassade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: locale === "en"
            ? "Hello, I would like to start practicing."
            : "Bonjour, je voudrais commencer à pratiquer.",
          scenario,
          niveau,
          locale,
          history: [],
        }),
      });

      if (!res.ok) {
        const err: AmbassadeError = await res.json();
        setError(err);
        return;
      }

      const data: AmbassadeResponse = await res.json();

      setMessages([
        {
          id: `${Date.now()}-agent`,
          role: "agent",
          textDE: data.agentResponseDE,
          translation: data.translation,
          timestamp: new Date(),
        },
      ]);

      const startMsg = locale === "en"
        ? "Hello, I would like to start practicing."
        : "Bonjour, je voudrais commencer à pratiquer.";

      historyRef.current = [
        { role: "user", parts: [{ text: startMsg }] },
        { role: "model", parts: [{ text: data.agentResponseDE }] },
      ];
    } catch {
      setError({
        code: "AI_ERROR",
        message: locale === "en"
          ? "Unable to start the session."
          : "Impossible de démarrer l'entretien.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [scenario, niveau, locale]);

  return {
    messages,
    isLoading,
    error,
    concluded,
    sessionResult,
    scenario,
    niveau,
    sendMessage,
    resetSession,
    setScenario,
    setNiveau,
    startInterview,
  };
}
