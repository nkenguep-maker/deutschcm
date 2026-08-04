import { describe, expect, it } from "vitest";
import {
  MESSAGING_MATRIX,
  getMessagingMatrixProjection,
  getRule,
  isKindAllowedForActor,
  isPersonaAllowedAsGuardianObserver,
  isPersonaAllowedAsMember,
  personaRoleFor,
} from "@/lib/messaging/matrix";

// P4.6-A · matrice de permissions Messagerie.

describe("MESSAGING_MATRIX (P4.6-A)", () => {
  it("expose exactement 13 types de conversation", () => {
    expect(Object.keys(MESSAGING_MATRIX)).toHaveLength(13);
  });

  it("les 13 types métier sont exactement ceux du brief", () => {
    expect(new Set(Object.keys(MESSAGING_MATRIX))).toEqual(new Set([
      "WORLD_STUDENT_TEACHER", "WORLD_CLASS_GROUP",
      "ROOTS_STUDENT_COACH", "ROOTS_PALABRE_GROUP",
      "CHILD_WORLD_GUIDED", "CHILD_ROOTS_GUIDED",
      "FAMILY_TEACHER", "FAMILY_CENTER_BILLING", "FAMILY_COACH",
      "CENTER_TEACHER_INTERNAL", "CENTER_COACH_INTERNAL",
      "CENTER_PLATFORM_SUPPORT", "PLATFORM_BROADCAST",
    ]));
  });

  it("aucun type ADMIN_METADATA_VIEW ni MASKED", () => {
    expect(Object.keys(MESSAGING_MATRIX)).not.toContain("ADMIN_METADATA_VIEW");
    expect(Object.keys(MESSAGING_MATRIX)).not.toContain("MASKED");
  });
});

describe("Enfants · règles strictes (brief §11)", () => {
  it("child_monde NE PEUT PAS envoyer TEXT dans CHILD_WORLD_GUIDED", () => {
    expect(isKindAllowedForActor("CHILD_WORLD_GUIDED", "CHILD_PROFILE", "TEXT")).toBe(false);
  });
  it("child_racines NE PEUT PAS envoyer TEXT dans CHILD_ROOTS_GUIDED", () => {
    expect(isKindAllowedForActor("CHILD_ROOTS_GUIDED", "CHILD_PROFILE", "TEXT")).toBe(false);
  });
  it("child_monde PEUT envoyer GUIDED_PHRASE et AUDIO uniquement", () => {
    expect(isKindAllowedForActor("CHILD_WORLD_GUIDED", "CHILD_PROFILE", "GUIDED_PHRASE")).toBe(true);
    expect(isKindAllowedForActor("CHILD_WORLD_GUIDED", "CHILD_PROFILE", "AUDIO")).toBe(true);
    expect(isKindAllowedForActor("CHILD_WORLD_GUIDED", "CHILD_PROFILE", "CARD")).toBe(false);
    expect(isKindAllowedForActor("CHILD_WORLD_GUIDED", "CHILD_PROFILE", "SYSTEM")).toBe(false);
  });
  it("aucune conversation adulte n'autorise CHILD_PROFILE (kinds vides)", () => {
    for (const type of [
      "WORLD_STUDENT_TEACHER", "WORLD_CLASS_GROUP",
      "ROOTS_STUDENT_COACH", "ROOTS_PALABRE_GROUP",
      "FAMILY_TEACHER", "FAMILY_CENTER_BILLING", "FAMILY_COACH",
      "CENTER_TEACHER_INTERNAL", "CENTER_COACH_INTERNAL",
      "CENTER_PLATFORM_SUPPORT", "PLATFORM_BROADCAST",
    ] as const) {
      expect(getRule(type).allowedKindsForChildProfile).toEqual([]);
    }
  });
});

describe("Copie parentale automatique (brief §12)", () => {
  it("family est GUARDIAN_OBSERVER dans CHILD_WORLD_GUIDED", () => {
    expect(isPersonaAllowedAsGuardianObserver("CHILD_WORLD_GUIDED", "family")).toBe(true);
  });
  it("family est GUARDIAN_OBSERVER dans CHILD_ROOTS_GUIDED", () => {
    expect(isPersonaAllowedAsGuardianObserver("CHILD_ROOTS_GUIDED", "family")).toBe(true);
  });
  it("family n'est PAS GUARDIAN_OBSERVER ailleurs (fils pédagogiques adultes)", () => {
    for (const type of [
      "WORLD_STUDENT_TEACHER", "WORLD_CLASS_GROUP",
      "ROOTS_STUDENT_COACH", "ROOTS_PALABRE_GROUP",
    ] as const) {
      expect(isPersonaAllowedAsGuardianObserver(type, "family")).toBe(false);
    }
  });
});

