import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { callAI } from "@/lib/ai/provider";
import type { ChatMessage } from "@/lib/ai/types";
import type { AmbassadeRequest, AmbassadeResponse, AmbassadeError, HistoryItem } from "@/types/ambassade";

function errorResponse(code: AmbassadeError["code"], message: string, status: number) {
  return NextResponse.json({ code, message } satisfies AmbassadeError, { status });
}

function historyToMessages(history: HistoryItem[]): ChatMessage[] {
  return history.map((h) => ({
    role: h.role === "model" ? "assistant" : "user",
    content: h.parts.map((p) => p.text).join(""),
  }));
}

// ── Deterministic grammar guardrail ─────────────────────────────────────────

function fixA1Grammar(text: string): string {
  return text
    .replace(/\bich\s+ist\b/gi,   "ich bin")
    .replace(/\bich\s+bist\b/gi,  "ich bin")
    .replace(/\bich\s+sind\b/gi,  "ich bin")
    .replace(/\bich\s+seid\b/gi,  "ich bin")
    .replace(/\bdu\s+bin\b/gi,    "du bist")
    .replace(/\bdu\s+ist\b/gi,    "du bist")
    .replace(/\bdu\s+sind\b/gi,   "du bist")
    .replace(/\bdu\s+seid\b/gi,   "du bist")
    .replace(/\ber\s+bin\b/gi,    "er ist")
    .replace(/\ber\s+bist\b/gi,   "er ist")
    .replace(/\ber\s+sind\b/gi,   "er ist")
    .replace(/\ber\s+seid\b/gi,   "er ist")
    .replace(/\bsie\s+bin\b/gi,   "sie ist")
    .replace(/\bsie\s+bist\b/gi,  "sie ist")
    .replace(/\bsie\s+seid\b/gi,  "sie ist")
    .replace(/\bes\s+bin\b/gi,    "es ist")
    .replace(/\bes\s+bist\b/gi,   "es ist")
    .replace(/\bes\s+sind\b/gi,   "es ist")
    .replace(/\bwir\s+bin\b/gi,   "wir sind")
    .replace(/\bwir\s+bist\b/gi,  "wir sind")
    .replace(/\bwir\s+ist\b/gi,   "wir sind")
    .replace(/\bwir\s+seid\b/gi,  "wir sind")
    .replace(/\bihr\s+bin\b/gi,   "ihr seid")
    .replace(/\bihr\s+bist\b/gi,  "ihr seid")
    .replace(/\bihr\s+ist\b/gi,   "ihr seid")
    .replace(/\bihr\s+sind\b/gi,  "ihr seid")
    .replace(/\bich\s+hat\b/gi,   "ich habe")
    .replace(/\bich\s+hast\b/gi,  "ich habe")
    .replace(/\bich\s+habt\b/gi,  "ich habe")
    .replace(/\bich\s+haben\b/gi, "ich habe")
    .replace(/\bdu\s+habe\b/gi,   "du hast")
    .replace(/\bdu\s+hat\b/gi,    "du hast")
    .replace(/\bdu\s+habt\b/gi,   "du hast")
    .replace(/\bdu\s+haben\b/gi,  "du hast")
    .replace(/\ber\s+habe\b/gi,   "er hat")
    .replace(/\ber\s+hast\b/gi,   "er hat")
    .replace(/\ber\s+habt\b/gi,   "er hat")
    .replace(/\ber\s+haben\b/gi,  "er hat")
    .replace(/\bsie\s+habe\b/gi,  "sie hat")
    .replace(/\bsie\s+hast\b/gi,  "sie hat")
    .replace(/\bsie\s+habt\b/gi,  "sie hat")
    .replace(/\bwir\s+habe\b/gi,  "wir haben")
    .replace(/\bwir\s+hast\b/gi,  "wir haben")
    .replace(/\bwir\s+hat\b/gi,   "wir haben")
    .replace(/\bwir\s+habt\b/gi,  "wir haben")
    .replace(/\bihr\s+habe\b/gi,  "ihr habt")
    .replace(/\bihr\s+hast\b/gi,  "ihr habt")
    .replace(/\bihr\s+hat\b/gi,   "ihr habt")
    .replace(/\bihr\s+haben\b/gi, "ihr habt");
}

