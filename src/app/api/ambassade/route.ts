import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import type { AmbassadeRequest, AmbassadeResponse, AmbassadeError } from "@/types/ambassade";

function errorResponse(code: AmbassadeError["code"], message: string, status: number) {
  return NextResponse.json({ code, message } satisfies AmbassadeError, { status });
}

export async function POST(request: NextRequest) {
  // ─── Auth + quota journalier ───
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

  const systemInstruction = buildSystemPrompt(scenario, niveau);

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    systemInstruction,
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  });

  const chat = model.startChat({
    history: history.map((h) => ({
      role: h.role,
      parts: h.parts,
    })),
  });

  let rawText = "";
  try {
    const result = await chat.sendMessage(message);
    rawText = result.response.text();
  } catch (err: unknown) {
    console.error("Gemini error details:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      return errorResponse("RATE_LIMIT", "Limite de requêtes atteinte. Réessaie dans quelques secondes.", 429);
    }
    return NextResponse.json({
      error: "Erreur Gemini",
      details: err instanceof Error ? err.message : String(err),
    }, { status: 502 });
  }

  let parsed: AmbassadeResponse;
  try {
    parsed = JSON.parse(rawText);
    if (!parsed.agentResponseDE || !parsed.translationFR || !parsed.evaluation) {
      throw new Error("Champs manquants");
    }
    parsed.evaluation.grammar = Math.min(10, Math.max(0, parsed.evaluation.grammar));
    parsed.evaluation.relevance = Math.min(10, Math.max(0, parsed.evaluation.relevance));
    parsed.evaluation.vocabulary = Math.min(10, Math.max(0, parsed.evaluation.vocabulary));
    parsed.evaluation.global = Math.min(10, Math.max(0, parsed.evaluation.global));
    parsed.visaDecision = parsed.visaDecision ?? "pending";
  } catch {
    return errorResponse("PARSE_ERROR", "Réponse du modèle invalide. Réessaie.", 502);
  }

  return NextResponse.json(parsed);
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    model: "gemini-1.5-pro",
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
}
