import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"

export const metadata: Metadata = {
  metadataBase: new URL("https://deutschcm.vercel.app"),
  title: {
    default: "Yema — Apprenez l'allemand au Cameroun | IA + Goethe A1-C1",
    template: "%s | Yema"
  },
  description: "Plateforme d'apprentissage de l'allemand conçue pour le Cameroun. Simulateur ambassade IA, correction vocale, quiz adaptatif. Préparation Goethe-Zertifikat A1→C1. Gratuit.",
  keywords: [
    "allemand cameroun", "apprendre allemand", "goethe zertifikat",
    "visa allemagne", "yema", "cours allemand douala",
    "cours allemand yaounde", "apprentissage allemand afrique",
    "simulateur visa allemand", "test niveau allemand",
    "netzwerk neu", "aspekte neu", "certificat goethe"
  ],
  authors: [{ name: "Yema Team" }],
  creator: "Yema",
  publisher: "Yema",
  category: "education",
  openGraph: {
    type: "website",
    locale: "fr_CM",
    alternateLocale: ["fr_FR", "en_US"],
    url: "https://deutschcm.vercel.app",
    siteName: "Yema",
    title: "Yema — Apprenez l'allemand avec l'IA au Cameroun",
    description: "Le seul LMS d'allemand conçu pour le marché camerounais. Simulateur ambassade IA, voix natives Azure, quiz adaptatif Gemini. Préparation Goethe A1→C1.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Yema — Apprenez l'allemand au Cameroun" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Yema — Apprenez l'allemand avec l'IA",
    description: "Simulateur ambassade IA · Correction vocale · Quiz adaptatif · Goethe A1-C1 · Cameroun",
    images: ["/opengraph-image"],
    creator: "@yema"
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://deutschcm.vercel.app",
    languages: {
      "fr-CM": "https://deutschcm.vercel.app/fr",
      "en": "https://deutschcm.vercel.app/en"
    }
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate the locale
  if (!routing.locales.includes(locale as "fr" | "en")) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
