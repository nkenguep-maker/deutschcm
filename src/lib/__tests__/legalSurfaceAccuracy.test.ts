import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("public legal surfaces match the current product", () => {
  it("describes open beta, family child profiles and deferred payments accurately", () => {
    const privacy = read("src/app/[locale]/privacy/page.tsx");
    const terms = read("src/app/[locale]/terms/page.tsx");
    const combined = `${privacy}\n${terms}`;

    expect(privacy).toContain("open beta");
    expect(privacy).toContain("bêta ouverte");
    expect(privacy).toContain("child profiles");
    expect(privacy).toContain("profils enfants");
    expect(privacy).toContain("Online payments are not currently activated");
    expect(privacy).toContain("Les paiements en ligne ne sont pas encore activés");

    expect(terms).toContain("Adult accounts and family profiles");
    expect(terms).toContain("Comptes adultes et profils famille");
    expect(terms).toContain("does not create a paid subscription, payment, order or access entitlement");
    expect(terms).toContain("cela ne crée ni abonnement payant, ni paiement, ni commande, ni droit d’accès");
    expect(terms).toContain("does not promise a numerical uptime");
    expect(terms).toContain("ne promet aucun taux de disponibilité chiffré");

    for (const staleClaim of [
      "MTN MoMo",
      "Orange Money",
      "public beta",
      "closed beta",
      "bêta fermée",
      "at least 16 years old",
      "au moins 16 ans",
      "Audio is not stored after processing",
      "Audio is not stored after processing.",
      "non stocké après traitement",
      "99% uptime",
      "36 months after last activity",
      "conservées 36 mois",
      "erased within 30 days",
      "effacées dans les 30 jours",
      "No refunds after 48 hours",
      "Pas de remboursement après 48 h",
    ]) {
      expect(combined).not.toContain(staleClaim);
    }
  });
});
