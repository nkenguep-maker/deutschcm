export type ScenarioType =
  | "visa_etudiant"
  | "visa_travail"
  | "visa_touriste"
  | "visa_famille"
  | "renouvellement";

export type NiveauType = "A2" | "B1" | "B2" | "C1";

export type VisaDecision = "pending" | "approved" | "rejected";

export interface EvaluationScore {
  grammar: number;
  relevance: number;
  vocabulary: number;
  global: number;
}

export interface AmbassadeResponse {
  agentResponseDE: string;
  translationFR: string;
  evaluation: EvaluationScore;
  pedagogicalTip: string;
  interviewConcluded: boolean;
  visaDecision: VisaDecision;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "agent";
  textDE: string;
  translationFR: string;
  evaluation?: EvaluationScore;
  pedagogicalTip?: string;
  timestamp: Date;
}

export interface HistoryItem {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export interface AmbassadeRequest {
  message: string;
  scenario: ScenarioType;
  niveau: NiveauType;
  history: HistoryItem[];
}

export type AmbassadeErrorCode = "RATE_LIMIT" | "PARSE_ERROR" | "GEMINI_ERROR";

export interface AmbassadeError {
  code: AmbassadeErrorCode;
  message: string;
}

export interface AmbassadeScenario {
  id: ScenarioType;
  label: string;
  description: string;
  icon: string;
  defaultLevel: NiveauType;
  legalRef: string;
}

export const SCENARIOS: AmbassadeScenario[] = [
  {
    id: "visa_etudiant",
    label: "Visa Étudiant",
    description: "Demande de visa pour études",
    icon: "🎓",
    defaultLevel: "B1",
    legalRef: "§16b AufenthG",
  },
  {
    id: "visa_travail",
    label: "Visa Travail",
    description: "Visa pour emploi qualifié",
    icon: "💼",
    defaultLevel: "B2",
    legalRef: "§18 AufenthG",
  },
  {
    id: "visa_touriste",
    label: "Visa Touriste",
    description: "Visa Schengen court séjour",
    icon: "✈️",
    defaultLevel: "A2",
    legalRef: "§6 AufenthG",
  },
  {
    id: "visa_famille",
    label: "Regroupement Familial",
    description: "Rejoindre un conjoint en Allemagne",
    icon: "👨‍👩‍👧",
    defaultLevel: "B2",
    legalRef: "§27 AufenthG",
  },
  {
    id: "renouvellement",
    label: "Renouvellement",
    description: "Prolonger un titre de séjour",
    icon: "🔄",
    defaultLevel: "B1",
    legalRef: "§8 AufenthG",
  },
];

export const NIVEAUX: NiveauType[] = ["A2", "B1", "B2", "C1"];
