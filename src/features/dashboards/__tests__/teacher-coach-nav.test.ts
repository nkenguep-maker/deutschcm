import { describe, expect, it } from "vitest";
import { buildTeacherNav } from "@/features/dashboards/teacher/nav";
import { buildCoachRacinesNav } from "@/features/dashboards/coach-racines/nav";

describe("buildTeacherNav (Lot 3)", () => {
  const labels = {
    overview: "Tableau de bord",
    classes: "Mes classes",
    assignments: "Devoirs",
    corrections: "Corrections",
    resources: "Ressources",
    messages: "Messages",
    sectionLabel: "Mon espace",
  };

  it("expose exactement 6 rubriques dans un unique groupe", () => {
    const groups = buildTeacherNav(labels, "/fr/teacher");
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(6);
  });

  it("le premier item pointe sur la route Teacher (sans ancre)", () => {
    const [g] = buildTeacherNav(labels, "/fr/teacher");
    expect(g.items[0].href).toBe("/fr/teacher");
  });

  it("les 5 autres items sont des ancres in-page attendues", () => {
    const [g] = buildTeacherNav(labels, "/fr/teacher");
    expect(g.items.slice(1).map((i) => i.href)).toEqual([
      "/fr/teacher#mes-classes",
      "/fr/teacher#devoirs",
      "/fr/teacher#corrections",
      "/fr/teacher#ressources",
      "/fr/teacher#messages",
    ]);
  });

  it("respecte la locale en EN", () => {
    const [g] = buildTeacherNav(labels, "/en/teacher");
    expect(g.items[0].href).toBe("/en/teacher");
    expect(g.items[5].href).toBe("/en/teacher#messages");
  });
});

describe("buildCoachRacinesNav (Lot 3)", () => {
  const labels = {
    overview: "Tableau de bord",
    learners: "Mes apprenants",
    sessions: "Séances",
    messages: "Messages",
    sessionNotes: "Notes de séance",
    sectionLabel: "Ma maison",
  };

  it("expose exactement 5 rubriques dans un unique groupe", () => {
    const groups = buildCoachRacinesNav(labels, "/fr/coach/racines");
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(5);
  });

  it("les 4 sous-items sont des ancres in-page attendues", () => {
    const [g] = buildCoachRacinesNav(labels, "/fr/coach/racines");
    expect(g.items.slice(1).map((i) => i.href)).toEqual([
      "/fr/coach/racines#mes-apprenants",
      "/fr/coach/racines#seances",
      "/fr/coach/racines#messages",
      "/fr/coach/racines#notes-de-seance",
    ]);
  });
});
