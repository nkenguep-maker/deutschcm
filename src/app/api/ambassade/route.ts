import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import type { AmbassadeRequest, AmbassadeResponse, AmbassadeError } from "@/types/ambassade";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function errorResponse(code: AmbassadeError["code"], message: string, status: number) {
  return NextResponse.json({ code, message } satisfies AmbassadeError, { status });
}

export async function POST(request: NextRequest) {
  const body: AmbassadeRequest = await request.json();
  const { message, scenario, niveau, history } = body;

  if (!message?.trim() || !scenario || !niveau) {
    return errorResponse("GEMINI_ERROR", "Paramètres manquants.", 400);
  }

  const systemInstruction = buildSystemPrompt(scenario, niveau);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
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
    model: "gemini-2.5-flash",
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
}
