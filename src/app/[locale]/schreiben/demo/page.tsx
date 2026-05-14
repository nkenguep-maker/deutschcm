"use client"
import SchreibenEditor from "@/components/SchreibenEditor"
import { useState } from "react"

const EXERCISES = [
  {
    level: "A1",
    exerciseType: "presentation",
    task: "Présentez-vous en allemand : votre nom, votre âge, votre ville et votre profession.",
    taskDE: "Stellen Sie sich vor: Ihr Name, Ihr Alter, Ihre Stadt und Ihr Beruf.",
    minWords: 20,
    maxWords: 50,
    example: "Hallo! Ich heiße Marie. Ich bin 25 Jahre alt. Ich komme aus Yaoundé in Kamerun. Ich bin Studentin. Ich lerne Deutsch, weil ich in Deutschland studieren möchte."
  },
  {
    level: "A2",
    exerciseType: "email",
    task: "Écrivez un email à votre futur propriétaire allemand pour demander des informations sur l'appartement.",
    taskDE: "Schreiben Sie eine E-Mail an Ihren zukünftigen Vermieter und fragen Sie nach der Wohnung.",
    minWords: 40,
    maxWords: 80,
    example: "Sehr geehrte Frau Müller,\n\nich schreibe Ihnen wegen Ihrer Wohnungsanzeige. Ich interessiere mich sehr für die Wohnung in der Berliner Straße. Könnten Sie mir bitte mehr Informationen geben?\n\nWie hoch sind die Nebenkosten? Gibt es einen Parkplatz? Wann könnte ich die Wohnung besichtigen?\n\nIch freue mich auf Ihre Antwort.\n\nMit freundlichen Grüßen,\nMarie Dupont"
  },
  {
    level: "B1",
    exerciseType: "argumentation",
    task: "Quels sont les avantages d'apprendre l'allemand pour un Camerounais ? Donnez 3 arguments.",
    taskDE: "Welche Vorteile hat es für einen Kameruner, Deutsch zu lernen? Nennen Sie 3 Argumente.",
    minWords: 60,
    maxWords: 120,
    example: "Deutsch zu lernen bietet viele Vorteile für Kameruner. Erstens ist Deutschland ein wichtiger Wirtschaftspartner Afrikas, deshalb eröffnen Deutschkenntnisse viele Berufsmöglichkeiten. Zweitens ist Deutschland bekannt für seine ausgezeichneten Universitäten, und ein Studium dort ist für deutschsprachige Bewerber leichter zugänglich. Drittens stärkt das Erlernen einer neuen Sprache die kognitiven Fähigkeiten und erweitert den kulturellen Horizont."
  }
]

export default function SchreibenDemo() {
  const [activeLevel, setActiveLevel] = useState("A1")
  const exercise = EXERCISES.find(e => e.level === activeLevel) || EXERCISES[0]

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080c10",
      padding: "40px 24px",
      fontFamily: "'DM Mono', monospace"
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono&display=swap')`}</style>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{
          fontFamily: "'Syne',sans-serif",
          color: "white", fontSize: 24, fontWeight: 800, marginBottom: 4
        }}>
          ✍️ Module Schreiben — Expression écrite
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24 }}>
          Correction IA · Score détaillé · Conseils personnalisés · Exemple modèle
        </p>

        {/* Sélecteur niveau */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {["A1", "A2", "B1"].map(level => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              style={{
                padding: "8px 20px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                background: activeLevel === level
                  ? "linear-gradient(135deg,#10b981,#059669)"
                  : "rgba(255,255,255,0.05)",
                border: activeLevel === level
                  ? "none"
                  : "1px solid rgba(255,255,255,0.1)",
                color: activeLevel === level ? "white" : "rgba(255,255,255,0.5)",
                cursor: "pointer"
              }}
            >
              Niveau {level}
            </button>
          ))}
        </div>

        <SchreibenEditor
          key={activeLevel}
          task={exercise.task}
          taskDE={exercise.taskDE}
          level={exercise.level}
          exerciseType={exercise.exerciseType}
          minWords={exercise.minWords}
          maxWords={exercise.maxWords}
          example={exercise.example}
          onComplete={(score, text) => {
            console.log(`Schreiben terminé — Score: ${score}/100`)
          }}
        />
      </div>
    </div>
  )
}
