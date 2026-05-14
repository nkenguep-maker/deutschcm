import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY manquante" }, { status: 500 });

  let { transcript, expectedText, level, exerciseType } = await req.json();

  if (!transcript?.trim()) {
    return NextResponse.json({ error: "Transcription vide" }, { status: 400 });
  }

  if (transcript.length > 300) {
    transcript = transcript.slice(0, 300)
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { temperature: 0.3, maxOutputTokens: 1000, responseMimeType: "application/json" }
  });

  const prompt = `Tu es un correcteur de prononciation et de grammaire allemande pour apprenants francophones.

Niveau CEFR : ${level || "A1"}
Type d'exercice : ${exerciseType || "expression_libre"}
${expectedText ? `Texte attendu : "${expectedText}"` : ""}
Transcription de l'élève : "${transcript}"

Analyse et retourne UNIQUEMENT ce JSON :
{
  "score_global": <1-10>,
  "score_grammaire": <1-10>,
  "score_vocabulaire": <1-10>,
  "score_prononciation": <1-10>,
  "errors": [
    {
      "type": "grammaire|vocabulaire|prononciation|ordre_mots",
      "original": "ce que l'élève a dit",
      "correction": "forme correcte en allemand",
      "explication_fr": "explication courte en français",
      "severite": "mineur|majeur"
    }
  ],
  "texte_corrige": "version corrigée complète en allemand",
  "feedback_positif_fr": "ce qui est bien (1 phrase)",
  "conseil_fr": "conseil principal (1 phrase)",
  "peut_continuer": true
}`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return NextResponse.json({ success: true, analysis: parsed }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (err) {
    return NextResponse.json({ error: "Erreur analyse Gemini", details: String(err) }, { status: 502 });
  }
}
