import { describe, expect, it } from "vitest";
import { buildMondeNav } from "@/features/dashboards/student-monde/nav";
import { buildRacinesNav } from "@/features/dashboards/student-racines/nav";

const MONDE_LABELS = {
  overview: "Mon tableau de bord",
  course: "Mon cours",
  assignments: "Mes devoirs",
  journey: "Mon parcours",
  classSection: "Ma classe",
  messages: "Messages",
  sectionLabel: "Mon espace",
};

const RACINES_LABELS = {
  overview: "Mon tableau de bord",
  steps: "Mes étapes",
  listens: "Écoutes",
  coach: "Mon coach",
  circle: "Cercle de palabre",
  messages: "Messages",
  sectionLabel: "Ma maison",
};

describe("buildMondeNav", () => {
  it("returns exactly 6 rubriques dans un unique groupe", () => {
    const groups = buildMondeNav(MONDE_LABELS, "/fr/dashboard");
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(6);
  });

  it("first item points to base dashboard href (no anchor)", () => {
    const [group] = buildMondeNav(MONDE_LABELS, "/fr/dashboard");
    expect(group.items[0].href).toBe("/fr/dashboard");
  });

  it("subsequent items use in-page anchors", () => {
    const [group] = buildMondeNav(MONDE_LABELS, "/fr/dashboard");
    const anchors = group.items.slice(1).map((i) => i.href);
    expect(anchors).toEqual([
      "/fr/dashboard#mon-cours",
      "/fr/dashboard#mes-devoirs",
      "/fr/dashboard#mon-parcours",
      "/fr/dashboard#ma-classe",
      "/fr/dashboard#messages",
    ]);
  });

  it("respects locale in the href", () => {
    const [group] = buildMondeNav(MONDE_LABELS, "/en/dashboard");
    expect(group.items[0].href).toBe("/en/dashboard");
    expect(group.items[5].href).toBe("/en/dashboard#messages");
  });
});

describe("buildRacinesNav", () => {
  it("returns exactly 6 rubriques dans un unique groupe", () => {
    const groups = buildRacinesNav(RACINES_LABELS, "/fr/dashboard");
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(6);
  });

  it("uses expected Racines anchors", () => {
    const [group] = buildRacinesNav(RACINES_LABELS, "/fr/dashboard");
    const anchors = group.items.slice(1).map((i) => i.href);
    expect(anchors).toEqual([
      "/fr/dashboard#mes-etapes",
      "/fr/dashboard#ecoutes",
      "/fr/dashboard#mon-coach",
      "/fr/dashboard#cercle",
      "/fr/dashboard#messages",
    ]);
  });
});
