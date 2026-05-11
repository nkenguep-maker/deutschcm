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
    // Fallback questions statiques si Gemini indisponible
    const fallbackQuestions = {
      level: level,
      adjustedLevel: level,
      adaptive: false,
      avgPreviousScore: 50,
      questions: [
        {
          id: "q1", type: "qcm", level: level,
          difficulty: 2,
          question_fr: "Comment dit-on 'bonjour' formellement en allemand ?",
          question_de: "Wie sagt man formell 'Hallo' auf Deutsch?",
          options: ["Hallo", "Guten Tag", "Tschüss", "Danke"],
          correct: "Guten Tag",
          correct_index: 1,
          explanation_fr: "'Guten Tag' est la salutation formelle. 'Hallo' est familier.",
          hint_fr: "C'est une salutation utilisée en journée dans un contexte professionnel.",
          points: 10, topic: "vocabulaire"
        },
        {
          id: "q2", type: "lacune", level: level,
          difficulty: 2,
          question_fr: "Complétez : Ich ___ Student. (Je suis étudiant)",
          options: ["bin", "bist", "ist", "sind"],
          correct: "bin",
          correct_index: 0,
          explanation_fr: "Avec 'ich', le verbe 'sein' se conjugue 'bin'.",
          hint_fr: "Conjuguez 'sein' à la première personne du singulier.",
          points: 10, topic: "grammaire"
        },
        {
          id: "q3", type: "qcm", level: level,
          difficulty: 1,
          question_fr: "Comment dit-on 'merci' en allemand ?",
          options: ["Bitte", "Danke", "Hallo", "Ja"],
          correct: "Danke",
          correct_index: 1,
          explanation_fr: "'Danke' signifie merci. 'Danke schön' = merci beaucoup.",
          hint_fr: "Ce mot commence par D.",
          points: 10, topic: "vocabulaire"
        },
        {
          id: "q4", type: "vrai_faux", level: level,
          difficulty: 1,
          question_fr: "Vrai ou Faux : 'Auf Wiedersehen' signifie 'au revoir'.",
          options: ["Vrai", "Faux"],
          correct: "Vrai",
          correct_index: 0,
          explanation_fr: "Oui, 'Auf Wiedersehen' signifie bien 'au revoir' formellement.",
          hint_fr: "Pensez à la fin d'une réunion formelle.",
          points: 10, topic: "vocabulaire"
        },
        {
          id: "q5", type: "qcm", level: level,
          difficulty: 2,
          question_fr: "Quel est l'article défini pour 'Mann' (homme) ?",
          options: ["die", "das", "der", "den"],
          correct: "der",
          correct_index: 2,
          explanation_fr: "'Mann' est masculin donc l'article est 'der'.",
          hint_fr: "Les noms masculins prennent 'der'.",
          points: 10, topic: "grammaire"
        },
        {
          id: "q6", type: "traduction", level: level,
          difficulty: 3,
          question_fr: "Traduisez en allemand : 'Je m'appelle Paul'",
          options: ["Ich heiße Paul", "Ich bin Paul", "Mein Name Paul", "Ich Paul heiße"],
          correct: "Ich heiße Paul",
          correct_index: 0,
          explanation_fr: "On utilise 'heißen' pour dire comment on s'appelle : Ich heiße...",
          hint_fr: "Le verbe pour 's'appeler' en allemand est 'heißen'.",
          points: 10, topic: "vocabulaire"
        },
        {
          id: "q7", type: "qcm", level: level,
          difficulty: 2,
          question_fr: "Comment dit-on 's'il vous plaît' en allemand ?",
          options: ["Danke", "Bitte", "Ja", "Nein"],
          correct: "Bitte",
          correct_index: 1,
          explanation_fr: "'Bitte' signifie 's'il vous plaît' mais aussi 'de rien'.",
          hint_fr: "Ce mot s'utilise aussi pour répondre à 'Danke'.",
          points: 10, topic: "vocabulaire"
        },
        {
          id: "q8", type: "lacune", level: level,
          difficulty: 3,
          question_fr: "Complétez : Wie ___ du? (Comment t'appelles-tu ?)",
          options: ["heißt", "bist", "hast", "machst"],
          correct: "heißt",
          correct_index: 0,
          explanation_fr: "'Wie heißt du?' = Comment tu t'appelles? (forme familière)",
          hint_fr: "C'est la conjugaison de 'heißen' à la 2ème personne.",
          points: 10, topic: "grammaire"
        },
        {
          id: "q9", type: "vrai_faux", level: level,
          difficulty: 1,
          question_fr: "Vrai ou Faux : En allemand, tous les noms s'écrivent avec une majuscule.",
          options: ["Vrai", "Faux"],
          correct: "Vrai",
          correct_index: 0,
          explanation_fr: "Oui ! En allemand, TOUS les noms commencent par une majuscule. Ex: der Mann, die Frau.",
          hint_fr: "C'est une règle unique à l'allemand parmi les langues européennes.",
          points: 10, topic: "grammaire"
        },
        {
          id: "q10", type: "qcm", level: level,
          difficulty: 2,
          question_fr: "Que signifie 'Woher kommen Sie?' ?",
          options: ["Comment allez-vous ?", "D'où venez-vous ?", "Où habitez-vous ?", "Quel âge avez-vous ?"],
          correct: "D'où venez-vous ?",
          correct_index: 1,
          explanation_fr: "'Woher' = d'où, 'kommen' = venir, 'Sie' = vous (formel).",
          hint_fr: "'Woher' indique une origine, une provenance.",
          points: 10, topic: "vocabulaire"
        }
      ]
    }

    return NextResponse.json({
      success: true,
      quiz: fallbackQuestions,
      fallback: true,
      note: "Questions statiques (Gemini indisponible)"
    })
  }
}
