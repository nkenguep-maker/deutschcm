"use client"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { AppLanguage } from "@/lib/i18n"
import { TRANSLATIONS } from "@/lib/i18n"

interface LanguageContextType {
  lang: AppLanguage
  changeLang: (lang: AppLanguage) => void
  tr: (section: keyof typeof TRANSLATIONS.fr, key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "fr",
  changeLang: () => {},
  tr: (_s, k) => k
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<AppLanguage>("fr")

  useEffect(() => {
    const saved = localStorage.getItem("app_language") as AppLanguage
    if (saved && ["fr", "en"].includes(saved)) {
      setLang(saved)
    } else {
      const browser = navigator.language.startsWith("en") ? "en" : "fr"
      setLang(browser)
    }
  }, [])

  const changeLang = useCallback((newLang: AppLanguage) => {
    setLang(newLang)
    localStorage.setItem("app_language", newLang)
    document.documentElement.lang = newLang
  }, [])

  const tr = useCallback((section: keyof typeof TRANSLATIONS.fr, key: string): string => {
    const translations = TRANSLATIONS[lang] as Record<string, Record<string, string>>
    return translations?.[section]?.[key]
      || (TRANSLATIONS.fr[section as keyof typeof TRANSLATIONS.fr] as Record<string, string>)?.[key]
      || key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, changeLang, tr }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}
