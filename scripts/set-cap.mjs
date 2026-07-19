// scripts/set-cap.mjs — utilitaire de test pour Le Foyer.
// Bascule le cap et/ou la langue active d'un compte Supabase en une
// commande, sans passer par l'onboarding UI. Sert à valider les
// quatre configs de cap (Franchir / Grandir / Transmettre / Moi) sur
// le même compte de seed sans re-login.
//
// Usage
//   node scripts/set-cap.mjs jacob@yema.test franchir
//   node scripts/set-cap.mjs jacob@yema.test transmettre --lang bassa
//   node scripts/set-cap.mjs jacob@yema.test moi --lang deutsch
//
// Cap valides : franchir, grandir, transmettre, moi
// Langues     : voir src/lib/languages.ts (deutsch, bassa, wolof, …)

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
      }
    }
  } catch {}
}
loadEnv();

const [, , email, cap, ...rest] = process.argv;
if (!email || !cap) {
  console.error("Usage : node scripts/set-cap.mjs <email> <franchir|grandir|transmettre|moi> [--lang <id>]");
  process.exit(1);
}
const VALID_CAPS = ["franchir", "grandir", "transmettre", "moi"];
if (!VALID_CAPS.includes(cap)) {
  console.error(`Cap invalide : ${cap}. Attendu : ${VALID_CAPS.join(" | ")}`);
  process.exit(1);
}
const langFlag = rest.indexOf("--lang");
const lang = langFlag >= 0 ? rest[langFlag + 1] : null;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data: list } = await admin.auth.admin.listUsers({ perPage: 500 });
const user = list?.users?.find((u) => u.email === email);
if (!user) {
  console.error(`Aucun user Supabase avec email ${email}`);
  process.exit(1);
}

const merged = {
  ...(user.user_metadata ?? {}),
  cap,
  ...(lang ? { activeLanguage: lang } : {}),
};
await admin.auth.admin.updateUserById(user.id, { user_metadata: merged });

console.log(`[set-cap] ✔ ${email}`);
console.log(`  cap            = ${cap}`);
if (lang) console.log(`  activeLanguage = ${lang}`);
console.log("  → recharge /dashboard pour voir le changement");
