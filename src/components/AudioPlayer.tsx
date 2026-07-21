"use client"
import { useRef, useEffect } from "react"

// Fonction TTS supprimée (AUDIT.md §11). Le composant ne déclenche plus
// aucun appel réseau. Il joue une source audio statique si `src` est
// fourni, sinon il ne rend rien (contrôle masqué proprement).

interface AudioPlayerProps {
  text: string
  src?: string
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
  src,
  autoPlay = false,
  onPlay,
  onEnd,
  showText = false,
  label,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!src || !autoPlay) return
    const audio = new Audio(src)
    audioRef.current = audio
    audio.onplay = () => onPlay?.()
    audio.onended = () => onEnd?.()
    audio.play().catch(() => {})
    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [src, autoPlay, onPlay, onEnd])

  if (!src) return null

  const handleToggle = async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src)
      audioRef.current.onplay = () => onPlay?.()
      audioRef.current.onended = () => onEnd?.()
    }
    const el = audioRef.current
    if (el.paused) {
      await el.play().catch(() => {})
    } else {
      el.pause()
      el.currentTime = 0
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={handleToggle}
        title={label ?? text}
        style={{
          width: 36, height: 36,
          borderRadius: "50%",
          border: "1px solid rgba(16,185,129,0.3)",
          background: "rgba(16,185,129,0.12)",
          color: "#10b981",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0,
          transition: "all var(--dur-move)",
        }}
      >
        {"▶"}
      </button>
      {showText && (
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontStyle: "italic" }}>
          {text}
        </span>
      )}
    </div>
  )
}
