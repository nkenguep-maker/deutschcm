export interface TTSOptions {
  text: string
  voice?: string
  rate?: string
  pitch?: string
  lang?: string
}

export interface TTSResult {
  audioBase64: string
  contentType: string
  durationMs?: number
}

const AZURE_VOICES = {
  female_de: "de-DE-KatjaNeural",
  male_de: "de-DE-ConradNeural",
  female_at: "de-AT-IngridNeural",
  male_at: "de-AT-JonasNeural",
  female_ch: "de-CH-LeniNeural",
  male_ch: "de-CH-JanNeural",
}

export { AZURE_VOICES }

export async function generateSpeech(options: TTSOptions): Promise<TTSResult> {
  const {
    text,
    voice = AZURE_VOICES.female_de,
    rate = "0.85",
    pitch = "0",
    lang = "de-DE"
  } = options

  const apiKey = process.env.AZURE_TTS_KEY
  const region = process.env.AZURE_TTS_REGION || "westeurope"

  if (!apiKey) throw new Error("AZURE_TTS_KEY manquante dans .env.local")

  const ssml = `<?xml version="1.0" encoding="UTF-8"?><speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${voice}"><prosody rate="${rate}" pitch="${pitch}Hz">${text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</prosody></voice></speak>`

  const response = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/ssml+xml; charset=utf-8",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
        "User-Agent": "DeutschCM-LMS",
      },
      body: ssml,
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Azure TTS erreur ${response.status}: ${err}`)
  }

  const audioBuffer = await response.arrayBuffer()
  const audioBase64 = Buffer.from(audioBuffer).toString("base64")

  return {
    audioBase64,
    contentType: "audio/mpeg",
    durationMs: audioBuffer.byteLength / 16000 * 1000,
  }
}

export function getVoiceForSpeaker(
  gender: "male" | "female",
  accent: "de" | "at" | "ch" = "de"
): string {
  return AZURE_VOICES[`${gender}_${accent}` as keyof typeof AZURE_VOICES]
    || AZURE_VOICES.female_de
}
