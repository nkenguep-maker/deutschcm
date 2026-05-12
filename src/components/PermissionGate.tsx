"use client"
import { usePermissions } from "@/hooks/usePermissions"
import type { UserRole, Permission } from "@/lib/permissions"

interface PermissionGateProps {
  children: React.ReactNode
  permission?: Permission
  role?: UserRole | UserRole[]
  fallback?: React.ReactNode
  showUpgrade?: boolean
}

export default function PermissionGate({
  children,
  permission,
  role,
  fallback,
  showUpgrade = false,
}: PermissionGateProps) {
  const { can, is, loading } = usePermissions()

  if (loading) return null

  const hasAccess = permission ? can(permission) : role ? is(role) : true

  if (!hasAccess) {
    if (showUpgrade) {
      return (
        <div style={{
          padding: "20px 24px", borderRadius: 14,
          background: "rgba(245,158,11,0.06)",
          border: "1px solid rgba(245,158,11,0.2)",
          textAlign: "center",
          fontFamily: "'DM Mono',monospace"
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
          <p style={{ color: "white", fontSize: 14, fontWeight: 700, margin: "0 0 6px", fontFamily: "'Syne',sans-serif" }}>
            Fonctionnalité Premium
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "0 0 16px" }}>
            Passez au plan Premium pour débloquer cette fonctionnalité.
          </p>
          <a href="/pricing"
            style={{ display: "inline-block", padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", textDecoration: "none", fontSize: 13, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>
            ⭐ Voir les plans
          </a>
        </div>
      )
    }
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}
