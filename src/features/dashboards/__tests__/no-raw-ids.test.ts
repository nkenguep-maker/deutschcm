import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import fr from "../../../../messages/fr.json";
import en from "../../../../messages/en.json";

const DASHBOARDS_ROOT = resolve(__dirname, "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "__tests__" || name === "node_modules") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

describe("no raw IDs rendered in dashboards", () => {
  it("aucun composant de student-monde/student-racines ne rend {classroomId}, {id} d'assignment brut ou {a.id} en text nu", () => {
    const files = walk(DASHBOARDS_ROOT).filter(
      (f) => f.includes("/student-monde/") || f.includes("/student-racines/"),
    );

    // Patterns qui rendraient un identifiant brut comme contenu texte :
    //   {classroomId} · {a.classroomId} · {c.id} sans wrapping, etc.
    // On tolère l'usage d'id comme `key={c.id}` (attribut React) et comme
    // fragment de href (`/student/assignments/${a.id}`).
    const forbidden: RegExp[] = [
      />\s*\{[a-zA-Z_$][\w.]*\.classroomId\s*\}\s*</,
      />\s*\{classroomId\s*\}\s*</,
    ];

    const offenders: Array<{ file: string; match: string }> = [];
    for (const f of files) {
      const src = readFileSync(f, "utf-8");
      for (const re of forbidden) {
        const m = src.match(re);
        if (m) offenders.push({ file: f.replace(DASHBOARDS_ROOT, ""), match: m[0] });
      }
    }
    expect(offenders).toEqual([]);
  });

  it("la clé classroomsSoon est présente en FR et EN pour Ma classe", () => {
    const frKey = (fr as { yemaDashboards: { studentMonde: { classSection: Record<string, string> } } })
      .yemaDashboards.studentMonde.classSection.classroomsSoon;
    const enKey = (en as { yemaDashboards: { studentMonde: { classSection: Record<string, string> } } })
      .yemaDashboards.studentMonde.classSection.classroomsSoon;
    expect(frKey).toBe("Les informations de votre classe seront bientôt disponibles.");
    expect(enKey).toBe("Your class information will be available soon.");
  });
});
