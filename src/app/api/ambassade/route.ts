import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { callAI } from "@/lib/ai/provider";
import type { ChatMessage } from "@/lib/ai/types";
import type { AmbassadeRequest, AmbassadeResponse, AmbassadeError, HistoryItem } from "@/types/ambassade";

// ── Per-user in-memory rate limiter ─────────────────────────────────────────
// Module-level Map shared within one serverless instance.
// Auth users: 20 requests / 5 min. Anonymous: 5 requests / 5 min.

const RL = new Map<string, { count: number; windowStart: number }>();
const RL_WINDOW_MS = 5 * 60 * 1000;
const RL_MAX_AUTH = 20;
const RL_MAX_ANON = 5;

function isRateLimited(key: string, max: number): boolean {
  const now = Date.now();
  // Prune old entries to avoid unbounded growth
  for (const [k, v] of RL) {
    if (now - v.windowStart > RL_WINDOW_MS) RL.delete(k);
  }
  const entry = RL.get(key);
  if (!entry || now - entry.windowStart > RL_WINDOW_MS) {
    RL.set(key, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= max) return true;
  entry.count++;
  return false;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  // ─── Auth ───
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  );
  const { data: { user } } = await supabase.auth.getUser();

  // ─── Per-user rate limit ───
  const rlKey = user?.id ?? (request.headers.get("x-forwarded-for") ?? "anon").split(",")[0].trim();
  const rlMax = user ? RL_MAX_AUTH : RL_MAX_ANON;
  const limited = isRateLimited(rlKey, rlMax);

  console.info("[ambassade] request", {
    hasUser: !!user,
    rlKey: user ? `user:${user.id.slice(0, 8)}` : "anon",
    limited,
  });

  if (limited) {
    const locale = (() => {
      try { return (request.headers.get("accept-language") ?? "").startsWith("en") ? "en" : "fr"; }
      catch { return "fr"; }
    })();
    return errorResponse("RATE_LIMIT", locale === "en"
      ? "You sent several messages very quickly. Wait a few seconds, then try again."
      : "Tu as envoyé plusieurs messages très vite. Attends quelques secondes, puis réessaie.", 429);
  }

  // ─── Parse body ───
  let body: AmbassadeRequest;
  try {
    body = await request.json();
  } catch {
    return errorResponse("AI_ERROR", "Invalid request body.", 400);
  }
  const { message, scenario, niveau, locale = "fr", history } = body;

  if (!message?.trim() || !scenario || !niveau) {
    return errorResponse("AI_ERROR", "Paramètres manquants.", 400);
  }

  const systemPrompt = buildSystemPrompt(scenario, niveau, locale);

  // ─── Call AI ───
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
    console.info("[ambassade] AI ok", { provider: result.provider });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Log without leaking key content
    console.error("[ambassade] AI error", { message: msg.slice(0, 120) });

    // Config error: missing or invalid API key — show unavailable, not rate limit
    const isConfigError =
      msg.toLowerCase().includes("not set") ||
      msg.toLowerCase().includes("api key") ||
      msg.toLowerCase().includes("api_key") ||
      msg.toLowerCase().includes("invalid key") ||
      msg.toLowerCase().includes("invalid_api_key");

    // Provider rate limit: OpenAI 429, Gemini RESOURCE_EXHAUSTED, etc.
    const isProviderRateLimit =
      !isConfigError && (
        msg.includes("429") ||
        msg.toLowerCase().includes("rate limit") ||
        msg.toLowerCase().includes("too many requests") ||
        msg.toLowerCase().includes("quota") ||
        msg.toLowerCase().includes("resource_exhausted")
      );

    if (isProviderRateLimit) {
      return errorResponse("RATE_LIMIT", locale === "en"
        ? "You sent several messages very quickly. Wait a few seconds, then try again."
        : "Tu as envoyé plusieurs messages très vite. Attends quelques secondes, puis réessaie.", 429);
    }

    return errorResponse("AI_ERROR", locale === "en"
      ? "The AI coach is not available right now. Please try again in a moment."
      : "Le coach IA n'est pas disponible pour le moment. Réessaie dans quelques instants.", 502);
  }

  // ─── Parse AI response ───
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
    console.error("[ambassade] parse error", { rawLength: rawText.length });
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
