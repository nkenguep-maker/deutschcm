"use client"
import { usePermissions } from "@/hooks/usePermissions"

interface PlanGateProps {
  children: React.ReactNode
  requiredPlan: "BASIC" | "PREMIUM" | "ANNUAL"
  fallback?: React.ReactNode
}

const PLAN_ORDER = ["FREE", "BASIC", "PREMIUM", "ANNUAL"]

export default function PlanGate({ children, requiredPlan, fallback }: PlanGateProps) {
  const { profile, loading } = usePermissions()

  if (loading) return null

  const userPlanIndex = PLAN_ORDER.indexOf(profile?.plan || "FREE")
  const requiredPlanIndex = PLAN_ORDER.indexOf(requiredPlan)
  const hasAccess = userPlanIndex >= requiredPlanIndex

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : (
      <div style={{
        padding: "16px 20px", borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", gap: 12,
        fontFamily: "'DM Mono',monospace"
      }}>
        <span style={{ fontSize: 24 }}>🔒</span>
        <div style={{ flex: 1 }}>
          <p style={{ color: "white", fontSize: 13, fontWeight: 700, margin: "0 0 2px", fontFamily: "'Syne',sans-serif" }}>
            Plan {requiredPlan} requis
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>
            Votre plan actuel : {profile?.plan || "FREE"}
          </p>
        </div>
        <a href="/pricing"
          style={{ padding: "7px 14px", borderRadius: 8, background: "linear-gradient(135deg,#10b981,#059669)", color: "white", textDecoration: "none", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
          Upgrader →
        </a>
      </div>
    )
  }

  return <>{children}</>
}