describe("Cloisonnement des groupes (brief §15)", () => {
  it("WORLD_CLASS_GROUP · parents (family) exclus", () => {
    expect(isPersonaAllowedAsMember("WORLD_CLASS_GROUP", "family")).toBe(false);
    expect(isPersonaAllowedAsGuardianObserver("WORLD_CLASS_GROUP", "family")).toBe(false);
  });
  it("WORLD_CLASS_GROUP · enfants exclus (jusqu'à futur groupe distinct)", () => {
    expect(isPersonaAllowedAsMember("WORLD_CLASS_GROUP", "child_monde")).toBe(false);
    expect(isPersonaAllowedAsMember("WORLD_CLASS_GROUP", "child_racines")).toBe(false);
  });
  it("ROOTS_PALABRE_GROUP · enfants exclus", () => {
    expect(isPersonaAllowedAsMember("ROOTS_PALABRE_GROUP", "child_racines")).toBe(false);
    expect(isPersonaAllowedAsMember("ROOTS_PALABRE_GROUP", "child_monde")).toBe(false);
  });
  it("Enseignant est MODERATOR de sa classe", () => {
    expect(personaRoleFor("WORLD_CLASS_GROUP", "teacher")).toBe("MODERATOR");
  });
  it("Coach est MODERATOR du palabre", () => {
    expect(personaRoleFor("ROOTS_PALABRE_GROUP", "coach")).toBe("MODERATOR");
  });
});

describe("Cloisonnement des sujets (brief §14)", () => {
  it("FAMILY_CENTER_BILLING · enseignants et coachs exclus", () => {
    expect(isPersonaAllowedAsMember("FAMILY_CENTER_BILLING", "teacher")).toBe(false);
    expect(isPersonaAllowedAsMember("FAMILY_CENTER_BILLING", "coach")).toBe(false);
  });
  it("CENTER_TEACHER_INTERNAL · élèves et familles exclus", () => {
    for (const p of ["student_monde", "student_racines", "family", "child_monde", "child_racines"] as const) {
      expect(isPersonaAllowedAsMember("CENTER_TEACHER_INTERNAL", p)).toBe(false);
    }
  });
  it("CENTER_COACH_INTERNAL · élèves et familles exclus", () => {
    for (const p of ["student_monde", "student_racines", "family", "child_monde", "child_racines"] as const) {
      expect(isPersonaAllowedAsMember("CENTER_COACH_INTERNAL", p)).toBe(false);
    }
  });
});

describe("Super Admin scope (brief §16)", () => {
  it("super_admin est MODERATOR de CENTER_PLATFORM_SUPPORT et PLATFORM_BROADCAST uniquement", () => {
    expect(personaRoleFor("CENTER_PLATFORM_SUPPORT", "super_admin")).toBe("MODERATOR");
    expect(personaRoleFor("PLATFORM_BROADCAST", "super_admin")).toBe("MODERATOR");
  });
  it("super_admin n'a AUCUN rôle dans les fils pédagogiques", () => {
    for (const type of [
      "WORLD_STUDENT_TEACHER", "WORLD_CLASS_GROUP",
      "ROOTS_STUDENT_COACH", "ROOTS_PALABRE_GROUP",
      "CHILD_WORLD_GUIDED", "CHILD_ROOTS_GUIDED",
      "FAMILY_TEACHER", "FAMILY_CENTER_BILLING", "FAMILY_COACH",
      "CENTER_TEACHER_INTERNAL", "CENTER_COACH_INTERNAL",
    ] as const) {
      expect(personaRoleFor(type, "super_admin")).toBe(null);
    }
  });
});

describe("PLATFORM_BROADCAST · lecture seule (brief §17)", () => {
  it("center_admin est READ_ONLY", () => {
    expect(personaRoleFor("PLATFORM_BROADCAST", "center_admin")).toBe("READ_ONLY");
  });
  it("aucune réponse autorisée (supportsReplies = false)", () => {
    expect(getRule("PLATFORM_BROADCAST").supportsReplies).toBe(false);
  });
  it("seuls CARD et SYSTEM sont autorisés (contenu broadcast)", () => {
    expect(getRule("PLATFORM_BROADCAST").allowedKindsForUser).toEqual(["CARD", "SYSTEM"]);
  });
});

describe("Projection matrice (source unique)", () => {
  it("getMessagingMatrixProjection retourne les 13 entrées sérialisables", () => {
    const proj = getMessagingMatrixProjection();
    expect(proj).toHaveLength(13);
    for (const row of proj) {
      expect(row).toHaveProperty("type");
      expect(row).toHaveProperty("memberPersonas");
      expect(row).toHaveProperty("moderatorPersonas");
      expect(row).toHaveProperty("guardianObserverPersonas");
      expect(row).toHaveProperty("allowedKindsForUser");
      expect(row).toHaveProperty("allowedKindsForChildProfile");
      expect(row).toHaveProperty("requiredContexts");
      expect(row).toHaveProperty("supportsReplies");
    }
  });
});
