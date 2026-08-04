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

function countMatches(re: RegExp, s: string): number {
  const m = s.match(re);
  return m ? m.length : 0;
}

const teacherFiles = walk(join(DASHBOARDS_ROOT, "teacher"));
const coachFiles = walk(join(DASHBOARDS_ROOT, "coach-racines"));

describe("Teacher dashboard structure (Lot 3)", () => {
  it("aucun composant Teacher ne contient <h1", () => {
    const offenders = teacherFiles.filter(
      (f) => countMatches(/<h1[\s>]/g, readFileSync(f, "utf-8")) > 0,
    );
    expect(offenders).toEqual([]);
  });

  it("aucun composant Teacher ne rend {c.id} ou {classroomId} en texte nu", () => {
    const forbidden = [
      />\s*\{[a-zA-Z_$][\w.]*\.classroomId\s*\}\s*</,
      />\s*\{classroomId\s*\}\s*</,
      />\s*\{c\.id\s*\}\s*</,
    ];
    const offenders: Array<{ file: string; match: string }> = [];
    for (const f of teacherFiles) {
      const src = readFileSync(f, "utf-8");
      for (const re of forbidden) {
        const m = src.match(re);
        if (m) offenders.push({ file: f.replace(DASHBOARDS_ROOT, ""), match: m[0] });
      }
    }
    expect(offenders).toEqual([]);
  });

  it("aucune fausse messagerie : pas de composant Teacher qui mentionne 'conversation' hors placeholder", () => {
    // Le placeholder est TeacherMessagesSection qui n'utilise que la clé
    // messages.soon. Aucun autre composant ne doit contenir des mots-clés
    // suggérant une vraie messagerie active.
    const offenders = teacherFiles
      .filter((f) => !f.endsWith("TeacherMessagesSection.tsx"))
      .filter((f) => {
        const src = readFileSync(f, "utf-8");
        return /conversation|unreadCount|audioMessage|voicemail/i.test(src);
      });
    expect(offenders).toEqual([]);
  });

  it("le namespace i18n teacher est parfaitement mirrored FR/EN", () => {
    const frT = (fr as { yemaDashboards: { teacher: Record<string, unknown> } }).yemaDashboards.teacher;
    const enT = (en as { yemaDashboards: { teacher: Record<string, unknown> } }).yemaDashboards.teacher;
    expect(Object.keys(enT).sort()).toEqual(Object.keys(frT).sort());
  });
});

describe("Coach Racines dashboard structure (Lot 3)", () => {
  it("aucun composant Coach ne contient <h1", () => {
    const offenders = coachFiles.filter(
      (f) => countMatches(/<h1[\s>]/g, readFileSync(f, "utf-8")) > 0,
    );
    expect(offenders).toEqual([]);
  });

  it("aucun composant Coach ne rend {child.id} ou {learnerId} en texte nu", () => {
    const forbidden = [
      />\s*\{child\.id\s*\}\s*</,
      />\s*\{[a-zA-Z_$][\w.]*\.learnerId\s*\}\s*</,
      />\s*\{learnerId\s*\}\s*</,
    ];
    const offenders: Array<{ file: string; match: string }> = [];
    for (const f of coachFiles) {
      const src = readFileSync(f, "utf-8");
      for (const re of forbidden) {
        const m = src.match(re);
        if (m) offenders.push({ file: f.replace(DASHBOARDS_ROOT, ""), match: m[0] });
      }
    }
    expect(offenders).toEqual([]);
  });

  it("aucune donnée Monde n'est référencée dans le code exécutable des composants Coach", () => {
    // On strip d'abord les commentaires ligne (// …) et bloc (/* … */) pour
    // ne détecter que le code exécutable — les auto-mentions du type
    // "aucune donnée Monde" dans un commentaire d'intention sont tolérées.
    const stripComments = (src: string) =>
      src.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
    const forbidden = /\b(MONDE|StudentMonde|WORLD_DIRECT|WORLD_CLASS|monde-dashboard|student-monde)\b/;
    const offenders = coachFiles.filter((f) => forbidden.test(stripComments(readFileSync(f, "utf-8"))));
    expect(offenders).toEqual([]);
  });

  it("aucune fausse messagerie vocale : pas de <audio> ni waveform dans les composants Coach", () => {
    const offenders = coachFiles.filter((f) => {
      const src = readFileSync(f, "utf-8");
      return /<audio[\s>]|waveform|MediaRecorder|getUserMedia/i.test(src);
    });
    expect(offenders).toEqual([]);
  });

  it("le namespace i18n coachRacines est parfaitement mirrored FR/EN", () => {
    const frC = (fr as { yemaDashboards: { coachRacines: Record<string, unknown> } }).yemaDashboards.coachRacines;
    const enC = (en as { yemaDashboards: { coachRacines: Record<string, unknown> } }).yemaDashboards.coachRacines;
    expect(Object.keys(enC).sort()).toEqual(Object.keys(frC).sort());
  });

  it("les rubriques Coach sont exactement celles attendues (overview, learners, sessions, messages, sessionNotes)", () => {
    const nav = (fr as { yemaDashboards: { coachRacines: { nav: Record<string, string> } } })
      .yemaDashboards.coachRacines.nav;
    expect(Object.keys(nav).sort()).toEqual([
      "learners",
      "messages",
      "overview",
      "sessionNotes",
      "sessions",
    ]);
  });
});

describe("Teacher/Coach isolation on shell primitives", () => {
  it("aucun composant Teacher ou Coach n'importe src/lib/qa", () => {
    const all = [...teacherFiles, ...coachFiles];
    const offenders = all.filter((f) => /from\s+["']@\/lib\/qa/.test(readFileSync(f, "utf-8")));
    expect(offenders).toEqual([]);
  });

  it("aucun composant Teacher ou Coach n'importe un composant legacy TeacherDashboardView ou RootsCoachDashboardView", () => {
    const all = [...teacherFiles, ...coachFiles];
    const offenders = all.filter((f) => {
      const src = readFileSync(f, "utf-8");
      return /TeacherDashboardView|RootsCoachDashboardView/.test(src);
    });
    expect(offenders).toEqual([]);
  });
});
