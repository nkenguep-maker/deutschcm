import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion"

interface IntroSlideProps {
  title: string
  subtitle: string
  level: string
  manuel: string
  lektion: number
  backgroundColor?: string
  accentColor?: string
}

export const IntroSlide = ({
  title, subtitle, level, manuel, lektion,
  backgroundColor = "#080c10",
  accentColor = "#10b981"
}: IntroSlideProps) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const titleOpacity = spring({ frame, fps, config: { damping: 20 }, delay: 10 })
  const subtitleOpacity = spring({ frame, fps, config: { damping: 20 }, delay: 20 })
  const badgeOpacity = spring({ frame, fps, config: { damping: 20 }, delay: 5 })
  const titleY = interpolate(spring({ frame, fps, delay: 10 }), [0, 1], [40, 0])
  const subtitleY = interpolate(spring({ frame, fps, delay: 20 }), [0, 1], [30, 0])

  return (
    <AbsoluteFill style={{ backgroundColor, fontFamily: "sans-serif", justifyContent: "center", alignItems: "center" }}>
      {/* Background grid */}
      <AbsoluteFill style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: "60px 60px"
      }} />

      {/* Glow */}
      <div style={{
        position: "absolute", width: 600, height: 600,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${accentColor}15, transparent 70%)`,
        filter: "blur(80px)"
      }} />

      {/* Content */}
      <div style={{ textAlign: "center", zIndex: 10, padding: "0 80px" }}>
        {/* Badge niveau */}
        <div style={{
          opacity: badgeOpacity,
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 20px", borderRadius: 99,
          background: `${accentColor}20`,
          border: `1px solid ${accentColor}40`,
          marginBottom: 32
        }}>
          <span style={{ color: accentColor, fontSize: 18, fontWeight: 700 }}>
            {level}
          </span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>·</span>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            {manuel} · Lektion {lektion}
          </span>
        </div>

        {/* Titre */}
        <div style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 72, fontWeight: 900, color: "white",
          lineHeight: 1.1, marginBottom: 20,
          textShadow: `0 0 60px ${accentColor}30`
        }}>
          {title}
        </div>

        {/* Sous-titre */}
        <div style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          fontSize: 28, color: "rgba(255,255,255,0.5)",
          fontWeight: 400
        }}>
          {subtitle}
        </div>

        {/* Logo */}
        <div style={{
          marginTop: 48, opacity: subtitleOpacity,
          fontSize: 22, fontWeight: 700,
          color: accentColor
        }}>
          🇩🇪 DeutschCM
        </div>
      </div>
    </AbsoluteFill>
  )
}
