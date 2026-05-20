import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ChatMessage, AICallOptions, AICallResult } from "./types";
import { DEFAULT_GEMINI_MODEL } from "./types";

function toGeminiHistory(history: ChatMessage[]) {
  return history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

export async function geminiChat(opts: AICallOptions): Promise<AICallResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const model = process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: opts.systemPrompt,
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      responseMimeType: "application/json",
    },
  });

  const chat = geminiModel.startChat({ history: toGeminiHistory(opts.history ?? []) });
  const result = await chat.sendMessage(opts.userMessage);
  const text = result.response.text();
  return { text, provider: "gemini" };
}
