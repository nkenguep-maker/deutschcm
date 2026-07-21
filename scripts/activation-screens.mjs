// scripts/activation-screens.mjs
// Screenshots de l'écran d'activation — 4 scénarios × 2 ambiances × 2 breakpoints.
// Utilise Playwright avec route intercept pour mocker /api/activation-status
// sans avoir besoin d'auth ni de DB. Le dev server doit tourner sur :3110.
//
//   npm run dev   # dans un autre terminal
//   node scripts/activation-screens.mjs

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const BASE = process.argv[2] || "http://localhost:3110";
const OUT = resolve("screenshots/activation");

// ── Fixtures : les payloads renvoyés par le mock ─────────────────────
const PAIEMENT = { cle: "paiement", params: {}, pret: true };
const PASSAGE_COURS_DE = { cle: "passage_cours", params: { langue: "DEUTSCH", niveau: "A1" }, pret: false };
const PASSAGE_EXAMENS = { cle: "passage_examens", params: {}, pret: false };
const TEACHER_SALLE = { cle: "teacher_salle", params: {}, pret: false };
const TEACHER_FIL = { cle: "teacher_fil", params: {}, pret: false };
const ROOTS_PARCOURS_WO = { cle: "roots_parcours", params: { langue: "WOLOF" }, pret: false };

function fixture({ ambiance, titreCle, droits, tout_pret, echec = null, paiement = true }) {
  return {
    orderId: "sim_" + Math.random().toString(36).slice(2, 8),
    paiement_confirme: paiement,
    droits,
    tout_pret,
    espace_cible: "/dashboard",
    titre: {
      cle: titreCle,
      params: droits[1]?.params ?? {},
    },
    ambiance,
    echec,
    orderStatus: echec === null ? (tout_pret ? "PAID" : "PENDING") : echec.kind === "ORDER_CANCELLED" ? "CANCELLED" : "PENDING",
    paid: paiement,
  };
}

// Chaque scenario retourne UNE séquence de payloads (le mock en renvoie
// un par appel jusqu'à la fin, puis boucle sur le dernier).
const SCENARIOS = {
  normal_monde: [
    fixture({ ambiance: "world", titreCle: "passage_prof",
      droits: [PAIEMENT, { ...PASSAGE_COURS_DE, pret: true }, { ...PASSAGE_EXAMENS, pret: false }, TEACHER_SALLE, TEACHER_FIL],
      tout_pret: false, paiement: true }),
  ],
  fin_monde: [
    fixture({ ambiance: "world", titreCle: "passage_prof",
      droits: [PAIEMENT, { ...PASSAGE_COURS_DE, pret: true }, { ...PASSAGE_EXAMENS, pret: true }, { ...TEACHER_SALLE, pret: true }, { ...TEACHER_FIL, pret: true }],
      tout_pret: true, paiement: true }),
  ],
  normal_sources: [
    fixture({ ambiance: "sources", titreCle: "roots_solo",
      droits: [PAIEMENT, ROOTS_PARCOURS_WO],
      tout_pret: false, paiement: true }),
  ],
  fin_sources: [
    fixture({ ambiance: "sources", titreCle: "roots_solo",
      droits: [PAIEMENT, { ...ROOTS_PARCOURS_WO, pret: true }],
      tout_pret: true, paiement: true }),
  ],
  grace_monde: [
    fixture({ ambiance: "world", titreCle: "passage_seul",
      droits: [PAIEMENT, { ...PASSAGE_COURS_DE, pret: false }, PASSAGE_EXAMENS],
      tout_pret: false, paiement: true }),
  ],
  echec_paiement: [
    fixture({ ambiance: "world", titreCle: "passage_seul",
      droits: [{ ...PAIEMENT, pret: false }, PASSAGE_COURS_DE, PASSAGE_EXAMENS],
      tout_pret: false, paiement: false, echec: { kind: "PAYMENT_FAILED" } }),
  ],
};

