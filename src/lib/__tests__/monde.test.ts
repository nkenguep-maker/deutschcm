// P2 · Tests unitaires du seam Monde (buildA1CourseList, computeMondeAccess…).

import { describe, it, expect } from "vitest";
import {
  buildA1CourseList,
  computeMondeAccess,
  nextIncompleteModule,
  overallProgress,
  canAccessModule,
  a1IsCourseReady,
} from "../monde";

describe("buildA1CourseList · verrouillage séquentiel", () => {
  it("premier cours ouvert par défaut, autres verrouillés", () => {
    const list = buildA1CourseList([]);
    expect(list).toHaveLength(5);
    expect(list[0].status).toBe("OPEN");
    for (let i = 1; i < 5; i++) expect(list[i].status).toBe("LOCKED");
  });

  it("cours 1 complet → cours 2 ouvert", () => {
    const done = [
      "a1-beta-1-lesen", "a1-beta-1-hoeren", "a1-beta-1-sprechen",
      "a1-beta-1-schreiben", "a1-beta-1-quiz",
    ].map((moduleId) => ({ moduleId, status: "COMPLETED" as const }));
    const list = buildA1CourseList(done);
    expect(list[0].status).toBe("COMPLETED");
    expect(list[0].completedModules).toBe(5);
    expect(list[1].status).toBe("OPEN");
    expect(list[2].status).toBe("LOCKED");
  });

  it("cours 1 partiel → status IN_PROGRESS · cours 2 verrouillé", () => {
    const done = [
      { moduleId: "a1-beta-1-lesen", status: "COMPLETED" as const },
      { moduleId: "a1-beta-1-hoeren", status: "COMPLETED" as const },
    ];
    const list = buildA1CourseList(done);
    expect(list[0].status).toBe("IN_PROGRESS");
    expect(list[0].completedModules).toBe(2);
    expect(list[1].status).toBe("LOCKED");
  });

  it("aucun cours a1-1 dans la liste (a1-beta uniquement)", () => {
    const list = buildA1CourseList([]);
    expect(list.map((s) => s.id)).toEqual(["a1-beta-1", "a1-beta-2", "a1-beta-3", "a1-beta-4", "a1-beta-5"]);
  });
});

describe("nextIncompleteModule", () => {
  it("null quand tout est terminé", () => {
    const allIds: string[] = [];
    for (let i = 1; i <= 5; i++) {
      for (const type of ["lesen", "hoeren", "sprechen", "schreiben", "quiz"]) {
        allIds.push(`a1-beta-${i}-${type}`);
      }
    }
    const done = allIds.map((moduleId) => ({ moduleId, status: "COMPLETED" as const }));
    expect(nextIncompleteModule(done)).toBeNull();
  });

  it("renvoie le premier module du cours 1 quand aucun progress", () => {
    const next = nextIncompleteModule([]);
    expect(next?.courseId).toBe("a1-beta-1");
    expect(next?.moduleId).toBe("a1-beta-1-lesen");
  });

  it("ne pointe pas sur un cours verrouillé", () => {
    // Progress vide → cours 2 verrouillé → next doit pointer sur cours 1
    const next = nextIncompleteModule([]);
    expect(next?.courseId).toBe("a1-beta-1");
  });
});

describe("overallProgress", () => {
  it("0% quand aucun progrès", () => {
    expect(overallProgress(buildA1CourseList([]))).toBe(0);
  });
  it("20% quand 5 modules sur 25 terminés (1 cours)", () => {
    const done = [
      "a1-beta-1-lesen", "a1-beta-1-hoeren", "a1-beta-1-sprechen",
      "a1-beta-1-schreiben", "a1-beta-1-quiz",
    ].map((moduleId) => ({ moduleId, status: "COMPLETED" as const }));
    expect(overallProgress(buildA1CourseList(done))).toBe(20);
  });
});

describe("computeMondeAccess", () => {
  const now = Date.now();
  it("NONE quand aucun grant", () => {
    const a = computeMondeAccess([]);
    expect(a.status).toBe("NONE");
    expect(a.daysRemaining).toBeNull();
  });
  it("ACTIVE quand grant endsAt futur", () => {
    const a = computeMondeAccess([{
      startsAt: new Date(now - 30 * 86400000),
      endsAt: new Date(now + 60 * 86400000),
      status: "ACTIVE",
      metadata: { level: "A1" },
    }]);
    expect(a.status).toBe("ACTIVE");
    expect(a.daysRemaining).toBeGreaterThan(50);
    expect(a.level).toBe("A1");
  });
  it("EXPIRED quand grant endsAt passé", () => {
    const a = computeMondeAccess([{
      startsAt: new Date(now - 200 * 86400000),
      endsAt: new Date(now - 1 * 86400000),
      status: "ACTIVE",
      metadata: { level: "A1" },
    }]);
    expect(a.status).toBe("EXPIRED");
    expect(a.daysRemaining).toBe(0);
  });
  it("ACTIVE l'emporte sur EXPIRED s'il existe plusieurs grants", () => {
    const a = computeMondeAccess([
      { startsAt: new Date(now - 200 * 86400000), endsAt: new Date(now - 10 * 86400000), status: "ACTIVE", metadata: {} },
      { startsAt: new Date(now - 30 * 86400000), endsAt: new Date(now + 60 * 86400000), status: "ACTIVE", metadata: { level: "A1" } },
    ]);
    expect(a.status).toBe("ACTIVE");
  });
  it("grant sans endsAt = ACTIVE indéfini (daysRemaining null)", () => {
    const a = computeMondeAccess([{
      startsAt: new Date(now - 5 * 86400000),
      endsAt: null,
      status: "ACTIVE",
      metadata: {},
    }]);
    expect(a.status).toBe("ACTIVE");
    expect(a.daysRemaining).toBeNull();
  });
  it("ne considère que les grants status=ACTIVE (ignore REVOKED)", () => {
    const a = computeMondeAccess([{
      startsAt: new Date(now - 30 * 86400000),
      endsAt: new Date(now + 60 * 86400000),
      status: "REVOKED",
      metadata: {},
    }]);
    expect(a.status).toBe("NONE");
  });
});

describe("canAccessModule + a1IsCourseReady", () => {
  it("canAccessModule = true seulement si ACTIVE", () => {
    expect(canAccessModule({ status: "ACTIVE" } as never)).toBe(true);
    expect(canAccessModule({ status: "EXPIRED" } as never)).toBe(false);
    expect(canAccessModule({ status: "NONE" } as never)).toBe(false);
  });
  it("a1IsCourseReady renvoie true (P2 hardening)", () => {
    expect(a1IsCourseReady()).toBe(true);
  });
});
