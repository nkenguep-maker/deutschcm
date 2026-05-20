import OpenAI from "openai";
import type { ChatMessage, AICallOptions, AICallResult } from "./types";
import { DEFAULT_OPENAI_MODEL } from "./types";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

function toOpenAIHistory(history: ChatMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
  return history.map((m) => ({ role: m.role, content: m.content }));
}

export async function openaiChat(opts: AICallOptions): Promise<AICallResult> {
  const client = getClient();
  const model = process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: opts.systemPrompt },
    ...toOpenAIHistory(opts.history ?? []),
    { role: "user", content: opts.userMessage },
  ];

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: opts.temperature ?? 0.4,
    response_format: { type: "json_object" },
    ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
  });

  const text = response.choices[0]?.message?.content ?? "";
  return { text, provider: "openai" };
}
