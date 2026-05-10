"use client"
import { useState, useRef, useEffect } from "react"

interface AudioPlayerProps {
  text: string
  gender?: "male" | "female"
  accent?: "de" | "at" | "ch"
  rate?: string
  autoPlay?: boolean
  onPlay?: () => void
  onEnd?: () => void
  showText?: boolean
  label?: string
}

export default function AudioPlayer({
  text,
  gender = "female",
  accent = "de",
  rate = "0.85",
  autoPlay = false,
  onPlay,
  onEnd,
  showText = false,
  label,
}: AudioPlayerProps) {
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const generateAudio = async () => {
    if (audioUrl) return audioUrl

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, gender, accent, rate }),
      })

      const data = await res.json()

      if (!data.success) throw new Error(data.error || "Erreur TTS")

      const blob = new Blob(
        [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))],
        { type: "audio/mpeg" }
      )
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      return url

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur audio"
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  const handlePlay = async () => {
    const url = await generateAudio()
    if (!url) return

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    const audio = new Audio(url)
    audioRef.current = audio

    audio.onplay = () => { setPlaying(true); onPlay?.() }
    audio.onended = () => { setPlaying(false); onEnd?.() }
    audio.onerror = () => { setPlaying(false); setError("Erreur lecture") }

    await audio.play()
  }

  const handleStop = () => {
    audioRef.current?.pause()
    if (audioRef.current) audioRef.current.currentTime = 0
    setPlaying(false)
  }

  useEffect(() => {
    if (autoPlay) handlePlay()
    return () => { audioRef.current?.pause() }
  }, [])

  useEffect(() => {
    return () => { if (audioUrl) URL.revokeObjectURL(audioUrl) }
  }, [audioUrl])

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={playing ? handleStop : handlePlay}
        disabled={loading}
        title={playing ? "Arrêter" : `Écouter${label ? " : " + label : ""}`}
        style={{
          width: 36, height: 36,
          borderRadius: "50%",
          border: "1px solid rgba(16,185,129,0.3)",
          background: playing
            ? "rgba(239,68,68,0.15)"
            : loading
            ? "rgba(255,255,255,0.05)"
            : "rgba(16,185,129,0.12)",
          color: playing ? "#ef4444" : loading ? "rgba(255,255,255,0.3)" : "#10b981",
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0,
          transition: "all 0.2s",
        }}
      >
        {loading ? "⏳" : playing ? "⏹" : "▶"}
      </button>

      {showText && (
        <span style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.7)",
          fontStyle: "italic"
        }}>
          {text}
        </span>
      )}

      {error && (
        <span style={{ fontSize: 11, color: "#ef4444" }}>
          ⚠️ {error}
        </span>
      )}
    </div>
  )
}
