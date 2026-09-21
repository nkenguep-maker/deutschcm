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

const CLOSED_BETA_INVITE_SECRET_MIN_LENGTH = 32;

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

  const closedBetaEnabled = process.env.YEMA_CLOSED_BETA_ENABLED === "true";
  if (closedBetaEnabled) {
    const inviteSecret = process.env.YEMA_BETA_INVITE_SECRET ?? "";
    if (inviteSecret.length < CLOSED_BETA_INVITE_SECRET_MIN_LENGTH) {
      failures.push("YEMA_BETA_INVITE_SECRET");
    }
  }

  if (failures.length > 0) {
    // Log NOMS UNIQUEMENT · jamais les valeurs (secrets).
    console.error(`[preflight-release-prod] FAIL · ${failures.length} required var(s) missing or non-conforming ·`);
    for (const name of failures) console.error(`  - ${name}`);
    process.exit(failures.length);
  }

  const betaChecks = closedBetaEnabled ? 1 : 0;
  console.log(
    `[preflight-release-prod] OK · ${REQUIRED_TRUTHY.length + REQUIRED_PRESENT.length + betaChecks} required checks present + conformes`,
  );
  process.exit(0);
}

main();
