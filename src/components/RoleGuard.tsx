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
        minHeight: "100vh", background: "#080c10",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1s linear infinite" }}>⚙️</div>
          <p style={{ color: "#10b981", fontSize: 13, fontFamily: "'DM Mono',monospace" }}>
            Vérification des permissions...
          </p>
        </div>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    )
  }

  if (!profile || !is(allowedRoles)) return null

  return <>{children}</>
}
