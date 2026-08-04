import { Plus_Jakarta_Sans } from "next/font/google";

// Plus Jakarta Sans — UI des nouveaux dashboards YEMA.
// JetBrains Mono est déjà chargé au niveau du layout racine (globals.css),
// on réutilise sa variable existante (--font-jetbrains) via le shell.
export const yemaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--yema-font-jakarta",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
