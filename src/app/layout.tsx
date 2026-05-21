import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/contexts/ThemeContext"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

// Runs before React hydration to avoid flash of wrong theme
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('yema-theme');var e='dark';if(t==='light')e='light';else if(t==='dark')e='dark';else{if(window.matchMedia('(prefers-color-scheme: light)').matches)e='light';else if(window.matchMedia('(prefers-color-scheme: dark)').matches)e='dark';else{var h=new Date().getHours();e=(h>=7&&h<19)?'light':'dark';}}document.documentElement.dataset.theme=e;}catch(err){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
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
