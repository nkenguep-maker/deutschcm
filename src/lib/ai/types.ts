export type AIFeature = "simulator" | "speech" | "writing" | "quiz" | "level-test" | "course-gen";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AICallOptions {
  feature: AIFeature;
  systemPrompt: string;
  userMessage: string;
  history?: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AICallResult {
  text: string;
  provider: "openai" | "gemini";
}

export type ProviderName = "openai" | "gemini";

export function getProviderForFeature(feature: AIFeature): ProviderName {
  const env = process.env.AI_PROVIDER_OVERRIDE;
  if (env === "openai" || env === "gemini") return env;

  switch (feature) {
    case "simulator":
      return (process.env.SIMULATOR_AI_PROVIDER as ProviderName | undefined) ?? "openai";
    case "speech":
      return (process.env.SPEECH_AI_PROVIDER as ProviderName | undefined) ?? "openai";
    case "writing":
      return (process.env.WRITING_AI_PROVIDER as ProviderName | undefined) ?? "openai";
    case "level-test":
      return (process.env.LEVEL_TEST_AI_PROVIDER as ProviderName | undefined) ?? "openai";
    case "course-gen":
      return "gemini";
    default:
      return "gemini";
  }
}

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
export const DEFAULT_GEMINI_MODEL = "gemini-1.5-pro";
