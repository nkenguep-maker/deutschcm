"use client";

import { useState, useRef, useCallback } from "react";
import type {
  ConversationMessage,
  ScenarioType,
  NiveauType,
  HistoryItem,
  AmbassadeError,
  AmbassadeResponse,
  VisaDecision,
} from "@/types/ambassade";

export function useAmbassade() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AmbassadeError | null>(null);
  const [concluded, setConcluded] = useState(false);
  const [visaDecision, setVisaDecision] = useState<VisaDecision>("pending");
  const [scenario, setScenarioState] = useState<ScenarioType>("visa_etudiant");
  const [niveau, setNiveauState] = useState<NiveauType>("B1");
  const historyRef = useRef<HistoryItem[]>([]);

  const resetSession = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    setError(null);
    setConcluded(false);
    setVisaDecision("pending");
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
          translationFR: "",
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
              ? { ...m, evaluation: data.evaluation, pedagogicalTip: data.pedagogicalTip }
              : m
          )
        );

        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-agent`,
            role: "agent",
            textDE: data.agentResponseDE,
            translationFR: data.translationFR,
            timestamp: new Date(),
          },
        ]);

        historyRef.current = [
          ...historyRef.current,
          { role: "user", parts: [{ text }] },
          { role: "model", parts: [{ text: data.agentResponseDE }] },
        ];

        if (data.interviewConcluded) {
          setConcluded(true);
          setVisaDecision(data.visaDecision);
        }
      } catch {
        setError({ code: "GEMINI_ERROR", message: "Erreur de connexion. Vérifie ta connexion internet." });
        setMessages((prev) => prev.filter((m) => m.id !== userId));
      } finally {
        setIsLoading(false);
      }
    },
    [scenario, niveau, concluded]
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
          message: "Bonjour, je viens déposer ma demande de visa.",
          scenario,
          niveau,
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
          translationFR: data.translationFR,
          timestamp: new Date(),
        },
      ]);

      historyRef.current = [
        { role: "user", parts: [{ text: "Bonjour, je viens déposer ma demande de visa." }] },
        { role: "model", parts: [{ text: data.agentResponseDE }] },
      ];
    } catch {
      setError({ code: "GEMINI_ERROR", message: "Impossible de démarrer l'entretien." });
    } finally {
      setIsLoading(false);
    }
  }, [scenario, niveau]);

  return {
    messages,
    isLoading,
    error,
    concluded,
    visaDecision,
    scenario,
    niveau,
    sendMessage,
    resetSession,
    setScenario,
    setNiveau,
    startInterview,
  };
}
