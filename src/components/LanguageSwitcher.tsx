"use client"
import { useLanguage } from "@/hooks/useLanguage"

interface Props {
  style?: React.CSSProperties
}

export default function LanguageSwitcher({ style }: Props) {
  const { lang, changeLang } = useLanguage()

  return (
    <div style={{
      display: "flex", gap: 4, padding: 3,
      borderRadius: 99,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)",
      ...style
    }}>
      {[
        { code: "fr" as const, flag: "🇫🇷", label: "FR" },
        { code: "en" as const, flag: "🇬🇧", label: "EN" },
      ].map(l => (
        <button
          key={l.code}
          onClick={() => changeLang(l.code)}
          title={l.code === "fr" ? "Français" : "English"}
          style={{
            padding: "5px 10px",
            borderRadius: 99,
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: lang === l.code
              ? "linear-gradient(135deg,#10b981,#059669)"
              : "transparent",
            color: lang === l.code ? "white" : "rgba(255,255,255,0.5)",
            transition: "all 0.2s",
            fontFamily: "'DM Mono',monospace"
          }}
        >
          <span>{l.flag}</span>
          <span>{l.label}</span>
        </button>
      ))}
    </div>
  )
}
