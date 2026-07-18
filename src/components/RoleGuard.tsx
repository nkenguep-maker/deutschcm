"use client"
import { usePermissions } from "@/hooks/usePermissions"
import { useRouter } from "@/navigation"
import { useEffect } from "react"
import type { UserRole } from "@/lib/permissions"
import { getDefaultRedirect } from "@/lib/permissions"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  redirectTo?: string
}

export default function RoleGuard({
  children,
  allowedRoles,
  redirectTo,
}: RoleGuardProps) {
  const { profile, loading, is } = usePermissions()
  const router = useRouter()

  useEffect(() => {
    if (!loading && profile) {
      if (!is(allowedRoles)) {
        const redirect = redirectTo || getDefaultRedirect(profile.role)
        router.replace(redirect)
      }
    }
  }, [profile, loading, allowedRoles, redirectTo, router, is])

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--espresso)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: "var(--brass)", margin: "0 auto 14px",
            animation: "motion-pulse 960ms var(--ease-enter) infinite",
          }} aria-hidden="true" />
          <p style={{ color: "var(--creme-mute)", fontSize: 12, fontFamily: "var(--font-jetbrains, monospace)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Vérification…
          </p>
        </div>
      </div>
    )
  }

  if (!profile || !is(allowedRoles)) return null

  return <>{children}</>
}
