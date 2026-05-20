import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai/provider";
import { fixA1Grammar } from "@/lib/ai/guardrails";

function applyGrammarGuardrail(analysis: Record<string, unknown>): Record<string, unknown> {
  if (typeof analysis.texte_corrige === "string") {
    analysis.texte_corrige = fixA1Grammar(analysis.texte_corrige);
  }
  if (Array.isArray(analysis.errors)) {
    analysis.errors = (analysis.errors as Record<string, unknown>[]).map((err) => {
      if (typeof err.correction === "string") {
        err.correction = fixA1Grammar(err.correction);
      }
      return err;
    });
  }
  return analysis;
}

const SYSTEM_PROMPT = `Tu es un correcteur expert en allemand pour apprenants CEFR francophones.
Tu DOIS toujours produire du texte allemand grammaticalement CORRECT.
Ne produis JAMAIS d'allemand incorrect dans tes corrections ou exemples.

══════════════════════════════════════════
CONJUGAISON CORRECTE — sein (être)
══════════════════════════════════════════
ich  → bin   (JAMAIS ist, bist, sind, seid)
du   → bist  (JAMAIS bin, ist, sind, seid)
er/sie/es → ist  (JAMAIS bin, bist, sind, seid)
wir  → sind  (JAMAIS bin, bist, ist, seid)
ihr  → seid  (JAMAIS bin, bist, ist, sind)
sie/Sie → sind (JAMAIS bin, bist, ist, seid)

══════════════════════════════════════════
CONJUGAISON CORRECTE — haben (avoir)
══════════════════════════════════════════
ich  → habe  (JAMAIS hat, hast, habt, haben)
du   → hast  (JAMAIS habe, hat, habt, haben)
er/sie/es → hat (JAMAIS habe, hast, habt, haben)
wir  → haben (JAMAIS habe, hast, hat, habt)
ihr  → habt  (JAMAIS habe, hast, hat, haben)
sie/Sie → haben (JAMAIS habe, hast, hat, habt)

══════════════════════════════════════════
EXEMPLES DE CORRECTIONS ATTENDUES
══════════════════════════════════════════
"ich ist Student"    → texte_corrige: "Ich bin Student."     (ich → bin)
"er bin Lehrer"      → texte_corrige: "Er ist Lehrer."       (er → ist)
"du bin müde"        → texte_corrige: "Du bist müde."        (du → bist)
"wir ist aus Kamerun"→ texte_corrige: "Wir sind aus Kamerun."(wir → sind)
"ihr ist hungrig"    → texte_corrige: "Ihr seid hungrig."    (ihr → seid)
"ich hat ein Buch"   → texte_corrige: "Ich habe ein Buch."   (ich → habe)
"du habe Hunger"     → texte_corrige: "Du hast Hunger."      (du → hast)

Le champ "texte_corrige" DOIT TOUJOURS être grammaticalement correct.
Le champ "correction" dans errors DOIT TOUJOURS être grammaticalement correct.

Retourne UNIQUEMENT ce JSON valide :
{
  "score_global": <1-10>,
  "score_grammaire": <1-10>,
  "score_vocabulaire": <1-10>,
  "score_prononciation": <1-10>,
  "errors": [
    {
      "type": "grammaire|vocabulaire|prononciation|ordre_mots",
      "original": "ce que l'élève a dit (incorrect)",
      "correction": "forme CORRECTE en allemand",
      "explication_fr": "explication courte en français",
      "explication_en": "short explanation in English",
      "severite": "mineur|majeur"
    }
  ],
  "texte_corrige": "version entièrement corrigée en allemand (DOIT être correcte)",
  "feedback_positif_fr": "ce qui est bien (1 phrase)",
  "feedback_positif_en": "what is good (1 sentence)",
  "conseil_fr": "conseil principal (1 phrase)",
  "conseil_en": "main advice (1 sentence)",
  "peut_continuer": true
}`;

export async function POST(req: NextRequest) {
  const locale = req.headers.get("accept-language")?.startsWith("en") ? "en" : "fr";
  let { transcript, expectedText, level, exerciseType } = await req.json();

  if (!transcript?.trim()) {
    return NextResponse.json({ error: "Transcription vide" }, { status: 400 });
  }

  if (transcript.length > 300) {
    transcript = transcript.slice(0, 300);
  }

  console.info("[speech] analyze request", {
    level: level || "A1",
    transcriptLength: transcript.length,
    exerciseType: exerciseType || "expression_libre",
    locale,
  });

  const userMessage = [
    `Niveau CEFR : ${level || "A1"}`,
    `Type d'exercice : ${exerciseType || "expression_libre"}`,
    expectedText ? `Texte attendu : "${expectedText}"` : null,
    `Transcription de l'élève : "${transcript}"`,
  ].filter(Boolean).join("\n");

  try {
    const result = await callAI({
      feature: "speech",
      systemPrompt: SYSTEM_PROMPT,
      userMessage,
      temperature: 0.2,
      maxTokens: 1200,
    });

    console.info("[speech] AI ok", { provider: result.provider });

    const raw = result.text;
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    const safe = applyGrammarGuardrail(parsed);
    return NextResponse.json({ success: true, analysis: safe }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[speech] AI error", { message: msg.slice(0, 120) });
    return NextResponse.json({
      error: locale === "en"
        ? "The AI coach is not available right now. Please try again in a moment."
        : "Le coach IA n'est pas disponible pour le moment. Réessayez dans quelques instants.",
    }, { status: 502 });
  }
}
