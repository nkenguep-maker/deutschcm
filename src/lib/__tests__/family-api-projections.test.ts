import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Tests de sécurité structurels (pas d'exécution de handler — pas de DB).
// Vérifie que le code source des APIs Family n'expose JAMAIS pinHash ni
// aucune donnée qui trahirait la doctrine « rôle ≠ entitlement ».

const ROOT = resolve(__dirname, "../..");

function readSrc(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}

function stripComments(src: string): string {
  return src.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

describe("Family APIs projections (Lot 4A · sécurité)", () => {
  it("/api/family/dashboard/route.ts n'expose jamais pinHash (code exécutable)", () => {
    const src = stripComments(readSrc("app/api/family/dashboard/route.ts"));
    expect(src).not.toMatch(/\bpinHash\b/);
  });

  it("/api/family/children/register/route.ts ne renvoie jamais pinHash au client", () => {
    const src = readSrc("app/api/family/children/register/route.ts");
    // Le route.ts appelle createChildProfile qui retourne { id, prenom, hasPin }
    // et n'inclut jamais pinHash dans le payload renvoyé.
    expect(src).not.toMatch(/pinHash/);
    // Il DOIT retourner hasPin (dérivé du hash présence) — pas le hash brut.
    expect(src).toMatch(/child:\s*result\.child/);
  });

  it("lib/family/queries.ts sélectionne pinHash pour dériver hasPin mais ne l'exporte pas", () => {
    const src = readSrc("lib/family/queries.ts");
    // Sélection interne dans le select Prisma (dérive hasPin)
    expect(src).toMatch(/pinHash:\s*true/);
    // Type public FamilyChildRow doit exposer hasPin, jamais pinHash
    expect(src).toMatch(/hasPin:\s*boolean/);
    expect(src).not.toMatch(/pinHash:\s*string/);
    expect(src).not.toMatch(/pinHash:\s*"scrypt/);
  });

  it("lib/family/children.ts hash le PIN via hashChildPin (canonique) et le stocke via pinHash", () => {
    const src = readSrc("lib/family/children.ts");
    expect(src).toMatch(/hashChildPin/);
    expect(src).toMatch(/pinHash,/);
    // La création vérifie le seat AVANT d'écrire
    expect(src).toMatch(/assertCanAddChildProfile/);
  });

  it("lib/family/actor.ts distingue explicitement rôle et présence d'enfants (doctrine §1)", () => {
    const src = readSrc("lib/family/actor.ts");
    expect(src).toMatch(/hasParentRole/);
    expect(src).toMatch(/hasChildProfiles/);
    // AppRole PARENT (pas d'invention FAMILY_GUARDIAN)
    expect(src).toMatch(/role:\s*["']PARENT["']/);
  });

  it("lib/entitlements/adult.ts ne débloque PAS Monde adulte via ROOTS_FAMILY (brief §2)", () => {
    // Extrait le corps de hasAdultWorldAccess entre son "{" ouvrant et le
    // début de la fonction suivante.
    const src = stripComments(readSrc("lib/entitlements/adult.ts"));
    const start = src.indexOf("export async function hasAdultWorldAccess");
    const end = src.indexOf("export ", start + 1);
    const worldFn = src.slice(start, end > 0 ? end : undefined);
    expect(worldFn).toMatch(/ProductCode\.PASSAGE/);
    expect(worldFn).not.toMatch(/ROOTS_FAMILY/);
    expect(worldFn).not.toMatch(/FAMILY_MONDE/);
  });

  it("lib/entitlements/adult.ts vérifie Racines adulte via grant USER ROOTS_SOLO ou ROOTS_FAMILY (patch commercial)", () => {
    const src = stripComments(readSrc("lib/entitlements/adult.ts"));
    const start = src.indexOf("export async function hasAdultRootsAccess");
    const end = src.indexOf("export ", start + 1);
    const rootsFn = src.slice(start, end > 0 ? end : undefined);
    // Doit matcher les 2 product codes attendus.
    expect(rootsFn).toMatch(/ROOTS_SOLO/);
    expect(rootsFn).toMatch(/ROOTS_FAMILY/);
    // Doit passer par activeUserGrantsForCodes (grant USER uniquement).
    expect(rootsFn).toMatch(/activeUserGrantsForCodes/);
    // Ne doit PLUS chercher HouseholdMembership + grant HOUSEHOLD.
    expect(rootsFn).not.toMatch(/householdMembership/);
    expect(rootsFn).not.toMatch(/beneficiaryType:\s*["']HOUSEHOLD["']/);
  });

  it("lib/family/seats.ts n'attribue AUCUN siège Monde par défaut à ROOTS_FAMILY (brief §2)", () => {
    const src = readSrc("lib/family/seats.ts");
    // Le switch doit avoir un case ROOTS_FAMILY qui donne 4 sièges, mais
    // le default = 0 (aucun autre produit ne donne de sièges enfants).
    expect(src).toMatch(/case\s+["']ROOTS_FAMILY["']:\s*return\s+4/);
    expect(src).toMatch(/default:\s*return\s+0/);
  });
});
