import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const raw = cookieStore.get("app_language")?.value
  const locale = raw === "en" ? "en" : "fr"

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
