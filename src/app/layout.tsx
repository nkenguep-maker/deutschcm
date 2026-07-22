import type { Viewport } from "next"
import { Fraunces, JetBrains_Mono, Manrope } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/contexts/ThemeContext"

// Next 16 metadata · viewport-fit=cover libère env(safe-area-inset-*)
// pour les shells authentifiés (dashboards, layouts fixes). N'affecte
// pas la landing qui gère ses propres marges d'ambiance.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

// Kaffeehaus — Fraunces (display, contrast serif), Manrope (humanist body),
// JetBrains Mono (utility, CEFR numerals).
// Trimmed weights → tient sous la limite Vercel Edge (1 MB).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  style: ["normal", "italic"],
})
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
})
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  weight: ["500"],
})

// Always force dark mode — light mode not yet released
const THEME_SCRIPT = `document.documentElement.dataset.theme='dark';`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${manrope.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
