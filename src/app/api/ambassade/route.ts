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
  const { message, scenario, niveau, history } = body;

  if (!message?.trim() || !scenario || !niveau) {
    return errorResponse("GEMINI_ERROR", "Paramètres manquants.", 400);
  }

  const systemPrompt = buildSystemPrompt(scenario, niveau);

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
      return errorResponse("RATE_LIMIT", "Limite de requêtes atteinte. Réessaie dans quelques secondes.", 429);
    }
    return errorResponse("GEMINI_ERROR", "Erreur du service IA. Réessaie.", 502);
  }

  let parsed: AmbassadeResponse;
  try {
    parsed = JSON.parse(rawText);
    if (!parsed.agentResponseDE || !parsed.translationFR || !parsed.evaluation) {
      throw new Error("Champs manquants");
    }
    parsed.evaluation.grammar   = Math.min(10, Math.max(0, parsed.evaluation.grammar));
    parsed.evaluation.relevance = Math.min(10, Math.max(0, parsed.evaluation.relevance));
    parsed.evaluation.vocabulary = Math.min(10, Math.max(0, parsed.evaluation.vocabulary));
    parsed.evaluation.global    = Math.min(10, Math.max(0, parsed.evaluation.global));
    parsed.visaDecision = parsed.visaDecision ?? "pending";
  } catch {
    return errorResponse("PARSE_ERROR", "Réponse du modèle invalide. Réessaie.", 502);
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
