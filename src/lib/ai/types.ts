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

function resolveProvider(envVal: string | undefined, defaultProvider: ProviderName): ProviderName {
  if (envVal === "openai" || envVal === "gemini") return envVal;
  return defaultProvider;
}

export function getProviderForFeature(feature: AIFeature): ProviderName {
  const override = process.env.AI_PROVIDER_OVERRIDE;
  if (override === "openai" || override === "gemini") return override;

  switch (feature) {
    case "simulator":  return resolveProvider(process.env.SIMULATOR_AI_PROVIDER, "openai");
    case "speech":     return resolveProvider(process.env.SPEECH_AI_PROVIDER, "openai");
    case "writing":    return resolveProvider(process.env.WRITING_AI_PROVIDER, "openai");
    case "quiz":       return resolveProvider(process.env.QUIZ_AI_PROVIDER, "openai");
    case "level-test": return resolveProvider(process.env.LEVEL_TEST_AI_PROVIDER, "openai");
    case "course-gen": return "gemini";
    default:           return "gemini";
  }
}

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
export const DEFAULT_GEMINI_MODEL = "gemini-1.5-pro";
