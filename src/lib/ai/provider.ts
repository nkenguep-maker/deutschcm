import type { AICallOptions, AICallResult } from "./types";
import { getProviderForFeature } from "./types";
import { openaiChat } from "./openai";
import { geminiChat } from "./gemini";

export async function callAI(opts: AICallOptions): Promise<AICallResult> {
  const provider = getProviderForFeature(opts.feature);

  if (provider === "openai") {
    try {
      return await openaiChat(opts);
    } catch (err) {
      console.error("[AI] OpenAI failed, falling back to Gemini:", err);
      return await geminiChat(opts);
    }
  }

  return await geminiChat(opts);
}
