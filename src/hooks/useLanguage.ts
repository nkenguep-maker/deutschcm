"use client"
import { useState, useEffect, useCallback } from "react"
import type { AppLanguage } from "@/lib/i18n"
import { TRANSLATIONS } from "@/lib/i18n"

export function useLanguage() {
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
    const translations = TRANSLATIONS[lang] as Record<string, Record<string, string | Record<string, string>>>
    return translations?.[section]?.[key] as string
      || (TRANSLATIONS.fr[section as keyof typeof TRANSLATIONS.fr] as Record<string, string | Record<string, string>>)?.[key] as string
      || key
  }, [lang])

  return { lang, changeLang, tr }
}
