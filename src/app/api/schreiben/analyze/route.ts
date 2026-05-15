import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// ── A1 grammar guardrail ──────────────────────────────────────────────────────
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
    .replace(/\bwir\s+habe\b/gi,  "wir haben")
    .replace(/\bwir\s+hast\b/gi,  "wir haben")
    .replace(/\bwir\s+hat\b/gi,   "wir haben")
    .replace(/\bwir\s+habt\b/gi,  "wir haben")
    .replace(/\bihr\s+habe\b/gi,  "ihr habt")
    .replace(/\bihr\s+hast\b/gi,  "ihr habt")
    .replace(/\bihr\s+hat\b/gi,   "ihr habt")
    .replace(/\bihr\s+haben\b/gi, "ihr habt");
}

function applyGrammarGuardrail(correction: Record<string, unknown>): Record<string, unknown> {
  if (typeof correction.texte_corrige === "string") {
    correction.texte_corrige = fixA1Grammar(correction.texte_corrige);
  }
  if (typeof correction.exemple_modele === "string") {
    correction.exemple_modele = fixA1Grammar(correction.exemple_modele);
  }
  if (Array.isArray(correction.errors)) {
    correction.errors = (correction.errors as Record<string, unknown>[]).map((err) => {
      if (typeof err.correction === "string") {
        err.correction = fixA1Grammar(err.correction);
      }
      return err;
    });
  }
  return correction;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY manquante" }, { status: 500 })

  const { text, task, level, exerciseType } = await req.json()

  if (!text?.trim()) {
    return NextResponse.json({ error: "Texte vide" }, { status: 400 })
  }

  if (text.length > 500) {
    return NextResponse.json({ error: "Texte trop long (max 500 caractères)" }, { status: 400 })
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    }
  })

  const prompt = `Tu es un correcteur expert en productions écrites allemandes pour apprenants CEFR francophones.
Tu DOIS toujours produire du texte allemand grammaticalement CORRECT dans tes corrections.

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

Si l'élève écrit "ich ist Student" → texte_corrige doit contenir "Ich bin Student."
Si l'élève écrit "er bin Lehrer"   → texte_corrige doit contenir "Er ist Lehrer."
Si l'élève écrit "wir ist aus Kamerun" → texte_corrige doit contenir "Wir sind aus Kamerun."

Le champ "texte_corrige" et "exemple_modele" DOIVENT être grammaticalement corrects.

Niveau CEFR : ${level || "A1"}
Type d'exercice : ${exerciseType || "expression_libre"}
Consigne : ${task || "Écrivez un texte en allemand"}
Texte de l'élève : "${text}"

Analyse et retourne UNIQUEMENT ce JSON valide :
{
  "score_global": <0-100>,
  "scores": {
    "contenu": <0-25>,
    "vocabulaire": <0-25>,
    "grammaire": <0-25>,
    "format": <0-25>
  },
  "niveau_detecte": "A1|A2|B1|B2|C1",
  "texte_corrige": "version entièrement corrigée en allemand (DOIT être correcte)",
  "errors": [
    {
      "original": "texte fautif exact",
      "correction": "correction CORRECTE en allemand",
      "type": "orthographe|grammaire|vocabulaire|style|ponctuation",
      "explication_fr": "explication courte en français",
      "explication_en": "short explanation in English",
      "severite": "mineur|majeur"
    }
  ],
  "feedback_positif_fr": "ce qui est bien dans ce texte (1-2 phrases)",
  "feedback_positif_en": "what is good in this text (1-2 sentences)",
  "conseil_principal_fr": "le conseil le plus important (1 phrase)",
  "conseil_principal_en": "the most important advice (1 sentence)",
  "conseils_fr": ["conseil 1", "conseil 2", "conseil 3"],
  "exemple_modele": "exemple de très bonne réponse en allemand (DOIT être correct)",
  "mots_bien_utilises": ["mot1", "mot2"],
  "structures_a_retenir": ["structure grammaticale 1", "structure 2"]
}`

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text()
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim())
    const safe = applyGrammarGuardrail(parsed)
    return NextResponse.json({ success: true, correction: safe }, {
      headers: { "Cache-Control": "no-store" }
    })
  } catch (err) {
    return NextResponse.json({
      error: "Erreur analyse",
      details: String(err)
    }, { status: 502 })
  }
}
