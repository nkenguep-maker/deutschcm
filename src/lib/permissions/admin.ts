// P4.2 · Résolution ADMIN pour les routes /api/admin/* dédiées aux
// opérations coach (assign/remove) et autres actions break-glass.

import { prisma } from "@/lib/prisma";
import { PermissionError, resolveCircleActor, type CircleActor } from "./circle";

export async function resolveAdminActor(): Promise<CircleActor> {
  const actor = await resolveCircleActor();
  const admin = await prisma.userAppRole.findFirst({
    where: { userId: actor.userId, role: "YEMA_ADMIN" },
    select: { id: true },
  });
  if (!admin) throw new PermissionError("FORBIDDEN", "admin role required");
  return actor;
}

export { PermissionError };
