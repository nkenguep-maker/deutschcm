import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion"

interface GrammarSlideProps {
  rule: string
  ruleDE: string
  level: string
  table: {
    headers: string[]
    rows: string[][]
  }
}

export const GrammarSlide = ({ rule, ruleDE, level, table }: GrammarSlideProps) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const titleAnim = spring({ frame, fps, config: { damping: 20 }, delay: 5 })
  const tableAnim = spring({ frame, fps, config: { damping: 20 }, delay: 15 })

  return (
    <AbsoluteFill style={{
      backgroundColor: "#080c10",
      fontFamily: "sans-serif",
      padding: "60px 80px"
    }}>
      <AbsoluteFill style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: "60px 60px"
      }} />

      <div style={{ zIndex: 10 }}>
        {/* Badge */}
        <div style={{
          opacity: titleAnim,
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "5px 16px", borderRadius: 99,
          background: "rgba(16,185,129,0.12)",
          border: "1px solid rgba(16,185,129,0.25)",
          marginBottom: 16
        }}>
          <span style={{ color: "#10b981", fontSize: 16 }}>📝 Grammaire · {level}</span>
        </div>

        {/* Titre */}
        <div style={{
          opacity: titleAnim,
          transform: `translateY(${interpolate(titleAnim, [0,1],[20,0])}px)`,
          fontSize: 42, fontWeight: 800, color: "white", marginBottom: 8
        }}>
          {rule}
        </div>
        <div style={{
          opacity: titleAnim,
          fontSize: 22, color: "rgba(255,255,255,0.4)",
          marginBottom: 40, fontStyle: "italic"
        }}>
          {ruleDE}
        </div>

        {/* Tableau */}
        <div style={{
          opacity: tableAnim,
          transform: `translateY(${interpolate(tableAnim, [0,1],[30,0])}px)`,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, overflow: "hidden"
        }}>
          {/* Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${table.headers.length}, 1fr)`,
            background: "rgba(16,185,129,0.1)",
            borderBottom: "1px solid rgba(16,185,129,0.2)"
          }}>
            {table.headers.map((h, i) => (
              <div key={i} style={{
                padding: "16px 24px",
                color: "#10b981", fontSize: 16, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em"
              }}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {table.rows.map((row, i) => {
            const rowAnim = spring({ frame, fps, delay: 15 + i * 5 })
            return (
              <div key={i} style={{
                opacity: rowAnim,
                display: "grid",
                gridTemplateColumns: `repeat(${table.headers.length}, 1fr)`,
                borderBottom: i < table.rows.length - 1
                  ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: i % 2 === 0
                  ? "transparent" : "rgba(255,255,255,0.01)"
              }}>
                {row.map((cell, j) => (
                  <div key={j} style={{
                    padding: "14px 24px",
                    color: j === 0 ? "#10b981" : j === 1
                      ? "white" : "rgba(255,255,255,0.5)",
                    fontSize: j === 1 ? 20 : 16,
                    fontWeight: j === 1 ? 700 : 400,
                    fontStyle: j === 2 ? "italic" : "normal"
                  }}>
                    {cell}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </AbsoluteFill>
  )
}
