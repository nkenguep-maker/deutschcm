import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai/provider";
import { fixA1Grammar } from "@/lib/ai/guardrails";

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

// Heuristic: single token with no space, no punctuation, and not resembling German/Latin words
function looksLikeNonsense(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3) return true;
  const words = trimmed.split(/\s+/).filter(Boolean);
  // Single "word" that's very short or has no vowels (not German-like)
  if (words.length === 1 && trimmed.length < 15) {
    const vowels = (trimmed.match(/[aeiouäöüAEIOUÄÖÜ]/g) || []).length;
    if (vowels === 0) return true;
    // Random-looking: high proportion of unusual character combos
    if (trimmed.length > 5 && vowels / trimmed.length < 0.1) return true;
  }
  return false;
}

const NONSENSE_RESPONSE_FR = {
  success: true,
  correction: {
    score_global: 0,
    scores: { contenu: 0, vocabulaire: 0, grammaire: 0, format: 0 },
    niveau_detecte: "A1",
    texte_corrige: "",
    errors: [],
    feedback_positif_fr: "Pas encore de phrase allemande complète — mais on va y arriver ensemble !",
    feedback_positif_en: "No complete German sentence yet — but we will get there together!",
    conseil_principal_fr: "Essaie une phrase simple comme : « Ich heiße Paul. Ich komme aus Kamerun. »",
    conseil_principal_en: "Try a simple sentence like: Ich heiße Paul. Ich komme aus Kamerun.",
    conseils_fr: [
      "Commence par te présenter : Ich heiße [ton prénom].",
      "Dis d'où tu viens : Ich komme aus [ton pays].",
      "Ajoute ta profession : Ich bin Student / Ingenieur / Krankenpfleger.",
    ],
    exemple_modele: "Hallo! Ich heiße Paul. Ich komme aus Kamerun. Ich bin Student. Ich lerne Deutsch.",
    mots_bien_utilises: [],
    structures_a_retenir: ["Ich heiße …", "Ich komme aus …", "Ich bin …"],
  }
};

const SYSTEM_PROMPT = `Tu es un correcteur expert en productions écrites allemandes pour apprenants CEFR francophones.
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

Si le texte reçu n'est pas reconnaissable comme de l'allemand (charabia, trop court, pas de mots reconnaissables) :
- score_global: 0
- conseil_principal_fr: "Je n'arrive pas encore à reconnaître une phrase allemande complète. Essaie une phrase simple comme : Ich heiße Paul. Ich komme aus Kamerun."
- exemple_modele: "Hallo! Ich heiße Paul. Ich komme aus Kamerun. Ich bin Student."

Retourne UNIQUEMENT ce JSON valide :
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
}`;

export async function POST(req: NextRequest) {
  const { text, task, level, exerciseType } = await req.json();

  if (!text?.trim()) {
    return NextResponse.json({ error: "Texte vide" }, { status: 400 });
  }

  if (text.length > 500) {
    return NextResponse.json({ error: "Texte trop long (max 500 caractères)" }, { status: 400 });
  }

  // Nonsense short input — return gentle message without hitting AI
  if (looksLikeNonsense(text)) {
    console.info("[schreiben] nonsense input detected, returning gentle response");
    return NextResponse.json(NONSENSE_RESPONSE_FR);
  }

  const userMessage = [
    `Niveau CEFR : ${level || "A1"}`,
    `Type d'exercice : ${exerciseType || "expression_libre"}`,
    `Consigne : ${task || "Écrivez un texte en allemand"}`,
    `Texte de l'élève : "${text}"`,
  ].join("\n");

  console.info("[schreiben] analyze request", {
    level: level || "A1",
    textLength: text.length,
    exerciseType: exerciseType || "expression_libre",
  });

  try {
    const result = await callAI({
      feature: "writing",
      systemPrompt: SYSTEM_PROMPT,
      userMessage,
      temperature: 0.2,
      maxTokens: 2048,
    });

    console.info("[schreiben] AI ok", { provider: result.provider });

    const raw = result.text;
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    const safe = applyGrammarGuardrail(parsed);
    return NextResponse.json({ success: true, correction: safe }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[schreiben] AI error", { message: msg.slice(0, 120) });
    return NextResponse.json({
      error: "Correction IA temporairement indisponible",
      message_fr: "Le coach IA n'est pas disponible pour le moment. Réessayez dans quelques instants.",
      message_en: "The AI coach is not available right now. Please try again in a moment.",
    }, { status: 502 });
  }
}
