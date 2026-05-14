import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://deutschcm.vercel.app"),
  title: {
    default: "Yema — Apprenez l'allemand au Cameroun | IA + Goethe A1-C1",
    template: "%s | Yema"
  },
  description: "Plateforme d'apprentissage de l'allemand conçue pour le Cameroun. Simulateur ambassade IA, correction vocale, quiz adaptatif. Préparation Goethe-Zertifikat A1→C1. Gratuit.",
  keywords: [
    "allemand cameroun", "apprendre allemand", "goethe zertifikat",
    "visa allemagne", "deutschcm", "cours allemand douala",
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
    description: "Le seul LMS d'allemand conçu pour le marché camerounais. Simulateur ambassade IA, voix natives, quiz adaptatif. Préparation Goethe A1→C1.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Yema — Apprenez l'allemand au Cameroun" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Yema — Apprenez l'allemand avec l'IA",
    description: "Simulateur ambassade IA · Correction vocale · Quiz adaptatif · Goethe A1-C1 · Cameroun",
    images: ["/opengraph-image"],
    creator: "@deutschcm"
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://deutschcm.vercel.app",
    languages: { "fr-CM": "https://deutschcm.vercel.app", "fr-FR": "https://deutschcm.vercel.app" }
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
