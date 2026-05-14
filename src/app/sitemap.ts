import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://deutschcm.vercel.app"
  const now = new Date()

  const staticPages = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/register`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${baseUrl}/courses`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${baseUrl}/simulateur`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/discover`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/hoeren/demo`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${baseUrl}/schreiben/demo`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${baseUrl}/quiz/demo`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 },
  ]

  const coursePages = [
    "netzwerk-a1", "netzwerk-a2", "netzwerk-b1",
    "aspekte-b2", "aspekte-c1"
  ].map(course => ({
    url: `${baseUrl}/courses/${course}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8
  }))

  const modulePages = [
    "lektion-1-lesen", "lektion-1-hoeren",
    "lektion-1-sprechen", "lektion-1-schreiben", "lektion-1-quiz"
  ].map(mod => ({
    url: `${baseUrl}/courses/netzwerk-a1/modules/${mod}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6
  }))

  return [...staticPages, ...coursePages, ...modulePages]
}