function applyGuardrails(parsed: AmbassadeResponse): AmbassadeResponse {
  if (typeof parsed.agentResponseDE === "string") {
    parsed.agentResponseDE = fixA1Grammar(parsed.agentResponseDE);
  }
  if (parsed.correctionDE && typeof parsed.correctionDE.corrected === "string") {
    parsed.correctionDE.corrected = fixA1Grammar(parsed.correctionDE.corrected);
  }
  return parsed;
}

// ────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ─── Auth + daily quota ───
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const profile = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true, plan: true } });
    if (profile) {
      const today = new Date().toDateString();
      const sessionCount = await prisma.conversationSession.count({
        where: { userId: profile.id, startedAt: { gte: new Date(today) } }
      });
      const limit = profile.plan === "FREE" ? 3 : profile.plan === "BASIC" ? 10 : 999;
      if (sessionCount >= limit) {
        return NextResponse.json({ error: "Limite journalière atteinte", limit, plan: profile.plan, upgradeUrl: "/pricing" }, { status: 429 });
      }
    }
  }

  const body: AmbassadeRequest = await request.json();
  const { message, scenario, niveau, locale = "fr", history } = body;

  if (!message?.trim() || !scenario || !niveau) {
    return errorResponse("AI_ERROR", "Paramètres manquants.", 400);
  }

  const systemPrompt = buildSystemPrompt(scenario, niveau, locale);

  let rawText = "";
  try {
    const result = await callAI({
      feature: "simulator",
      systemPrompt,
      userMessage: message,
      history: historyToMessages(history),
      temperature: 0.4,
    });
    rawText = result.text;
  } catch (err: unknown) {
    console.error("AI provider error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate")) {
      return errorResponse("RATE_LIMIT", locale === "en"
        ? "Request limit reached. Please try again in a few seconds."
        : "Limite de requêtes atteinte. Réessaie dans quelques secondes.", 429);
    }
    return errorResponse("AI_ERROR", locale === "en"
      ? "AI service unavailable. Please try again."
      : "Erreur du service IA. Réessaie.", 502);
  }

  let parsed: AmbassadeResponse;
  try {
    const raw = JSON.parse(rawText.replace(/```json|```/g, "").trim()) as AmbassadeResponse;

    if (!raw.agentResponseDE || !raw.translation || !raw.evaluation) {
      throw new Error("Missing required fields");
    }

    raw.evaluation.grammar    = Math.min(10, Math.max(0, raw.evaluation.grammar ?? 0));
    raw.evaluation.relevance  = Math.min(10, Math.max(0, raw.evaluation.relevance ?? 0));
    raw.evaluation.vocabulary = Math.min(10, Math.max(0, raw.evaluation.vocabulary ?? 0));
    raw.evaluation.global     = Math.min(10, Math.max(0, raw.evaluation.global ?? 0));

    raw.sessionConcluded = raw.sessionConcluded ?? false;
    raw.sessionResult    = raw.sessionResult ?? "in_progress";

    if (!raw.correctionDE) {
      raw.correctionDE = { original: message, corrected: message, wasCorrect: true, grammarNote: "" };
    }
    raw.correctionDE.wasCorrect  = raw.correctionDE.wasCorrect ?? true;
    raw.correctionDE.grammarNote = raw.correctionDE.grammarNote ?? "";

    raw.pedagogicalTip = raw.pedagogicalTip ?? "";

    parsed = applyGuardrails(raw);
  } catch {
    return errorResponse("PARSE_ERROR", locale === "en"
      ? "Invalid model response. Please try again."
      : "Réponse du modèle invalide. Réessaie.", 502);
  }

  return NextResponse.json(parsed);
}

export async function GET() {
  const { getProviderForFeature } = await import("@/lib/ai/types");
  return NextResponse.json({
    status: "ok",
    provider: getProviderForFeature("simulator"),
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
}
