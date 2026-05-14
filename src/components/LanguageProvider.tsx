"use client"
// Compatibility shim — translations now served by next-intl via NextIntlClientProvider in layout.tsx
// Use useTranslations() from "next-intl" directly in components instead of useLang()
export { useLocale as useLang } from "next-intl"
export { useTranslations } from "next-intl"

// Re-export a no-op provider for any legacy import
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
