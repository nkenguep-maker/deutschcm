import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";
import type { Role } from "@prisma/client";

// Multi-rôles YEMA — source de vérité = table user_roles (Prisma).
// Miroir en lecture rapide = user_metadata.roles / .active_space (Supabase auth).
// Le middleware lit user_metadata pour éviter une requête DB par route.

export type SpaceRole = "STUDENT" | "TEACHER" | "CENTER" | "ADMIN";

export interface UserRoleRecord {
  role: SpaceRole;
  onboarded: boolean;
  status: "ACTIVE" | "PENDING";
}

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// Retourne les rôles ACTIVE d'un user (source de vérité DB).
export async function getUserRoles(userId: string): Promise<UserRoleRecord[]> {
  const rows = await prisma.userRole.findMany({
    where: { userId, status: "ACTIVE" },
    select: { role: true, onboarded: true, status: true },
    orderBy: { createdAt: "asc" },
  });
  return rows as UserRoleRecord[];
}

export async function hasActiveRole(userId: string, role: SpaceRole): Promise<boolean> {
  const count = await prisma.userRole.count({
    where: { userId, role: role as Role, status: "ACTIVE" },
  });
  return count > 0;
}

// Crée ou active un rôle. Idempotent : si déjà présent, laisse tel quel.
// grantedBy = null pour le rôle de base créé au register, sinon id admin.
export async function grantRole(params: {
  userId: string;
  role: SpaceRole;
  grantedBy?: string | null;
}): Promise<UserRoleRecord> {
  const { userId, role, grantedBy = null } = params;
  const row = await prisma.userRole.upsert({
    where: { userId_role: { userId, role: role as Role } },
    create: {
      userId,
      role: role as Role,
      status: "ACTIVE",
      onboarded: false,
      grantedBy,
    },
    update: { status: "ACTIVE" },
    select: { role: true, onboarded: true, status: true },
  });
  return row as UserRoleRecord;
}

// Retire un rôle. Ne jamais retirer le dernier rôle actif d'un user.
export async function revokeRole(params: {
  userId: string;
  role: SpaceRole;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { userId, role } = params;
  const remaining = await prisma.userRole.count({
    where: { userId, status: "ACTIVE", role: { not: role as Role } },
  });
  if (remaining === 0) {
    return { ok: false, reason: "cannot_remove_last_role" };
  }
  await prisma.userRole.delete({
    where: { userId_role: { userId, role: role as Role } },
  });
  return { ok: true };
}

// Marque l'onboarding fait pour UN rôle. Ne touche pas les autres.
// Idempotent : si la ligne UserRole n'existe pas encore (racE condition,
// user créé hors du chemin normal, etc.), on la CRÉE avec onboarded=true.
// Sans ce upsert, un update sur une ligne inexistante throw P2025 et
// bloque tout le flow d'onboarding.
export async function markRoleOnboarded(userId: string, role: SpaceRole): Promise<void> {
  await prisma.userRole.upsert({
    where: { userId_role: { userId, role: role as Role } },
    update: { onboarded: true },
    create: {
      userId,
      role: role as Role,
      status: "ACTIVE",
      onboarded: true,
    },
  });
}

// Sync user_metadata Supabase avec l'état DB. Appelé après chaque
// mutation (grant, revoke, onboarding complete, register).
// Le middleware lit user_metadata donc pas de requête DB par route protégée.
export async function syncUserMetadata(params: {
  supabaseId: string;
  activeSpace?: SpaceRole;
}): Promise<void> {
  const { supabaseId, activeSpace } = params;
  const user = await prisma.user.findUnique({
    where: { supabaseId },
    select: { id: true },
  });
  if (!user) return;

  const roles = await getUserRoles(user.id);
  const rolesList = roles.map((r) => r.role);
  const onboardedMap = Object.fromEntries(roles.map((r) => [r.role, r.onboarded]));

  const chosenActive =
    activeSpace && rolesList.includes(activeSpace)
      ? activeSpace
      : rolesList[0] ?? "STUDENT";

  const admin = adminClient();
  // Récupérer le user_metadata existant pour merge
  const { data: current } = await admin.auth.admin.getUserById(supabaseId);
  const existing = (current?.user?.user_metadata ?? {}) as Record<string, unknown>;

  await admin.auth.admin.updateUserById(supabaseId, {
    user_metadata: {
      ...existing,
      roles: rolesList,
      onboarded_map: onboardedMap,
      active_space: chosenActive,
    },
  });
}

// Guard côté serveur : vérifie qu'un user a un rôle ET l'a onboardé.
// Retourne l'action à prendre pour la page appelante.
export async function requireRoleOnboarding(params: {
  userId: string;
  role: SpaceRole;
}): Promise<
  | { ok: true }
  | { ok: false; reason: "no_role"; redirectTo: string }
  | { ok: false; reason: "needs_onboarding"; redirectTo: string }
> {
  const { userId, role } = params;
  const row = await prisma.userRole.findUnique({
    where: { userId_role: { userId, role: role as Role } },
    select: { onboarded: true, status: true },
  });
  if (!row || row.status !== "ACTIVE") {
    return { ok: false, reason: "no_role", redirectTo: "/setup-role" };
  }
  if (!row.onboarded) {
    const map: Record<SpaceRole, string> = {
      STUDENT: "/onboarding/student",
      TEACHER: "/onboarding/teacher",
      CENTER: "/onboarding/center",
      ADMIN: "/dashboard",
    };
    return { ok: false, reason: "needs_onboarding", redirectTo: map[role] };
  }
  return { ok: true };
}