const BREAKPOINTS = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const [scenarioName, payloads] of Object.entries(SCENARIOS)) {
    for (const bp of BREAKPOINTS) {
      const ctx = await browser.newContext({
        viewport: { width: bp.width, height: bp.height },
        deviceScaleFactor: 2,
      });
      const page = await ctx.newPage();

      // Mock /api/activation-status
      let callCount = 0;
      await page.route("**/api/activation-status*", async (route) => {
        const payload = payloads[Math.min(callCount, payloads.length - 1)];
        callCount += 1;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(payload),
        });
      });

      // Pour grace : on ne redirige pas, on montre l'écran de grâce en
      // avançant le timer via evaluate — mais Playwright ne peut pas
      // avancer les timers React sans devtools. Le screenshot capture
      // l'état 1s après le mount ; c'est OK pour "normal".
      const url = `${BASE}/fr/activation?orderId=sim_${scenarioName}`;
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
      } catch {
        // networkidle ne se déclenche jamais si le poll continue → tant pis
        await page.waitForTimeout(1500);
      }
      // Laisse la signature du Y jouer (1650ms) + un peu de marge pour
      // que la carte se pose et les coches se stabilisent.
      await page.waitForTimeout(2400);

      // Pour le scénario "grace" : force manuellement le graceMode via un
      // hack DOM (on ne peut pas attendre 20s dans un screenshot script).
      if (scenarioName === "grace_monde") {
        await page.evaluate(() => {
          // Recharge la carte avec graceMode=true en simulant le passage
          // du timer (ce hack n'est valide que dans un contexte de test).
          const card = document.querySelector(".activation-card");
          if (!card) return;
          const attente = card.querySelector(".activation-attente");
          if (attente) attente.remove();
          const grace = document.createElement("div");
          grace.className = "activation-grace";
          grace.setAttribute("role", "status");
          grace.innerHTML = `
            <h2 class="activation-grace-titre">C’est un peu plus long que prévu</h2>
            <p class="activation-grace-body">Votre paiement est bien confirmé — vos accès arrivent. Vous pouvez rejoindre votre espace, tout se mettra en place à mesure.</p>
            <div class="activation-actions">
              <button type="button" class="activation-cta">Aller à mon espace</button>
              <a href="mailto:hello@yema.co" class="activation-contact">Un souci ? Nous écrire</a>
            </div>
          `;
          card.appendChild(grace);
        });
        await page.waitForTimeout(300);
      }

      const shotPath = resolve(OUT, `${scenarioName}_${bp.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });

      // Overflow check
      const overflowing = await page.evaluate((vw) => {
        const list = [];
        const all = document.querySelectorAll("body *");
        for (const el of all) {
          const r = el.getBoundingClientRect();
          if (r.right > vw + 0.5 && r.width > 12 && r.width < vw * 3) {
            list.push({ tag: el.tagName.toLowerCase(), cls: (el.className || "").toString().slice(0, 60), right: Math.round(r.right) });
          }
        }
        return list.slice(0, 10);
      }, bp.width);

      results.push({
        scenario: scenarioName,
        breakpoint: bp.name,
        shot: shotPath,
        overflow: overflowing.length,
        overflowSamples: overflowing.slice(0, 3),
      });

      await ctx.close();
    }
  }

  await browser.close();

  await writeFile(resolve(OUT, "report.json"), JSON.stringify(results, null, 2));
  console.log("\n=== activation screenshots ===");
  for (const r of results) {
    console.log(`${r.scenario.padEnd(18)} ${r.breakpoint.padEnd(6)} overflow=${r.overflow}`);
    if (r.overflow > 0) {
      for (const s of r.overflowSamples) {
        console.log(`  ↳ <${s.tag}> right=${s.right} .${s.cls}`);
      }
    }
  }
  console.log(`\n→ ${OUT}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
