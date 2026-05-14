"use client"
import { useLocale } from "next-intl"
import { useRouter, usePathname } from "@/navigation"

interface Props {
  style?: React.CSSProperties
}

export default function LanguageSwitcher({ style }: Props) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <div style={{
      display: "flex", gap: 4, padding: 3,
      borderRadius: 99,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)",
      ...style
    }}>
      {[
        { code: "fr", flag: "🇫🇷", label: "FR", title: "Français" },
        { code: "en", flag: "🇬🇧", label: "EN", title: "English" },
      ].map(l => (
        <button
          key={l.code}
          onClick={() => switchLocale(l.code)}
          title={l.title}
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
            background: locale === l.code
              ? "linear-gradient(135deg,#10b981,#059669)"
              : "transparent",
            color: locale === l.code ? "white" : "rgba(255,255,255,0.5)",
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
