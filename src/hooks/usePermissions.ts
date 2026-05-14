"use client"
import { useState, useEffect } from "react"
import type { UserRole, Permission } from "@/lib/permissions"
import { hasPermission, hasRole, PLAN_LIMITS } from "@/lib/permissions"

interface UserProfile {
  role: UserRole
  plan: string
  onboardingDone: boolean
  germanLevel: string | null
  fullName: string
  email: string
  xpTotal: number
  streakDays: number
}

export function usePermissions() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/me")
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const can = (permission: Permission): boolean => {
    if (!profile) return false
    return hasPermission(profile.role, permission)
  }

  const is = (role: UserRole | UserRole[]): boolean => {
    if (!profile) return false
    const roles = Array.isArray(role) ? role : [role]
    return hasRole(profile.role, roles)
  }

  const planLimits = profile
    ? PLAN_LIMITS[profile.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE
    : PLAN_LIMITS.FREE

  return { profile, loading, can, is, planLimits }
}
