import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY manquante" }, { status: 500 })

  const { level, topic, moduleId, count = 10, adaptive = true, previousScores = [] } = await req.json()

  const avgPreviousScore = previousScores.length > 0
    ? previousScores.reduce((a: number, b: number) => a + b, 0) / previousScores.length
    : 50

  const adjustedLevel = adaptive
    ? avgPreviousScore >= 80 ? "plus difficile que " + level
    : avgPreviousScore <= 40 ? "plus facile que " + level
    : level
    : level

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 3000,
      responseMimeType: "application/json"
    }
  })

  const prompt = `Tu es un expert en didactique de l'allemand (DaF) pour apprenants francophones.

Génère exactement ${count} questions de quiz pour :
- Niveau CEFR : ${adjustedLevel}
- Thème/Leçon : ${topic || "Allemand général"}
- Score moyen précédent : ${Math.round(avgPreviousScore)}% ${adaptive ? "(adaptatif activé)" : ""}

Types de questions à varier :
- qcm : 4 choix, 1 bonne réponse
- lacune : compléter une phrase (1 mot manquant)
- traduction : traduire du français vers l'allemand
- vrai_faux : affirmation vraie ou fausse
- association : relier 2 éléments

Retourne UNIQUEMENT ce JSON valide :
{
  "level": "${level}",
  "adjustedLevel": "${adjustedLevel}",
  "adaptive": ${adaptive},
  "avgPreviousScore": ${Math.round(avgPreviousScore)},
  "questions": [
    {
      "id": "q1",
      "type": "qcm|lacune|traduction|vrai_faux",
      "level": "A1|A2|B1|B2|C1",
      "difficulty": 1-5,
      "question_fr": "Question en français",
      "question_de": "Frage auf Deutsch (optionnel)",
      "options": ["A", "B", "C", "D"],
      "correct": "bonne réponse exacte",
      "correct_index": 0,
      "explanation_fr": "explication courte en français",
      "hint_fr": "indice si l'élève bloque",
      "points": 10,
      "topic": "grammaire|vocabulaire|conjugaison|article|préposition"
    }
  ]
}`

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text()
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim())
    return NextResponse.json({ success: true, quiz: parsed }, {
      headers: { "Cache-Control": "no-store" }
    })
  } catch (err) {
    return NextResponse.json({ error: "Erreur génération quiz", details: String(err) }, { status: 502 })
  }
}
