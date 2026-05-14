import { proxy } from "@/proxy"
import type { NextRequest } from "next/server"

export default function middleware(request: NextRequest) {
  return proxy(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)"],
}
