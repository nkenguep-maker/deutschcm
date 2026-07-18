import { ImageResponse } from "next/og"

// Node.js runtime — l'Edge runtime plafonne à 1 MB, @vercel/og + fonts
// next/font gonflent au-delà. Node runtime a 50 MB de marge.
export const runtime = "nodejs"
export const alt = "YEMA Languages — L'Afrique parle. Toutes ses langues."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// OG image Kaffeehaus — palette espresso/crème/laiton, tagline éditoriale,
// CEFR spine A1→C1 en signature à droite. Aucune police externe (sans-serif
// système) pour tenir sous 1 MB en Edge.

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1B120A",
          display: "flex",
          fontFamily: "sans-serif",
          position: "relative",
          padding: "72px 80px",
        }}
      >
        {/* Warm radial light — coin haut gauche, pas centré générique */}
        <div
          style={{
            position: "absolute",
            top: -220,
            left: -180,
            width: 720,
            height: 720,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(184,135,62,0.22) 0%, transparent 65%)",
          }}
        />

        {/* Colonne gauche — mark + tagline + eye */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            zIndex: 2,
            paddingRight: 48,
          }}
        >
          {/* Mark : Y sérif dans un carré laiton */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 10,
                border: "1.5px solid rgba(184,135,62,0.55)",
                background: "rgba(184,135,62,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "serif",
                  fontSize: 34,
                  fontStyle: "italic",
                  color: "#B8873E",
                  fontWeight: 500,
                }}
              >
                Y
              </div>
            </div>
            <div
              style={{
                fontFamily: "serif",
                fontSize: 36,
                fontStyle: "italic",
                color: "#F4EBDC",
                letterSpacing: "-0.015em",
                fontWeight: 500,
              }}
            >
              Yema
            </div>
          </div>

          {/* Tagline centrale */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Eye */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                color: "#B8873E",
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 1.5,
                  background: "#B8873E",
                }}
              />
              1re plateforme africaine · Bêta 2026
            </div>

            {/* Titre editorial */}
            <div
              style={{
                fontFamily: "serif",
                fontSize: 96,
                fontWeight: 400,
                color: "#F4EBDC",
                lineHeight: 1.02,
                letterSpacing: "-0.028em",
                marginBottom: 8,
              }}
            >
              L&apos;Afrique parle.
            </div>
            <div
              style={{
                fontFamily: "serif",
                fontSize: 96,
                fontWeight: 400,
                fontStyle: "italic",
                color: "#B8873E",
                lineHeight: 1.02,
                letterSpacing: "-0.028em",
              }}
            >
              Toutes ses langues.
            </div>
          </div>

          {/* Bottom line */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "rgba(244,235,220,0.55)",
              fontSize: 18,
              letterSpacing: "0.03em",
            }}
          >
            <span>yema.app</span>
            <span style={{ color: "rgba(244,235,220,0.25)" }}>·</span>
            <span>Conçu au Cameroun</span>
          </div>
        </div>

        {/* Colonne droite — CEFR spine signature */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            width: 200,
            zIndex: 2,
            position: "relative",
          }}
        >
          {/* La colonne verticale — laiton du haut jusqu'à A1, filet ensuite */}
          <div
            style={{
              position: "absolute",
              left: 15,
              top: 0,
              bottom: 0,
              width: 1.5,
              background:
                "linear-gradient(to bottom, #B8873E 0%, #B8873E 20%, rgba(244,235,220,0.14) 20%, rgba(244,235,220,0.14) 100%)",
            }}
          />

          {LEVELS.map((lvl, i) => {
            const isCurrent = i === 0 // A1 active
            const isDone = i < 0
            return (
              <div
                key={lvl}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  height: 96,
                  color: isCurrent
                    ? "#F4EBDC"
                    : isDone
                      ? "rgba(244,235,220,0.72)"
                      : "rgba(244,235,220,0.44)",
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    background: isCurrent || isDone ? "#B8873E" : "#1B120A",
                    border: "1.5px solid",
                    borderColor:
                      isCurrent || isDone
                        ? "#B8873E"
                        : "rgba(244,235,220,0.18)",
                    boxShadow: isCurrent
                      ? "0 0 0 8px rgba(184,135,62,0.18)"
                      : "none",
                  }}
                />
                <div
                  style={{
                    fontFamily: "serif",
                    fontSize: 22,
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {lvl}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    ),
    { ...size },
  )
}
