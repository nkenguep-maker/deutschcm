"use client"
import { useState, useEffect } from "react"

interface Props {
  error: string | null
  onRetry: () => void
  loading?: boolean
}

export default function AIErrorBoundary({ error, onRetry, loading }: Props) {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (!error) return
    const t = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(t); onRetry(); return 3 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [error])

  if (!error) return null

  return (
    <div style={{ padding:"16px 20px", borderRadius:12, background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", textAlign:"center" }}>
      <p style={{ color:"#f59e0b", fontSize:13, margin:"0 0 8px" }}>
        ⏳ Notre IA reprend son souffle...
      </p>
      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:11, margin:"0 0 12px" }}>
        Nouvelle tentative dans {countdown}s
      </p>
      <button onClick={onRetry}
        style={{ padding:"8px 16px", borderRadius:8, background:"rgba(245,158,11,0.15)", border:"1px solid rgba(245,158,11,0.3)", color:"#f59e0b", fontSize:12, cursor:"pointer" }}>
        🔄 Réessayer maintenant
      </button>
    </div>
  )
}
