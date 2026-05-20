export type ScenarioType =
  | "visa_etudiant"
  | "visa_travail"
  | "visa_touriste"
  | "visa_famille"
  | "renouvellement";

export type NiveauType = "A1" | "A2" | "B1" | "B2" | "C1";

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
}

export const SCENARIOS: AmbassadeScenario[] = [
  {
    id: "visa_etudiant",
    label: "Études en Allemagne",
    description: "Présentez votre projet d'études et répondez à des questions simples.",
    icon: "🎓",
    defaultLevel: "B1",
  },
  {
    id: "visa_travail",
    label: "Travail et carrière",
    description: "Parlez de votre expérience, de vos objectifs et de votre parcours.",
    icon: "💼",
    defaultLevel: "B1",
  },
  {
    id: "visa_touriste",
    label: "Voyage et quotidien",
    description: "Pratiquez des situations utiles pour voyager et vivre au quotidien.",
    icon: "✈️",
    defaultLevel: "A1",
  },
  {
    id: "visa_famille",
    label: "Famille et intégration",
    description: "Expliquez votre situation personnelle et vos liens familiaux.",
    icon: "👨‍👩‍👧",
    defaultLevel: "A2",
  },
  {
    id: "renouvellement",
    label: "Démarches administratives",
    description: "Préparez des échanges simples autour de documents, rendez-vous et formalités.",
    icon: "📋",
    defaultLevel: "A2",
  },
];

export const NIVEAUX: NiveauType[] = ["A1", "A2", "B1", "B2", "C1"];
