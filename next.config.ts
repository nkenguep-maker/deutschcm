import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const PROD_SUPABASE_REF = "sbjhvlrkbyjckdxujjsk"
const PROD_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4UVkMjqMeWehEYvtDEEKeQ_k0vS61T3"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const isProductionSupabase = supabaseUrl.includes(PROD_SUPABASE_REF)

const BASE_SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Audio messages use the microphone. Other sensitive browser capabilities
    // are not needed by the current product surface.
    value: "camera=(), geolocation=(), microphone=(self), payment=(), usb=()",
  },
] as const

const nextConfig: NextConfig = {
  // The legacy anon JWT currently configured in Vercel Production is disabled.
  // Publishable keys are browser-safe by design. Scope this override strictly to
  // the Production project so P-1/Preview keeps its own environment key.
  env: isProductionSupabase
    ? { NEXT_PUBLIC_SUPABASE_ANON_KEY: PROD_SUPABASE_PUBLISHABLE_KEY }
    : undefined,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...BASE_SECURITY_HEADERS],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
