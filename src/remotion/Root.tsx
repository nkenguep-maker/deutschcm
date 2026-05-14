import { Composition } from "remotion"
import { LessonSlide } from "./compositions/LessonSlide"
import { VocabularySlide } from "./compositions/VocabularySlide"
import { GrammarSlide } from "./compositions/GrammarSlide"
import { QuizSlide } from "./compositions/QuizSlide"
import { IntroSlide } from "./compositions/IntroSlide"

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LessonVideo"
        component={LessonSlide as any}
        durationInFrames={300}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          title: "Guten Tag!",
          subtitle: "Salutations en allemand",
          level: "A1",
          manuel: "Netzwerk neu A1",
          lektion: 1,
          backgroundColor: "#080c10",
          accentColor: "#10b981"
        }}
      />
      <Composition
        id="VocabularyVideo"
        component={VocabularySlide as any}
        durationInFrames={450}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          words: [
            { de: "Hallo", fr: "Bonjour", article: null, example: "Hallo, ich bin Paul!" },
            { de: "Guten Tag", fr: "Bonjour (formel)", article: null, example: "Guten Tag, Frau Müller." },
            { de: "Auf Wiedersehen", fr: "Au revoir", article: null, example: "Auf Wiedersehen!" },
            { de: "Bitte", fr: "S'il vous plaît", article: null, example: "Bitte, kommen Sie herein." },
            { de: "Danke", fr: "Merci", article: null, example: "Danke schön!" }
          ],
          level: "A1",
          title: "Vocabulaire — Lektion 1"
        }}
      />
      <Composition
        id="GrammarVideo"
        component={GrammarSlide as any}
        durationInFrames={360}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          rule: "Conjugaison du verbe 'sein'",
          ruleDE: "Das Verb 'sein' im Präsens",
          level: "A1",
          table: {
            headers: ["Pronom", "Forme", "Exemple"],
            rows: [
              ["ich", "bin", "Ich bin Student."],
              ["du", "bist", "Du bist nett."],
              ["er/sie/es", "ist", "Er ist Lehrer."],
              ["wir", "sind", "Wir sind Freunde."],
              ["ihr", "seid", "Ihr seid hier."],
              ["sie/Sie", "sind", "Sie sind willkommen."]
            ]
          }
        }}
      />
    </>
  )
}
