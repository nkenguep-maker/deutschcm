"use client"
import DialogPlayer from "@/components/DialogPlayer"
import type { DialogLine } from "@/components/DialogPlayer"

const DEMO_DIALOGS = {
  A1: {
    title: "Am Schalter — Au guichet",
    context_fr: "À l'ambassade allemande, Anna demande des informations sur son visa.",
    lines: [
      { sprecher: "Beamter", text: "Guten Tag! Was kann ich für Sie tun?", translation: "Bonjour ! Que puis-je faire pour vous ?", gender: "male" as const, pause_after_ms: 800 },
      { sprecher: "Anna", text: "Guten Tag. Ich möchte ein Visum beantragen.", translation: "Bonjour. Je voudrais demander un visa.", gender: "female" as const, pause_after_ms: 700 },
      { sprecher: "Beamter", text: "Haben Sie alle Dokumente dabei?", translation: "Avez-vous tous les documents avec vous ?", gender: "male" as const, pause_after_ms: 800 },
      { sprecher: "Anna", text: "Ja, ich habe alles dabei. Hier sind meine Unterlagen.", translation: "Oui, j'ai tout avec moi. Voici mes documents.", gender: "female" as const, pause_after_ms: 700 },
      { sprecher: "Beamter", text: "Sehr gut. Bitte nehmen Sie Platz und warten Sie.", translation: "Très bien. Veuillez vous asseoir et attendre.", gender: "male" as const },
    ] as DialogLine[]
  },
  A2: {
    title: "Das Vorstellungsgespräch — L'entretien",
    context_fr: "Paul présente sa candidature pour un poste en Allemagne.",
    lines: [
      { sprecher: "Frau Müller", text: "Guten Morgen, Herr Nkengue. Setzen Sie sich bitte.", translation: "Bonjour, M. Nkengue. Asseyez-vous je vous prie.", gender: "female" as const, pause_after_ms: 900 },
      { sprecher: "Paul", text: "Danke schön, Frau Müller. Ich freue mich, hier zu sein.", translation: "Merci beaucoup, Mme Müller. Je suis ravi d'être ici.", gender: "male" as const, accent: "at" as const, pause_after_ms: 800 },
      { sprecher: "Frau Müller", text: "Erzählen Sie mir bitte etwas über Ihre Erfahrungen.", translation: "Parlez-moi de votre expérience professionnelle.", gender: "female" as const, pause_after_ms: 900 },
      { sprecher: "Paul", text: "Ich arbeite seit drei Jahren als Ingenieur in Kamerun.", translation: "Je travaille depuis trois ans comme ingénieur au Cameroun.", gender: "male" as const, accent: "at" as const },
    ] as DialogLine[]
  },
  B1: {
    title: "Die Wohnungssuche — Chercher un appartement",
    context_fr: "Sophie cherche un appartement à Berlin et appelle un propriétaire.",
    lines: [
      { sprecher: "Sophie", text: "Guten Tag, ich rufe wegen der Wohnungsanzeige an.", translation: "Bonjour, j'appelle au sujet de l'annonce d'appartement.", gender: "female" as const, accent: "ch" as const, pause_after_ms: 800 },
      { sprecher: "Herr Schmidt", text: "Ah ja, guten Tag! Die Wohnung ist noch verfügbar.", translation: "Ah oui, bonjour ! L'appartement est encore disponible.", gender: "male" as const, pause_after_ms: 700 },
      { sprecher: "Sophie", text: "Wunderbar! Könnten Sie mir mehr über die Lage erzählen?", translation: "Merveilleux ! Pourriez-vous m'en dire plus sur l'emplacement ?", gender: "female" as const, accent: "ch" as const, pause_after_ms: 900 },
      { sprecher: "Herr Schmidt", text: "Die Wohnung liegt zentral, fünf Minuten vom Bahnhof entfernt.", translation: "L'appartement est central, à cinq minutes de la gare.", gender: "male" as const },
    ] as DialogLine[]
  }
}

export default function HoerenDemo() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#080c10",
      padding: "40px 24px",
      fontFamily: "'DM Mono', monospace"
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Mono&display=swap')`}</style>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{
          fontFamily: "'Syne',sans-serif",
          color: "white", fontSize: 24, fontWeight: 800,
          marginBottom: 4
        }}>
          🎧 Module Hören — Compréhension orale
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 32 }}>
          Voix natives allemandes · Vitesse adaptée · Traduction cachée
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {Object.entries(DEMO_DIALOGS).map(([level, dialog]) => (
            <div key={level}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "3px 10px", borderRadius: 99,
                background: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.25)",
                marginBottom: 10
              }}>
                <span style={{ color: "#10b981", fontSize: 11, fontWeight: 700 }}>
                  Niveau {level}
                </span>
              </div>
              <DialogPlayer
                title={dialog.title}
                context_fr={dialog.context_fr}
                lines={dialog.lines}
                onComplete={() => console.log(`Dialog ${level} terminé`)}
              />
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 32, padding: 20,
          borderRadius: 16,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0 }}>
            ⚙️ Configuration requise dans .env.local :
          </p>
          <code style={{ color: "#10b981", fontSize: 11, display: "block", marginTop: 8 }}>
            AZURE_TTS_KEY=votre_clé_azure<br/>
            AZURE_TTS_REGION=westeurope
          </code>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 8, margin: "8px 0 0" }}>
            Clé gratuite sur portal.azure.com — 500.000 caractères/mois offerts
          </p>
        </div>
      </div>
    </div>
  )
}
