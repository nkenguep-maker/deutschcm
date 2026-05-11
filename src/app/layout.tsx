import type { Metadata } from "next";
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
  title: "DeutschCM — Apprenez l'allemand au Cameroun | IA + Goethe A1-C1",
  description: "Plateforme d'apprentissage de l'allemand conçue pour le Cameroun. Simulateur ambassade IA, correction vocale, quiz adaptatif. Préparation Goethe-Zertifikat A1→C1. Gratuit.",
  keywords: "allemand cameroun, apprendre allemand, goethe zertifikat, visa allemagne, deutschcm, cours allemand douala yaounde",
  openGraph: {
    title: "DeutschCM — Apprenez l'allemand avec l'IA",
    description: "Le seul LMS d'allemand conçu pour le marché camerounais avec IA conversationnelle",
    url: "https://deutschcm.vercel.app",
    siteName: "DeutschCM",
    locale: "fr_CM",
    type: "website",
  },
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
