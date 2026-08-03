#!/usr/bin/env node
// Preflight release Production · vérifie les variables d'environnement
// requises AVANT tout déploiement prod. Aucune valeur n'est loguée.
//
// Sortie ·
//   - exit 0 si toutes les variables requises sont présentes et conformes
//   - exit non-nul sinon (nombre de checks échoués)
//
// USAGE · à exécuter uniquement dans un contexte confirmé Production
//   (VERCEL_ENV=production) · le script se refuse en dev/preview.
//
// Ne se connecte à AUCUN service · lit uniquement process.env.

const REQUIRED_TRUTHY = [
  "YEMA_DASHBOARD_REDESIGN_ENABLED",
  "YEMA_MESSAGING_ENABLED",
  "YEMA_MESSAGE_AUDIO_ENABLED",
  "YEMA_COACH_WORKSPACE_ENABLED",
  "YEMA_ROOTS_COACH_RLS_CONFIRMED",
];

const REQUIRED_PRESENT = [
  "YEMA_CHILD_SESSION_SECRET",
];

function isTruthy(v) {
  return v === "true" || v === "1";
}

function isPresent(v) {
  return typeof v === "string" && v.length > 0;
}

function main() {
  const failures = [];
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv !== "production") {
    console.error("[preflight-release-prod] REFUSED · VERCEL_ENV must be 'production'");
    process.exit(2);
  }

  for (const name of REQUIRED_TRUTHY) {
    if (!isTruthy(process.env[name])) failures.push(name);
  }
  for (const name of REQUIRED_PRESENT) {
    if (!isPresent(process.env[name])) failures.push(name);
  }

  if (failures.length > 0) {
    // Log NOMS UNIQUEMENT · jamais les valeurs (secrets).
    console.error(`[preflight-release-prod] FAIL · ${failures.length} required var(s) missing or non-truthy ·`);
    for (const name of failures) console.error(`  - ${name}`);
    process.exit(failures.length);
  }

  console.log(`[preflight-release-prod] OK · ${REQUIRED_TRUTHY.length + REQUIRED_PRESENT.length} required vars present + conformes`);
  process.exit(0);
}

main();
