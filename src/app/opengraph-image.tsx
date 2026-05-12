import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "DeutschCM — Apprenez l'allemand au Cameroun"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%",
        background: "linear-gradient(135deg, #080c10 0%, #0f1a14 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "sans-serif", position: "relative"
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", width: 600, height: 600,
          borderRadius: "50%", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%)",
        }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div style={{ fontSize: 64 }}>🇩🇪</div>
          <div style={{ fontWeight: 900, fontSize: 56, color: "white" }}>
            Deutsch<span style={{ color: "#10b981" }}>CM</span>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.7)", marginBottom: 24, textAlign: "center", maxWidth: 800 }}>
          Apprenez l&apos;allemand avec l&apos;IA · A1 → C1
        </div>

        {/* Badges */}
        <div style={{ display: "flex", gap: 16 }}>
          {["🏛️ Simulateur IA", "🎧 Audio natif", "🎯 Quiz adaptatif", "📊 Goethe A1-C1"].map(badge => (
            <div key={badge} style={{
              padding: "8px 20px", borderRadius: 99,
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.3)",
              color: "#10b981", fontSize: 18, fontWeight: 600
            }}>
              {badge}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ position: "absolute", bottom: 32, color: "rgba(255,255,255,0.3)", fontSize: 16 }}>
          deutschcm.vercel.app · 🇨🇲 Conçu pour le Cameroun
        </div>
      </div>
    ),
    { ...size }
  )
}
