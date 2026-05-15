import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ── A1 grammar guardrail ──────────────────────────────────────────────────────
// Applies deterministic corrections AFTER Gemini responds, as a backstop.
function fixA1Grammar(text: string): string {
  return text
    // sein — ich
    .replace(/\bich\s+ist\b/gi,  "ich bin")
    .replace(/\bich\s+bist\b/gi, "ich bin")
    .replace(/\bich\s+sind\b/gi, "ich bin")
    .replace(/\bich\s+seid\b/gi, "ich bin")
    // sein — du
    .replace(/\bdu\s+bin\b/gi,   "du bist")
    .replace(/\bdu\s+ist\b/gi,   "du bist")
    .replace(/\bdu\s+sind\b/gi,  "du bist")
    .replace(/\bdu\s+seid\b/gi,  "du bist")
    // sein — er
    .replace(/\ber\s+bin\b/gi,   "er ist")
    .replace(/\ber\s+bist\b/gi,  "er ist")
    .replace(/\ber\s+sind\b/gi,  "er ist")
    .replace(/\ber\s+seid\b/gi,  "er ist")
    // sein — wir
    .replace(/\bwir\s+bin\b/gi,  "wir sind")
    .replace(/\bwir\s+bist\b/gi, "wir sind")
    .replace(/\bwir\s+ist\b/gi,  "wir sind")
    .replace(/\bwir\s+seid\b/gi, "wir sind")
    // sein — ihr
    .replace(/\bihr\s+bin\b/gi,  "ihr seid")
    .replace(/\bihr\s+bist\b/gi, "ihr seid")
    .replace(/\bihr\s+ist\b/gi,  "ihr seid")
    .replace(/\bihr\s+sind\b/gi, "ihr seid")
    // haben — ich
    .replace(/\bich\s+hat\b/gi,   "ich habe")
    .replace(/\bich\s+hast\b/gi,  "ich habe")
    .replace(/\bich\s+habt\b/gi,  "ich habe")
    .replace(/\bich\s+haben\b/gi, "ich habe")
    // haben — du
    .replace(/\bdu\s+habe\b/gi,  "du hast")
    .replace(/\bdu\s+hat\b/gi,   "du hast")
    .replace(/\bdu\s+habt\b/gi,  "du hast")
    .replace(/\bdu\s+haben\b/gi, "du hast")
    // haben — er
    .replace(/\ber\s+habe\b/gi,  "er hat")
    .replace(/\ber\s+hast\b/gi,  "er hat")
    .replace(/\ber\s+habt\b/gi,  "er hat")
    .replace(/\ber\s+haben\b/gi, "er hat")
    // haben — wir
    .replace(/\bwir\s+habe\b/gi, "wir haben")
    .replace(/\bwir\s+hast\b/gi, "wir haben")
    .replace(/\bwir\s+hat\b/gi,  "wir haben")
    .replace(/\bwir\s+habt\b/gi, "wir haben")
    // haben — ihr
    .replace(/\bihr\s+habe\b/gi,  "ihr habt")
    .replace(/\bihr\s+hast\b/gi,  "ihr habt")
    .replace(/\bihr\s+hat\b/gi,   "ihr habt")
    .replace(/\bihr\s+haben\b/gi, "ihr habt");
}

// Apply guardrail to all free-text German fields in the analysis object
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

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY manquante" }, { status: 500 });

  let { transcript, expectedText, level, exerciseType } = await req.json();

  if (!transcript?.trim()) {
    return NextResponse.json({ error: "Transcription vide" }, { status: 400 });
  }

  if (transcript.length > 300) {
    transcript = transcript.slice(0, 300);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { temperature: 0.2, maxOutputTokens: 1200, responseMimeType: "application/json" },
  });

  const prompt = `Tu es un correcteur expert en allemand pour apprenants CEFR francophones.
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

Niveau CEFR : ${level || "A1"}
Type d'exercice : ${exerciseType || "expression_libre"}
${expectedText ? `Texte attendu : "${expectedText}"` : ""}
Transcription de l'élève : "${transcript}"

Analyse et retourne UNIQUEMENT ce JSON valide :
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

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    const safe = applyGrammarGuardrail(parsed);
    return NextResponse.json({ success: true, analysis: safe }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json({ error: "Erreur analyse Gemini", details: String(err) }, { status: 502 });
  }
}
