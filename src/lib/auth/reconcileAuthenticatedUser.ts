import "server-only";

import { Role } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";
import { reconcileDbUser, ReconcileError } from "@/lib/reconcileDbUser";
import { markRoleOnboarded, syncUserMetadata, type SpaceRole } from "@/lib/roles";

/**
 * Reconcile an authenticated Supabase identity without trusting caller-controlled
 * user_metadata for authorization.
 *
 * Existing users keep their trusted primary User.role when that role is still
 * ACTIVE in user_roles. Fresh identities always start as STUDENT; privileged
 * roles must be granted by a trusted server workflow and are then mirrored to
 * Supabase app_metadata.
 *
 * Compatibility seam: historical users can have User.onboardingDone=true while
 * the later UserRole row still says onboarded=false. On first trusted sync we
 * repair only the primary active role from that legacy boolean; we never mark
 * unrelated roles onboarded implicitly.
 */
export async function reconcileAuthenticatedUser(authUser: SupabaseUser) {
  if (!authUser.email) {
    throw new ReconcileError("MISSING_EMAIL", "authUser without email");
  }

  const email = authUser.email.toLowerCase();
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { supabaseId: authUser.id },
        { email: { equals: email, mode: "insensitive" } },
      ],
    },
    select: {
      role: true,
      onboardingDone: true,
      userRoles: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        select: { role: true, onboarded: true },
      },
    },
  });

  const activeRoles = existing?.userRoles ?? [];
  const trustedPrimary = existing?.role as SpaceRole | undefined;
  const primaryIsActive = trustedPrimary
    ? activeRoles.some((entry) => entry.role === trustedPrimary)
    : false;
  const activeSpace = (
    primaryIsActive
      ? trustedPrimary
      : activeRoles[0]?.role ?? existing?.role ?? Role.STUDENT
  ) as SpaceRole;

  const result = await reconcileDbUser({
    authUser,
    defaultRole: activeSpace as Role,
  });

  if (existing?.onboardingDone) {
    const primaryRoleState = activeRoles.find((entry) => entry.role === activeSpace);
    if (primaryRoleState && !primaryRoleState.onboarded) {
      await markRoleOnboarded(result.user.id, activeSpace);
    }
  }

  await syncUserMetadata({ supabaseId: authUser.id, activeSpace });
  return { ...result, activeSpace };
}
