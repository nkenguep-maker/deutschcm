import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import { TestSpaceBar } from "@/components/TestSpaceBar"

export const metadata: Metadata = {
  metadataBase: new URL("https://deutschcm.vercel.app"),
  title: {
    default: "Yema Languages | Learn a language, prepare and belong",
    template: "%s | Yema"
  },
  description: "Yema helps learners build language skills, practice speaking and prepare for their international journey. First destination: German and Germany.",
  keywords: [
    "learn german", "german learning platform", "CEFR A1 C1",
    "yema languages", "apprendre allemand", "cours allemand cameroun",
    "language learning africa", "study in germany", "german for beginners",
    "language preparation", "international learning platform"
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
    title: "Learn. Prepare. Belong. — Yema Languages",
    description: "Start with German and prepare your international future with Yema. Interactive lessons, speaking practice and realistic simulations.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Yema — Apprenez l'allemand au Cameroun" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Yema — Apprenez l'allemand avec l'IA",
    description: "Learn a language, prepare for life abroad, and belong. Starting with German and Germany.",
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

  // Load messages directly from file to guarantee the right locale is used
  const messages = (await import(`../../../messages/${locale}.json`)).default

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <TestSpaceBar />
      {children}
    </NextIntlClientProvider>
  )
}
