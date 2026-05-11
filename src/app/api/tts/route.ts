import { NextRequest, NextResponse } from "next/server"
import { generateSpeech, getVoiceForSpeaker } from "@/lib/azureTTS"

export async function POST(req: NextRequest) {
  try {
    const {
      text,
      gender = "female",
      accent = "de",
      rate = "0.85",
      pitch = "0",
      voice
    } = await req.json()

    if (!text?.trim()) {
      return NextResponse.json(
        { error: "Texte requis" },
        { status: 400 }
      )
    }

    if (text.length > 500) {
      return NextResponse.json(
        { error: "Texte trop long (max 500 caractères)" },
        { status: 400 }
      )
    }

    const selectedVoice = voice || getVoiceForSpeaker(gender, accent)

    const result = await generateSpeech({
      text,
      voice: selectedVoice,
      rate,
      pitch,
    })

    return NextResponse.json({
      success: true,
      audio: result.audioBase64,
      contentType: result.contentType,
      voice: selectedVoice,
      charCount: text.length,
    }, {
      headers: { "Cache-Control": "public, max-age=3600" }
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)

    if (message.includes("AZURE_TTS_KEY")) {
      return NextResponse.json(
        { error: "Azure TTS non configuré", details: message },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: "Erreur TTS", details: message },
      { status: 502 }
    )
  }
}
