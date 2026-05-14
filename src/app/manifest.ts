import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yema — Apprenez l'allemand",
    short_name: "Yema",
    description: "Plateforme d'apprentissage de l'allemand avec IA pour le Cameroun",
    start_url: "/",
    display: "standalone",
    background_color: "#080c10",
    theme_color: "#10b981",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ],
    categories: ["education", "language"],
    lang: "fr",
    dir: "ltr",
    shortcuts: [
      {
        name: "Simulateur",
        url: "/simulateur",
        description: "Simulateur Ambassade IA"
      },
      {
        name: "Mes Cours",
        url: "/courses",
        description: "Accéder aux cours"
      }
    ]
  }
}
