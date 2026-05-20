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
  // Ref-based loading guard prevents concurrent calls even if state hasn't re-rendered yet
  const isLoadingRef = useRef(false);

  const setLoadingState = (val: boolean) => {
    isLoadingRef.current = val;
    setIsLoading(val);
  };

  const resetSession = useCallback(() => {
    setMessages([]);
    setLoadingState(false);
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
      if (!text.trim() || concluded || isLoadingRef.current) return;

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
      setLoadingState(true);
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
        setLoadingState(false);
      }
    },
    [scenario, niveau, locale, concluded]
  );

  const startInterview = useCallback(async () => {
    // Guard: prevent duplicate calls from double-click or React Strict Mode
    if (historyRef.current.length > 0 || isLoadingRef.current) return;

    setLoadingState(true);
    setError(null);

    try {
      const startMsg = locale === "en"
        ? "Hello, I would like to start practicing."
        : "Bonjour, je voudrais commencer à pratiquer.";

      const res = await fetch("/api/ambassade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: startMsg,
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

      historyRef.current = [
        { role: "user", parts: [{ text: startMsg }] },
        { role: "model", parts: [{ text: data.agentResponseDE }] },
      ];
    } catch {
      setError({
        code: "AI_ERROR",
        message: locale === "en"
          ? "The AI coach is not available right now. Please try again in a moment."
          : "Le coach IA n'est pas disponible pour le moment. Réessaie dans quelques instants.",
      });
    } finally {
      setLoadingState(false);
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
