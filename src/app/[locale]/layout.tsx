import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import { TestSpaceBar } from "@/components/TestSpaceBar"

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
      "Une plateforme indépendante alignée CECRL, ouverte aux langues natales africaines et aux langues étrangères. Premier chapitre : l'allemand.",
    ogDescription:
      "Yema — apprenez, préparez-vous, appartenez. Interactif, correction en direct, simulations réalistes. Premier chapitre : l'allemand.",
    twitterDescription:
      "Apprenez une langue, préparez votre projet, appartenez à la maison. On commence par l'allemand.",
    ogImageAlt: "Yema Languages — langues étrangères et natales, apprentissage aligné CECRL",
    ogLocale: "fr_FR",
  },
  en: {
    title: "Yema Languages — Learn, prepare, belong",
    ogTitle: "Yema Languages — Learn, prepare, belong",
    twitterTitle: "Yema — learn a language, prepare your journey",
    description:
      "An independent CEFR-aligned platform, open to African native languages and to foreign ones. First chapter: German.",
    ogDescription:
      "Yema — learn, prepare, belong. Interactive, live correction, realistic simulations. First chapter: German.",
    twitterDescription:
      "Learn a language, prepare your journey, belong to the house. We start with German.",
    ogImageAlt: "Yema Languages — foreign and native languages, CEFR-aligned learning",
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
      // OG image localisée · /fr/opengraph-image vs /en/opengraph-image.
      // Next génère la route par locale grâce à opengraph-image.tsx
      // dans [locale]/ — il faut la cibler explicitement, sinon on
      // hérite du /opengraph-image racine qui n'existe pas.
      images: [{ url: `/${key}/opengraph-image`, width: 1200, height: 630, alt: m.ogImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: m.twitterTitle,
      description: m.twitterDescription,
      // Même image locale que OG — Twitter s'aligne sur la carte OG.
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

  const messages = (await import(`../../../messages/${locale}.json`)).default

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <TestSpaceBar />
      {children}
    </NextIntlClientProvider>
  )
}
