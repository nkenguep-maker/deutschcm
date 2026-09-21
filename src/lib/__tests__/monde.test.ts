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
import { DE_A1_COURSE } from "@/data/courses/registry";

const a1Units = DE_A1_COURSE.units;
const firstUnit = a1Units[0];
const completed = (lessonIds: string[]) => lessonIds.map((moduleId) => ({ moduleId, status: "COMPLETED" as const }));

describe("buildA1CourseList · verrouillage séquentiel", () => {
  it("premier cours ouvert par défaut, autres verrouillés", () => {
    const list = buildA1CourseList([]);
    expect(list).toHaveLength(a1Units.length);
    expect(list[0].status).toBe("OPEN");
    for (let i = 1; i < a1Units.length; i++) expect(list[i].status).toBe("LOCKED");
  });

  it("cours 1 complet → cours 2 ouvert", () => {
    const done = completed(firstUnit.lessons.map((lesson) => lesson.id));
    const list = buildA1CourseList(done);
    expect(list[0].status).toBe("COMPLETED");
    expect(list[0].completedModules).toBe(firstUnit.lessons.length);
    expect(list[1].status).toBe("OPEN");
    expect(list[2].status).toBe("LOCKED");
  });

  it("cours 1 partiel → status IN_PROGRESS · cours 2 verrouillé", () => {
    const done = completed(firstUnit.lessons.slice(0, 2).map((lesson) => lesson.id));
    const list = buildA1CourseList(done);
    expect(list[0].status).toBe("IN_PROGRESS");
    expect(list[0].completedModules).toBe(2);
    expect(list[1].status).toBe("LOCKED");
  });

  it("reprend exactement les unités du registre A1 officiel", () => {
    const list = buildA1CourseList([]);
    expect(list.map((summary) => summary.id)).toEqual(a1Units.map((unit) => unit.id));
  });
});

describe("nextIncompleteModule", () => {
  it("null quand tout est terminé", () => {
    const done = completed(a1Units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)));
    expect(nextIncompleteModule(done)).toBeNull();
  });

  it("renvoie le premier module du cours 1 quand aucun progress", () => {
    const next = nextIncompleteModule([]);
    expect(next?.courseId).toBe(firstUnit.id);
    expect(next?.moduleId).toBe(firstUnit.lessons[0].id);
  });

  it("ne pointe pas sur un cours verrouillé", () => {
    // Progress vide → cours 2 verrouillé → next doit pointer sur cours 1
    const next = nextIncompleteModule([]);
    expect(next?.courseId).toBe(firstUnit.id);
  });
});

describe("overallProgress", () => {
  it("0% quand aucun progrès", () => {
    expect(overallProgress(buildA1CourseList([]))).toBe(0);
  });
  it("reflète la part réelle de la première unité dans le catalogue", () => {
    const done = completed(firstUnit.lessons.map((lesson) => lesson.id));
    const totalLessons = a1Units.reduce((sum, unit) => sum + unit.lessons.length, 0);
    expect(overallProgress(buildA1CourseList(done))).toBe(Math.round((firstUnit.lessons.length / totalLessons) * 100));
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
