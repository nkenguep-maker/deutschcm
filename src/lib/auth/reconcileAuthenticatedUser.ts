import "server-only";

import { Role } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";
import { reconcileDbUser, ReconcileError } from "@/lib/reconcileDbUser";
import { syncUserMetadata, type SpaceRole } from "@/lib/roles";

/**
 * Reconcile an authenticated Supabase identity without trusting caller-controlled
 * user_metadata for authorization.
 *
 * Existing users keep a role already present in the database. Fresh identities
 * always start as STUDENT; privileged roles must be granted by a trusted server
 * workflow and are then mirrored to Supabase app_metadata.
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
      userRoles: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { role: true },
      },
    },
  });

  const activeSpace = (existing?.userRoles[0]?.role ?? existing?.role ?? Role.STUDENT) as SpaceRole;
  const result = await reconcileDbUser({
    authUser,
    defaultRole: activeSpace as Role,
  });

  await syncUserMetadata({ supabaseId: authUser.id, activeSpace });
  return { ...result, activeSpace };
}
