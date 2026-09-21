import "server-only";

import { prisma } from "@/lib/prisma";

export type AdultPersonaId =
  | "student_monde"
  | "student_racines"
  | "family"
  | "teacher"
  | "coach"
  | "center_admin"
  | "super_admin";

export type PersonaRuntime = {
  persona: AdultPersonaId | null;
  homeRoute: string;
  onboardingRoute: string;
  onboarded: boolean;
  universe: "MONDE" | "RACINES" | null;
};

const PROFESSIONAL_REQUESTS = new Set<AdultPersonaId>([
  "teacher",
  "coach",
  "center_admin",
  "super_admin",
]);

function pendingRoute(persona: AdultPersonaId): string {
  return `/onboarding/pending?persona=${encodeURIComponent(persona)}`;
}

export function isAdultPersonaId(value: unknown): value is AdultPersonaId {
  return typeof value === "string" && [
    "student_monde",
    "student_racines",
    "family",
    "teacher",
    "coach",
    "center_admin",
    "super_admin",
  ].includes(value);
}

export async function resolvePersonaRuntime(params: {
  supabaseId: string;
  requestedPersona?: unknown;
}): Promise<PersonaRuntime> {
  const user = await prisma.user.findUnique({
    where: { supabaseId: params.supabaseId },
    select: {
      id: true,
      onboardingDone: true,
      role: true,
      userRoles: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        select: { role: true, onboarded: true },
      },
      appRoles: {
        select: { role: true },
      },
      learningPaths: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        select: { universe: true },
      },
    },
  });

  if (!user) {
    return {
      persona: null,
      homeRoute: "/onboarding/persona",
      onboardingRoute: "/onboarding/persona",
      onboarded: false,
      universe: null,
    };
  }

  const roleMap = new Map(user.userRoles.map((r) => [r.role, r.onboarded] as const));
  const appRoles = new Set(user.appRoles.map((r) => r.role));
  const activeUniverses = new Set(user.learningPaths.map((path) => path.universe));
  const latestUniverse = user.learningPaths[0]?.universe ?? null;
  const requested = isAdultPersonaId(params.requestedPersona)
    ? params.requestedPersona
    : null;

  // Privileged/professional spaces are derived from trusted DB roles only.
  // requested_persona is never enough to grant access to these surfaces.
  if (roleMap.has("ADMIN")) {
    return {
      persona: "super_admin",
      homeRoute: "/admin",
      onboardingRoute: "/admin",
      onboarded: true,
      universe: null,
    };
  }

  if (roleMap.has("CENTER")) {
    const onboarded = roleMap.get("CENTER") === true;
    return {
      persona: "center_admin",
      homeRoute: "/center",
      onboardingRoute: onboarded ? "/center" : "/onboarding/center",
      onboarded,
      universe: null,
    };
  }

  if (roleMap.has("TEACHER")) {
    const onboarded = roleMap.get("TEACHER") === true;
    return {
      persona: "teacher",
      homeRoute: "/teacher",
      onboardingRoute: onboarded ? "/teacher" : "/onboarding/teacher",
      onboarded,
      universe: "MONDE",
    };
  }

  if (appRoles.has("RACINES_COACH")) {
    const onboarded = user.onboardingDone;
    return {
      persona: "coach",
      homeRoute: "/coach/racines",
      onboardingRoute: onboarded ? "/coach/racines" : "/onboarding/coach",
      onboarded,
      universe: "RACINES",
    };
  }

  // A learner may legitimately own both Monde and Racines LearningPaths.
  // In that case the explicitly selected learner persona is the active space;
  // creation time must never decide which dashboard opens.
  if (requested === "student_monde") {
    const hasPath = activeUniverses.has("MONDE");
    const onboarded = hasPath && (roleMap.get("STUDENT") === true || user.onboardingDone);
    return {
      persona: "student_monde",
      homeRoute: "/dashboard",
      onboardingRoute: onboarded ? "/dashboard" : "/onboarding/monde",
      onboarded,
      universe: "MONDE",
    };
  }

  if (requested === "student_racines") {
    const hasPath = activeUniverses.has("RACINES");
    const onboarded = hasPath && (roleMap.get("STUDENT") === true || user.onboardingDone);
    return {
      persona: "student_racines",
      homeRoute: "/dashboard",
      onboardingRoute: onboarded ? "/dashboard" : "/onboarding/racines",
      onboarded,
      universe: "RACINES",
    };
  }

  if (appRoles.has("PARENT")) {
    const onboarded = roleMap.get("STUDENT") === true || user.onboardingDone;
    return {
      persona: "family",
      homeRoute: "/family",
      onboardingRoute: onboarded ? "/family" : "/onboarding/family",
      onboarded,
      universe: null,
    };
  }

  // Backward-compatible fallback for accounts created before requested_persona
  // became canonical. This is intentionally only a fallback.
  if (latestUniverse === "RACINES") {
    const onboarded = roleMap.get("STUDENT") === true || user.onboardingDone;
    return {
      persona: "student_racines",
      homeRoute: "/dashboard",
      onboardingRoute: onboarded ? "/dashboard" : "/onboarding/racines",
      onboarded,
      universe: "RACINES",
    };
  }

  if (latestUniverse === "MONDE") {
    const onboarded = roleMap.get("STUDENT") === true || user.onboardingDone;
    return {
      persona: "student_monde",
      homeRoute: "/dashboard",
      onboardingRoute: onboarded ? "/dashboard" : "/onboarding/monde",
      onboarded,
      universe: "MONDE",
    };
  }

  if (requested && PROFESSIONAL_REQUESTS.has(requested)) {
    return {
      persona: requested,
      homeRoute: pendingRoute(requested),
      onboardingRoute: pendingRoute(requested),
      onboarded: false,
      universe: requested === "coach" ? "RACINES" : requested === "teacher" ? "MONDE" : null,
    };
  }

  if (requested === "family") {
    return {
      persona: "family",
      homeRoute: "/onboarding/family",
      onboardingRoute: "/onboarding/family",
      onboarded: false,
      universe: null,
    };
  }

  return {
    persona: null,
    homeRoute: "/onboarding/persona",
    onboardingRoute: "/onboarding/persona",
    onboarded: false,
    universe: null,
  };
}
