import { ImageResponse } from "next/og"

// OG image YEMA · variante Confluent. Fond --seuil-bg, Confluent
// grand à gauche, wordmark et slogan à droite. Aucune police externe
// (sans-serif système) pour tenir sous la limite.

export const runtime = "nodejs"
export const alt = "YEMA Languages — L'Afrique parle. Toutes ses langues."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

interface OGParams {
  params: Promise<{ locale: string }>
}

export default async function Image({ params }: OGParams) {
  const { locale } = await params
  const isEn = locale === "en"
  const line1 = isEn ? "Africa speaks." : "L'Afrique parle."
  const line2 = isEn ? "All her tongues." : "Toutes ses langues."
  const tagline = isEn ? "Your way. Your voice." : "Votre voie. Votre voix."

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#120C06",
          display: "flex",
          fontFamily: "sans-serif",
          position: "relative",
          padding: "80px 90px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Braise centrale — radial laiton pour rappeler le seuil */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 900,
            height: 900,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(184,135,62,0.28) 0%, rgba(122,40,48,0.10) 35%, transparent 70%)",
            filter: "blur(3px)",
          }}
        />

        {/* Colonne gauche — Confluent monumental */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 420,
            zIndex: 2,
          }}
        >
          <svg viewBox="0 0 100 120" width="380" height="456" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ogBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#D9A855" />
                <stop offset="1" stopColor="#B8873E" />
              </linearGradient>
              <radialGradient id="ogBe" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#F0CE8B" />
                <stop offset="1" stopColor="#D9A855" />
              </radialGradient>
            </defs>
            <path d="M26 12 C33 30 41 46 50 58" stroke="url(#ogBg)" strokeWidth="13" strokeLinecap="round" fill="none" />
            <path d="M77 14 C71 20 69 28 65 36 C61 44 56 52 50 58" stroke="url(#ogBg)" strokeWidth="13" strokeLinecap="round" fill="none" />
            <path d="M50 58 L50 103" stroke="url(#ogBg)" strokeWidth="14" strokeLinecap="round" fill="none" />
            <circle cx="50" cy="58" r="10" fill="rgba(184, 135, 62, 0.25)" />
            <circle cx="50" cy="58" r="6.5" fill="url(#ogBe)" />
          </svg>
        </div>

        {/* Colonne droite — wordmark + titre + slogan */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            flex: 1,
            zIndex: 2,
            paddingLeft: 24,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "0.34em",
              color: "#F4EBDC",
              marginBottom: 40,
            }}
          >
            YEMA
          </div>

          <div
            style={{
              fontFamily: "serif",
              fontSize: 82,
              fontWeight: 400,
              color: "#F4EBDC",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              marginBottom: 4,
            }}
          >
            {line1}
          </div>
          <div
            style={{
              fontFamily: "serif",
              fontSize: 82,
              fontWeight: 400,
              fontStyle: "italic",
              color: "#B8873E",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              marginBottom: 32,
            }}
          >
            {line2}
          </div>

          <div
            style={{
              fontFamily: "serif",
              fontStyle: "italic",
              fontSize: 24,
              color: "rgba(244,235,220,0.72)",
              lineHeight: 1.4,
              maxWidth: 480,
            }}
          >
            {tagline}
          </div>

          <div
            style={{
              marginTop: 40,
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "rgba(244,235,220,0.45)",
              fontSize: 16,
              letterSpacing: "0.06em",
            }}
          >
            <span>YEMA Languages</span>
            <span style={{ color: "rgba(244,235,220,0.24)" }}>·</span>
            <span>{isEn ? "Africa speaks — world & African languages" : "L'Afrique parle — langues du monde & africaines"}</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
