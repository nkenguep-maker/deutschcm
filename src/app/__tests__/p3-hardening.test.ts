// P3 hardening · gardes supplémentaires pour Solo/Famille source of truth,
// limite enfants, persistance profil actif, dashboard 4 modes.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("API racines-dashboard · mode dérivé du produit (hardening §2)", () => {
  const src = read("src/app/api/me/racines-dashboard/route.ts");
  it("appelle resolveRacinesAccessMode (pas inferProfileMode)", () => {
    expect(src).toMatch(/resolveRacinesAccessMode/);
    expect(src).not.toMatch(/inferProfileMode/);
  });
  it("inclut productVariant.product dans la query grants (pour lire product.code)", () => {
    expect(src).toMatch(/productVariant:\s*\{\s*include:\s*\{\s*product:\s*true/);
  });
  it("expose household { childrenCount, householdConfigured, incoherent }", () => {
    expect(src).toMatch(/summarizeRacinesHousehold/);
    expect(src).toMatch(/household:\s*householdSummary/);
  });
  it("expose activeChildId depuis user_metadata (server-resolved)", () => {
    expect(src).toMatch(/user\.user_metadata\?\.activeChildId/);
  });
  it("filtre les grants Racines uniquement (product.universe RACINES ou code ROOTS_)", () => {
    expect(src).toMatch(/\.universe === "RACINES"/);
    expect(src).toMatch(/ROOTS_/);
  });
});

describe("DashboardRacines · rend les 4 modes distinctement", () => {
  const src = read("src/components/racines/DashboardRacines.tsx");
  it("gère explicitement SOLO / FAMILY / NO_ACCESS / UNKNOWN", () => {
    expect(src).toMatch(/"SOLO"/);
    expect(src).toMatch(/"FAMILY"/);
    expect(src).toMatch(/"NO_ACCESS"/);
    expect(src).toMatch(/"UNKNOWN"/);
  });
  it("FAMILY_EMPTY (Famille sans enfants) rend un StateBlock dédié", () => {
    expect(src).toMatch(/isFamilyEmpty/);
    expect(src).toMatch(/familyEmptyTitle/);
    expect(src).toMatch(/familyEmptyCta/);
  });
  it("NO_ACCESS renvoie vers /activation-intent", () => {
    expect(src).toMatch(/data\.mode === "NO_ACCESS"[\s\S]*?\/activation-intent/);
  });
  it("détecte et signale une incohérence (SOLO + enfants)", () => {
    expect(src).toMatch(/incoherentNotice/);
    expect(src).toMatch(/household\.incoherent/);
  });
  it("aucun mapping automatique childrenCount → mode côté UI", () => {
    expect(src).not.toMatch(/children\.length > 0\s*\?\s*"FAMILY"/);
    expect(src).not.toMatch(/inferProfileMode/);
  });
});

describe("Limite enfants · POST /api/family/children (hardening §4)", () => {
  const src = read("src/app/api/family/children/route.ts");
  it("MAX_CHILDREN vaut 4 (doctrine §12)", () => {
    expect(src).toMatch(/MAX_CHILDREN\s*=\s*4/);
  });
  it("refus 409 avec detail { limit, current } quand plafond atteint", () => {
    expect(src).toMatch(/max_children_reached/);
    expect(src).toMatch(/limit:\s*MAX_CHILDREN/);
  });
});

describe("Persistance profil actif · /api/me/active-child (hardening §6)", () => {
  const src = read("src/app/api/me/active-child/route.ts");
  it("GET refuse anonyme", () => {
    expect(src).toMatch(/UNAUTHORIZED/);
  });
  it("POST valide ownership avant d'écrire user_metadata.activeChildId", () => {
    expect(src).toMatch(/parentUserId:\s*dbUser\.id/);
    expect(src).toMatch(/child not owned by parent/);
  });
  it("permet la réinitialisation (childId=null)", () => {
    expect(src).toMatch(/childId === null \|\| childId === undefined/);
  });
  it("persistance via supabase.auth.updateUser (user_metadata)", () => {
    expect(src).toMatch(/supabase\.auth\.updateUser/);
    expect(src).toMatch(/activeChildId/);
  });
});

describe("Racines seam · source de vérité (hardening §2)", () => {
  const src = read("src/lib/racines.ts");
  it("resolveRacinesAccessMode ne prend PAS childrenCount", () => {
    // Signature contient hasActiveGrant + grantProductCode + activationIntentOffer + hasLearningPath.
    expect(src).toMatch(/hasActiveGrant:\s*boolean/);
    expect(src).toMatch(/grantProductCode\?:\s*string/);
    expect(src).toMatch(/activationIntentOffer\?:\s*string/);
    // Pas de childrenCount dans l'interface d'entrée.
    const iface = src.match(/interface RacinesAccessSignals[\s\S]*?^\}/m);
    expect(iface).not.toBeNull();
    expect(iface![0]).not.toMatch(/childrenCount/);
  });
  it("retourne NO_ACCESS par défaut (jamais SOLO par défaut)", () => {
    expect(src).toMatch(/return "NO_ACCESS"/);
  });
  it("summarizeRacinesHousehold expose incoherent quand SOLO + enfants", () => {
    expect(src).toMatch(/incoherent:\s*mode === "SOLO" && childrenCount > 0/);
  });
});
