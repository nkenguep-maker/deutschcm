import { describe, expect, it } from "vitest";
import fr from "../../../../messages/fr.json";
import en from "../../../../messages/en.json";

type Dict = Record<string, unknown>;

function keysOf(o: Dict, prefix = ""): string[] {
  const out: string[] = [];
  for (const k of Object.keys(o)) {
    const v = (o as Record<string, unknown>)[k];
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out.push(...keysOf(v as Dict, path));
    } else {
      out.push(path);
    }
  }
  return out;
}

describe("yemaDashboards i18n dictionaries", () => {
  it("le namespace yemaDashboards existe dans fr et en", () => {
    expect(fr).toHaveProperty("yemaDashboards");
    expect(en).toHaveProperty("yemaDashboards");
  });

  it("les deux locales ont exactement les mêmes clés (miroir strict)", () => {
    const frKeys = keysOf((fr as Dict).yemaDashboards as Dict).sort();
    const enKeys = keysOf((en as Dict).yemaDashboards as Dict).sort();
    expect(enKeys).toEqual(frKeys);
  });

  it("les 6 rubriques Monde sont présentes", () => {
    const nav = (fr as { yemaDashboards: { studentMonde: { nav: Dict } } }).yemaDashboards.studentMonde.nav;
    expect(Object.keys(nav).sort()).toEqual([
      "assignments",
      "class",
      "course",
      "journey",
      "messages",
      "overview",
    ]);
  });

  it("les 6 rubriques Racines sont présentes", () => {
    const nav = (fr as { yemaDashboards: { studentRacines: { nav: Dict } } }).yemaDashboards.studentRacines.nav;
    expect(Object.keys(nav).sort()).toEqual([
      "circle",
      "coach",
      "listens",
      "messages",
      "overview",
      "steps",
    ]);
  });
});
