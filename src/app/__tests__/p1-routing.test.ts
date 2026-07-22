// P1 · Gardes routing & permissions du funnel.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("proxy · funnel P1 accessible uniquement STUDENT + ADMIN", () => {
  const src = read("src/proxy.ts");
  it("/decouverte protégé STUDENT + ADMIN", () => {
    expect(src).toMatch(/["']\/decouverte["']\s*:\s*\[\s*["']STUDENT["'],\s*["']ADMIN["']\s*\]/);
  });
  it("/activation-intent protégé STUDENT + ADMIN", () => {
    expect(src).toMatch(/["']\/activation-intent["']\s*:\s*\[\s*["']STUDENT["'],\s*["']ADMIN["']\s*\]/);
  });
  it("les deux routes rattachées à l'espace STUDENT côté spaceForPath", () => {
    expect(src).toMatch(/pathname\.startsWith\(["']\/decouverte["']\)/);
    expect(src).toMatch(/pathname\.startsWith\(["']\/activation-intent["']\)/);
  });
});

describe("Router /onboarding · redirige selon l'état du funnel", () => {
  const src = read("src/app/[locale]/onboarding/page.tsx");
  it("importe deriveFunnelStep et nextFunnelHref", () => {
    expect(src).toMatch(/deriveFunnelStep/);
    expect(src).toMatch(/nextFunnelHref/);
  });
  it("détecte les grants actifs sur user OU learning path", () => {
    expect(src).toMatch(/beneficiaryType:\s*["']USER["']/);
    expect(src).toMatch(/beneficiaryType:\s*["']LEARNING_PATH["']/);
  });
  it("redirige vers /decouverte/attente pour une langue non-active", () => {
    expect(src).toMatch(/\/decouverte\/attente/);
  });
});

describe("/decouverte/[n] · une seule leçon par requête", () => {
  const page = read("src/app/[locale]/decouverte/[n]/page.tsx");
  it("valide n ∈ {1,2,3,4}", () => {
    expect(page).toMatch(/\[1,\s*2,\s*3,\s*4\]\.includes/);
  });
  it("appelle notFound() pour n invalide", () => {
    expect(page).toMatch(/notFound\(\)/);
  });
  it("redirige vers /decouverte/attente si la langue n'est pas active", () => {
    expect(page).toMatch(/\/decouverte\/attente/);
  });
});

describe("/decouverte/attente · état honnête pour langue non-active", () => {
  const page = read("src/app/[locale]/decouverte/attente/page.tsx");
  it("utilise StateBlock kind=empty avec le mot 'bientôt'", () => {
    expect(page).toMatch(/StateBlock/);
    expect(page).toMatch(/kind="empty"/);
    expect(page).toMatch(/bient.*t/i);
  });
});

describe("/decouverte/bilan · uniquement données réelles", () => {
  const page = read("src/app/[locale]/decouverte/bilan/page.tsx");
  it("lit progress depuis onboardingAnswers persistées", () => {
    expect(page).toMatch(/discoveryProgress/);
  });
  it("aucune comparaison fictive avec d'autres utilisateurs", () => {
    expect(page).not.toMatch(/comparaison|classement|leaderboard|témoignage|top \d+/i);
  });
  it("aucun pourcentage inventé de maîtrise", () => {
    expect(page).not.toMatch(/pourcentage de maîtrise|mastery percent|estimation de réussite/i);
  });
});

describe("/activation-intent · aucune fake activation", () => {
  const page = read("src/app/[locale]/activation-intent/ActivationIntentClient.tsx");
  it("ne crée jamais un ordre payé ni un entitlement", () => {
    expect(page).not.toMatch(/fetch\(\s*["']\/api\/orders["']/);
    expect(page).not.toMatch(/AccessGrant/);
    expect(page).not.toMatch(/cinetpay|stripe|paypal/i);
  });
  it("le coach Racines est présenté comme bientôt disponible", () => {
    expect(page).toMatch(/RACINES_COACH_OPERATIONAL/);
    expect(page).toMatch(/bient.*t|coming soon/i);
  });
  it("utilise WORLD_PASSAGE_PRICES et AFRICAN_SOLO/FAMILY comme source unique", () => {
    expect(page).toMatch(/WORLD_PASSAGE_PRICES/);
    expect(page).toMatch(/AFRICAN_SOLO/);
    expect(page).toMatch(/AFRICAN_FAMILY/);
  });
});

describe("API /api/funnel · patch whitelisté et validé", () => {
  const route = read("src/app/api/funnel/route.ts");
  it("refuse tout champ non whitelisté", () => {
    expect(route).toMatch(/ALLOWED_KEYS/);
    expect(route).toMatch(/cefrSelfAssessed[\s\S]*racinesStep[\s\S]*discoveryProgress[\s\S]*activationIntent/);
  });
  it("valide CEFR sur A1..C1", () => {
    expect(route).toMatch(/CEFR:\s*CefrLevel\[\]\s*=\s*\["A1",\s*"A2",\s*"B1",\s*"B2",\s*"C1"\]/);
  });
  it("valide Racines step sur E1..E5", () => {
    expect(route).toMatch(/RACINES:\s*RacinesStep\[\]\s*=\s*\["E1",\s*"E2",\s*"E3",\s*"E4",\s*"E5"\]/);
  });
  it("valide currency ∈ {XAF, EUR}", () => {
    expect(route).toMatch(/currency.*XAF.*EUR|XAF.*EUR/);
  });
  it("Monde requiert offer=PASSAGE + cefrLevel", () => {
    expect(route).toMatch(/offer !== "PASSAGE"/);
    expect(route).toMatch(/cefrLevel/);
  });
  it("Racines requiert racinesOffer + racinesPeriod", () => {
    expect(route).toMatch(/racinesOffer/);
    expect(route).toMatch(/racinesPeriod/);
  });
  it("union triée pour discoveryProgress · pas de remplacement destructif", () => {
    expect(route).toMatch(/new Set<number>/);
  });
});
