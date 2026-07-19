import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /histoires est devenue /veillee (audit véracité · plus de
      // personas, uniquement des voix réelles validées). Redirection
      // permanente 308 pour préserver le SEO existant.
      {
        source: "/:locale(fr|en)/histoires",
        destination: "/:locale/veillee",
        permanent: true,
      },
      {
        source: "/:locale(fr|en)/histoires/:path*",
        destination: "/:locale/veillee/:path*",
        permanent: true,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
