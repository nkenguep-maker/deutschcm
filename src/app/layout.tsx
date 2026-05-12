import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://deutschcm.vercel.app"),
  title: {
    default: "DeutschCM — Apprenez l'allemand au Cameroun | IA + Goethe A1-C1",
    template: "%s | DeutschCM"
  },
  description: "Plateforme d'apprentissage de l'allemand conçue pour le Cameroun. Simulateur ambassade IA, correction vocale, quiz adaptatif. Préparation Goethe-Zertifikat A1→C1. Gratuit.",
  keywords: [
    "allemand cameroun", "apprendre allemand", "goethe zertifikat",
    "visa allemagne", "deutschcm", "cours allemand douala",
    "cours allemand yaounde", "apprentissage allemand afrique",
    "simulateur visa allemand", "test niveau allemand",
    "netzwerk neu", "aspekte neu", "certificat goethe"
  ],
  authors: [{ name: "DeutschCM Team" }],
  creator: "DeutschCM",
  publisher: "DeutschCM",
  category: "education",
  classification: "Language Learning",
  openGraph: {
    type: "website",
    locale: "fr_CM",
    alternateLocale: ["fr_FR", "en_US"],
    url: "https://deutschcm.vercel.app",
    siteName: "DeutschCM",
    title: "DeutschCM — Apprenez l'allemand avec l'IA au Cameroun",
    description: "Le seul LMS d'allemand conçu pour le marché camerounais. Simulateur ambassade IA, voix natives Azure, quiz adaptatif Gemini. Préparation Goethe A1→C1.",
    images: [{
      url: "/opengraph-image",
      width: 1200,
      height: 630,
      alt: "DeutschCM — Apprenez l'allemand au Cameroun"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "DeutschCM — Apprenez l'allemand avec l'IA",
    description: "Simulateur ambassade IA · Correction vocale · Quiz adaptatif · Goethe A1-C1 · Cameroun",
    images: ["/opengraph-image"],
    creator: "@deutschcm"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    }
  },
  verification: {
    google: "your-google-verification-code",
  },
  alternates: {
    canonical: "https://deutschcm.vercel.app",
    languages: {
      "fr-CM": "https://deutschcm.vercel.app",
      "fr-FR": "https://deutschcm.vercel.app",
    }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
