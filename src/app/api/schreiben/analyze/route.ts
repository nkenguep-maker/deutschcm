import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY manquante" }, { status: 500 })

  const { text, task, level, exerciseType } = await req.json()

  if (!text?.trim()) {
    return NextResponse.json({ error: "Texte vide" }, { status: 400 })
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    }
  })

  const prompt = `Tu es un correcteur expert en productions écrites allemandes pour apprenants francophones.

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
  "texte_corrige": "version entièrement corrigée en allemand",
  "errors": [
    {
      "original": "texte fautif exact",
      "correction": "correction en allemand",
      "type": "orthographe|grammaire|vocabulaire|style|ponctuation",
      "explication_fr": "explication courte en français",
      "severite": "mineur|majeur"
    }
  ],
  "feedback_positif_fr": "ce qui est bien dans ce texte (1-2 phrases)",
  "conseil_principal_fr": "le conseil le plus important (1 phrase)",
  "conseils_fr": ["conseil 1", "conseil 2", "conseil 3"],
  "exemple_modele": "exemple de très bonne réponse en allemand",
  "mots_bien_utilises": ["mot1", "mot2"],
  "structures_a_retenir": ["structure grammaticale 1", "structure 2"]
}`

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text()
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim())
    return NextResponse.json({ success: true, correction: parsed }, {
      headers: { "Cache-Control": "no-store" }
    })
  } catch (err) {
    return NextResponse.json({
      error: "Erreur analyse",
      details: String(err)
    }, { status: 502 })
  }
}
