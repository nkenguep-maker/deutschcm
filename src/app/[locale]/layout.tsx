import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import { TestSpaceBar } from "@/components/TestSpaceBar"
import { QaTestBar } from "@/components/qa/QaTestBar"
import { isQaModeActive } from "@/lib/qa/config"

// SEO · métadonnées localisées par locale. Le canonique et les
// alternates hreflang pointent vers l'URL locale (jamais la racine)
// pour éviter le duplicate content FR/EN vu par Google. Le domaine
// canonique est configurable via NEXT_PUBLIC_SITE_URL — aujourd'hui
// deutschcm.vercel.app, demain yema.app sans re-déploiement de code.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://deutschcm.vercel.app").replace(/\/$/, "")

// Copies bilingues gardées ici pour rester au plus près de la balise
// meta — jamais dans messages/*.json (SEO doit être stable côté SSR).
const META = {
  fr: {
    title: "Yema Languages — Apprenez, préparez-vous, appartenez",
    ogTitle: "Yema Languages — Apprenez, préparez-vous, appartenez",
    twitterTitle: "Yema — apprenez une langue, préparez votre projet",
    description:
      "Yema réunit des parcours de langues du monde et de langues africaines dans une même maison d'apprentissage. Le premier parcours complet disponible est l'allemand A1.",
    ogDescription:
      "Yema réunit langues du monde et langues africaines dans des parcours distincts, avec progression sauvegardée et expériences adaptées à chaque univers.",
    twitterDescription:
      "Langues du monde, langues africaines, une seule maison. Commencez par les parcours actuellement disponibles sur Yema.",
    ogImageAlt: "Yema Languages — langues du monde et africaines",
    ogLocale: "fr_FR",
  },
  en: {
    title: "Yema Languages — Learn, prepare, belong",
    ogTitle: "Yema Languages — Learn, prepare, belong",
    twitterTitle: "Yema — learn a language, prepare your journey",
    description:
      "Yema brings world-language and African-language journeys into one learning home. The first complete course currently available is German A1.",
    ogDescription:
      "Yema brings world languages and African languages into distinct learning journeys with saved progress and experiences adapted to each universe.",
    twitterDescription:
      "World languages, African languages, one home. Start with the journeys currently available on Yema.",
    ogImageAlt: "Yema Languages — world and African languages",
    ogLocale: "en_US",
  },
} as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isEn = locale === "en"
  const key: "fr" | "en" = isEn ? "en" : "fr"
  const m = META[key]
  const url = `${SITE_URL}/${key}`
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: m.title,
      template: "%s | Yema",
    },
    description: m.description,
    keywords: [
      "yema languages",
      "learn german", "german learning platform", "CEFR A1 C1",
      "apprendre allemand", "langues africaines",
      "language learning africa", "study in germany", "german for beginners",
      "language preparation", "international learning platform",
    ],
    authors: [{ name: "Yema Team" }],
    creator: "Yema",
    publisher: "Yema",
    category: "education",
    openGraph: {
      type: "website",
      locale: m.ogLocale,
      alternateLocale: [isEn ? "fr_FR" : "en_US"],
      url,
      siteName: "Yema",
      title: m.ogTitle,
      description: m.ogDescription,
      images: [{ url: `/${key}/opengraph-image`, width: 1200, height: 630, alt: m.ogImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: m.twitterTitle,
      description: m.twitterDescription,
      images: [`/${key}/opengraph-image`],
      creator: "@yema",
    },
    robots: { index: true, follow: true },
    alternates: {
      canonical: url,
      languages: {
        "fr": `${SITE_URL}/fr`,
        "en": `${SITE_URL}/en`,
        "x-default": `${SITE_URL}/fr`,
      },
    },
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

  if (!routing.locales.includes(locale as "fr" | "en")) {
    notFound()
  }
  const qaModeActive = isQaModeActive()

  // next-intl inherits locale/messages from src/i18n/request.ts when this
  // provider is rendered by a Server Component. Avoid importing the same
  // locale JSON a second time in the layout.
  return (
    <NextIntlClientProvider>
      {qaModeActive ? <QaTestBar /> : null}
      <TestSpaceBar />
      {children}
    </NextIntlClientProvider>
  )
}
