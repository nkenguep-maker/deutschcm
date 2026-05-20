import type { AICallOptions, AICallResult } from "./types";
import { getProviderForFeature } from "./types";
import { openaiChat } from "./openai";
import { geminiChat } from "./gemini";

function isConfigError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return lower.includes("not set") || lower.includes("api_key") || lower.includes("api key") || lower.includes("invalid key");
}

export async function callAI(opts: AICallOptions): Promise<AICallResult> {
  const provider = getProviderForFeature(opts.feature);

  if (provider === "openai") {
    try {
      return await openaiChat(opts);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Config errors (missing/invalid key) should not silently fall back — propagate immediately
      if (isConfigError(msg)) {
        console.error("[AI] OpenAI config error — not falling back:", msg);
        throw err;
      }
      console.error("[AI] OpenAI error, trying Gemini fallback:", msg.slice(0, 120));
      return await geminiChat(opts);
    }
  }

  return await geminiChat(opts);
}
