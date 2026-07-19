import { MetadataRoute } from "next"

// PWA manifest · aligné sur l'identité YEMA (Confluent + palette
// Kaffeehaus). background espresso, theme brass.

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YEMA Languages",
    short_name: "YEMA",
    description: "L'Afrique parle. Toutes ses langues — du monde et africaines, sous un même toit.",
    start_url: "/",
    display: "standalone",
    background_color: "#1B120A",
    theme_color: "#B8873E",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    categories: ["education", "language"],
    lang: "fr",
    dir: "ltr",
  }
}
