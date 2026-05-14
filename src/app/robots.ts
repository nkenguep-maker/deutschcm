import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/courses", "/simulateur", "/discover", "/pricing", "/register", "/login"],
        disallow: ["/dashboard", "/teacher", "/center", "/admin", "/api/", "/onboarding/", "/settings"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/onboarding/"],
      }
    ],
    sitemap: "https://deutschcm.vercel.app/sitemap.xml",
    host: "https://deutschcm.vercel.app",
  }
}
