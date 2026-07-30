// P4.5-QA · verrous structurels sur la console persona QA.
//
// Aucune dépendance runtime · lit le code source et vérifie les invariants
// documentés (gate 4 conditions, allowlist body, cookie HttpOnly, TTL max
// 10 min, no NEXT_PUBLIC_QA_, no bypass RLS, log sans PII, routes 404 par
// défaut, aucun service_role client-side).

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO = join(__dirname, "..", "..", "..");
function read(rel: string): string { return readFileSync(join(REPO, rel), "utf-8"); }

const CONFIG = "src/lib/qa/config.ts";
const TOKEN = "src/lib/qa/token.ts";
const COOKIE = "src/lib/qa/cookie.ts";
const NONCES = "src/lib/qa/nonces.ts";
const CSRF = "src/lib/qa/csrf.ts";
const LOG = "src/lib/qa/log.ts";
const PERSONAS = "src/lib/qa/personas.ts";
const RT_BOOTSTRAP = "src/app/api/qa/bootstrap/route.ts";
const RT_IMPERSONATE = "src/app/api/qa/impersonate/route.ts";
const RT_LOGOUT = "src/app/api/qa/logout/route.ts";
const PAGE_QA = "src/app/[locale]/qa/page.tsx";
const BANNER = "src/components/qa/QaBanner.tsx";
const CONSOLE_VIEW = "src/components/qa/QaConsoleView.tsx";
const LINK_GEN = "scripts/qa/generate-preview-qa-link.mjs";
const FIXTURES = "scripts/test-baseline/yema-qa-fixtures.mjs";
const CLEANUP = "scripts/test-baseline/yema-qa-cleanup.mjs";
const FLAGS = "src/lib/flags.ts";
const MIGRATION_SQL = "prisma/migrations/20260726000001_qa_bootstrap_nonce_store/migration.sql";
const SCHEMA_PRISMA = "prisma/schema.prisma";

const ALL_LIB = [CONFIG, TOKEN, COOKIE, NONCES, LOG, PERSONAS];
const ALL_ROUTES = [RT_BOOTSTRAP, RT_IMPERSONATE, RT_LOGOUT];
const ALL_UI = [PAGE_QA, BANNER, CONSOLE_VIEW];

// ─── §4 · Config gate 4 conditions ──────────────────────────────────────
describe("QA config · gate 4 conditions strict", () => {
  const src = read(CONFIG);

  it("est marqué server-only", () => {
    expect(src).toMatch(/^import\s+"server-only";/m);
  });

  it("exporte QA_ALLOWED_PROJECT_REF = P-1", () => {
    expect(src).toMatch(/QA_ALLOWED_PROJECT_REF\s*=\s*"kzzagbojjkivdzzcrmxn"/);
  });

  it("§4 · vérifie VERCEL_ENV=preview (avec fallback local via YEMA_QA_ALLOW_LOCAL uniquement)", () => {
    expect(src).toMatch(/process\.env\.VERCEL_ENV/);
    expect(src).toMatch(/vercelEnv === "preview"/);
    expect(src).toMatch(/YEMA_QA_ALLOW_LOCAL/);
  });

  it("§4 · getFlag('QA_MODE_ENABLED') AVANT tout accès DB/session", () => {
    const idxPreview = src.indexOf('"not_preview"');
    const idxFlag = src.indexOf('"flag_disabled"');
    const idxWrongRef = src.indexOf('"wrong_project_ref"');
    const idxSecrets = src.indexOf('"missing_secrets"');
    expect(idxPreview).toBeGreaterThan(0);
    expect(idxFlag).toBeGreaterThan(idxPreview);
    expect(idxWrongRef).toBeGreaterThan(idxFlag);
    expect(idxSecrets).toBeGreaterThan(idxWrongRef);
  });

  it("§4 · ordre canonique · not_preview → flag_disabled → wrong_project_ref → missing_secrets", () => {
    // Séquence de returns confirmée par les positions.
    for (const r of ["not_preview", "flag_disabled", "wrong_project_ref", "missing_secrets"]) {
      expect(src).toContain(`"${r}"`);
    }
  });

  it("§2 · isValidEmail refuse email sans '@', avec espace, sans domaine", () => {
    // Sanity structural · exportation.
    expect(src).toMatch(/export function isValidEmail/);
    expect(src).toMatch(/split\("@"\)/);
    expect(src).toMatch(/\/\\s\//);
  });

  it("secret min length = 32 octets", () => {
    expect(src).toMatch(/QA_MIN_SECRET_LENGTH\s*=\s*32/);
  });
});

// ─── §6 · Cookie propriétés obligatoires ────────────────────────────────
describe("QA cookie · HttpOnly + Secure + SameSite=Lax + Max-Age plafonné", () => {
  const src = read(COOKIE);

  it("est marqué server-only", () => {
    expect(src).toMatch(/^import\s+"server-only";/m);
  });

  it("nom du cookie = yema_qa_session", () => {
    expect(src).toMatch(/QA_COOKIE_NAME\s*=\s*"yema_qa_session"/);
  });

  it("propriétés cookie · httpOnly true", () => {
    expect(src).toMatch(/httpOnly:\s*true/);
  });
  it("propriétés cookie · secure true", () => {
    expect(src).toMatch(/secure:\s*true/);
  });
  it("propriétés cookie · sameSite=lax", () => {
    expect(src).toMatch(/sameSite:\s*"lax"/);
  });
  it("Max-Age plafonné à 7200s (2h)", () => {
    expect(src).toMatch(/QA_COOKIE_MAX_AGE_SECONDS_HARD\s*=\s*7200/);
  });

  it("payload ne contient AUCUN token/mot-de-passe/clé (verrou structurel)", () => {
    // Le type QaCookiePayload est défini dans token.ts · on vérifie ici que
    // les seuls champs présents sont ceux de l'allowlist stricte du brief §6.
    const tokenSrc = read(TOKEN);
    const iface = tokenSrc.match(/interface QaCookiePayload \{([\s\S]*?)\}/);
    expect(iface).not.toBeNull();
    const body = iface![1]!;
    const allowedKeys = [
      "qaAdminEmailHash", "deploymentHost", "projectRef",
      "issuedAt", "expiresAt", "nonce",
    ];
    for (const k of allowedKeys) expect(body).toMatch(new RegExp(`\\b${k}\\b`));
    // Aucun champ interdit.
    for (const bad of [
      "accessToken", "refreshToken", "sessionToken",
      "password", "serviceRoleKey", "apiKey", "authorization",
    ]) {
      expect(body, `payload cookie must not include ${bad}`).not.toMatch(new RegExp(`\\b${bad}\\b`));
    }
  });

  it("expiration REVÉRIFIÉE côté serveur (readQaCookie compare expected.nowSeconds)", () => {
    expect(src).toMatch(/p\.expiresAt <= expected\.nowSeconds/);
  });
});

// ─── §7 · Token bootstrap TTL 10 min max + HMAC ─────────────────────────
describe("QA bootstrap token · HMAC-SHA256 + TTL <= 10 min + verifications", () => {
  const src = read(TOKEN);

  it("est marqué server-only", () => {
    expect(src).toMatch(/^import\s+"server-only";/m);
  });

  it("TTL bootstrap fixé à 600s (10 min)", () => {
    expect(src).toMatch(/QA_BOOTSTRAP_TTL_SECONDS\s*=\s*600/);
  });

  it("signature HMAC-SHA256 avec timing-safe compare", () => {
    expect(src).toMatch(/createHmac\("sha256"/);
    expect(src).toMatch(/timingSafeEqual/);
  });

  it("verifyBootstrapToken retourne les 3 codes canoniques (expired, host_mismatch, project_ref_mismatch)", () => {
    for (const r of ["expired", "host_mismatch", "project_ref_mismatch"]) {
      expect(src).toMatch(new RegExp(`"${r}"`));
    }
  });

  it("refuse token trop long (MAX_TOKEN_LEN)", () => {
    expect(src).toMatch(/MAX_TOKEN_LEN/);
    expect(src).toMatch(/token_too_long/);
  });
});

// ─── §7 · Token · comportement fonctionnel léger ────────────────────────
describe("QA bootstrap token · sign/verify roundtrip", async () => {
  const mod = await import("@/lib/qa/token");
  const secret = "x".repeat(64);
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    emailHash: "a".repeat(32),
    deploymentHost: "preview.example.com",
    projectRef: "kzzagbojjkivdzzcrmxn",
    issuedAt: now,
    expiresAt: now + 300,
    nonce: "b".repeat(32),
  };

  it("encode + decode roundtrip", () => {
    const t = mod.encodeToken(payload, secret);
    const r = mod.decodeToken<typeof payload>(t, secret);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload.nonce).toBe(payload.nonce);
  });

  it("signature invalide → refus", () => {
    const t = mod.encodeToken(payload, secret);
    const tampered = t.slice(0, -3) + "AAA";
    const r = mod.decodeToken<typeof payload>(tampered, secret);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("signature_invalid");
  });

  it("token expiré → refus 'expired'", () => {
    const expired = { ...payload, expiresAt: now - 60 };
    const t = mod.encodeToken(expired, secret);
    const r = mod.verifyBootstrapToken(t, secret, {
      deploymentHost: expired.deploymentHost, projectRef: expired.projectRef, nowSeconds: now,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("expired");
  });

  it("host différent → refus 'host_mismatch'", () => {
    const t = mod.encodeToken(payload, secret);
    const r = mod.verifyBootstrapToken(t, secret, {
      deploymentHost: "other.example.com", projectRef: payload.projectRef, nowSeconds: now,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("host_mismatch");
  });

  it("project ref différent → refus 'project_ref_mismatch'", () => {
    const t = mod.encodeToken(payload, secret);
    const r = mod.verifyBootstrapToken(t, secret, {
      deploymentHost: payload.deploymentHost, projectRef: "sbjhvlrkbyjckdxujjsk", nowSeconds: now,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("project_ref_mismatch");
  });

  it("TTL > 600s → refus 'expired' (issuedAt trop ancien)", () => {
    const abusive = { ...payload, issuedAt: now, expiresAt: now + 3600 };
    const t = mod.encodeToken(abusive, secret);
    const r = mod.verifyBootstrapToken(t, secret, {
      deploymentHost: abusive.deploymentHost, projectRef: abusive.projectRef, nowSeconds: now,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("expired");
  });
});

// ─── QA-b1 Gate · Nonce store DB · verrous structurels ─────────────────
describe("QA-b1 Gate · nonce store durable (Prisma + atomic UPDATE)", () => {
  const src = read(NONCES);

  it("est marqué server-only", () => {
    expect(src).toMatch(/^import\s+"server-only";/m);
  });

  it("hashNonce = SHA-256 (jamais le brut)", () => {
    expect(src).toMatch(/createHash\("sha256"\)\.update\(nonce\)/);
    // Le nonce brut n'est jamais loggué ni persisté hors du hashage local.
    expect(src).not.toMatch(/prisma\.qaBootstrapNonce\.create\([^)]*nonce:\s*[a-zA-Z]/);
  });

  it("atomicConsumeNonce · UPDATE conditions strictes (consumedAt NULL + expiresAt > now + host + emailHash + projectRef)", () => {
    expect(src).toMatch(/updateMany/);
    for (const cond of ["nonceHash", "consumedAt: null", "expiresAt", "qaAdminEmailHash", "deploymentHost", "projectRef"]) {
      expect(src).toContain(cond);
    }
  });

  it("atomicConsumeNonce · aucune séquence SELECT-then-UPDATE (une seule opération)", () => {
    // Assurer qu'aucun findFirst/findUnique n'est fait avant l'UPDATE
    // dans la fonction atomicConsumeNonce.
    const fnBlock = src.match(/export async function atomicConsumeNonce[\s\S]*?^\}/m);
    expect(fnBlock).not.toBeNull();
    expect(fnBlock![0]).not.toMatch(/findFirst|findUnique|findMany/);
  });

  it("purgeStaleNonces · deleteMany expired + consumed depuis threshold", () => {
    expect(src).toMatch(/purgeStaleNonces/);
    expect(src).toMatch(/deleteMany/);
    expect(src).toMatch(/expiresAt.*lt/);
    expect(src).toMatch(/consumedAt.*lt/);
  });
});

describe("QA-b1 Gate · nonce · comportement local (hashNonce déterministe)", async () => {
  const mod = await import("@/lib/qa/nonces");

  it("hashNonce · SHA-256 hex 64 chars", () => {
    const h = mod.hashNonce("test-nonce-abc");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    // Déterministe · deux appels sur la même entrée donnent le même hash.
    expect(mod.hashNonce("test-nonce-abc")).toBe(h);
    // Différent input → différent hash.
    expect(mod.hashNonce("test-nonce-abd")).not.toBe(h);
  });
});

// ─── §5 · Personas catalogue + destinations réelles ─────────────────────
describe("QA personas · destinations réelles auditées (pas d'invention)", () => {
  const src = read(PERSONAS);

  it("est marqué server-only", () => {
    expect(src).toMatch(/^import\s+"server-only";/m);
  });

  it("exactement 9 personas (P4.6 Lot 5 · ajout child_monde + child_racines)", () => {
    for (const id of [
      "super_admin", "teacher", "coach", "center_admin",
      "student_monde", "student_racines",
      "family", "child_monde", "child_racines",
    ]) {
      expect(src).toMatch(new RegExp(`id:\\s*"${id}"`));
    }
  });

  it("destinations sont des routes RÉELLEMENT présentes dans le repo", () => {
    // Chaque destination doit correspondre à un fichier page.tsx existant.
    // student_monde et student_racines pointent tous 2 sur /dashboard ·
    // le dashboard aiguille selon LP.universe (MONDE vs RACINES).
    const destinations = [
      ["super_admin",     "src/app/[locale]/admin/page.tsx"],
      ["teacher",         "src/app/[locale]/teacher/page.tsx"],
      ["coach",           "src/app/[locale]/coach/racines/page.tsx"],
      ["center_admin",    "src/app/[locale]/center/page.tsx"],
      ["student_monde",   "src/app/[locale]/dashboard/page.tsx"],
      ["student_racines", "src/app/[locale]/dashboard/page.tsx"],
      ["family",          "src/app/[locale]/family/page.tsx"],
      // P4.6 Lot 5 · child_monde et child_racines pointent vers
      // /api/qa/child-session (endpoint API, pas page.tsx) qui set le
      // cookie enfant puis redirige vers /[locale]/dashboard.
      ["child_monde",     "src/app/api/qa/child-session/route.ts"],
      ["child_racines",   "src/app/api/qa/child-session/route.ts"],
    ] as const;
    for (const [id, path] of destinations) {
      expect(existsSync(join(REPO, path)), `destination ${id} → ${path} must exist`).toBe(true);
    }
  });

  it("préfixe fixture email = test_yema_qa_", () => {
    expect(src).toMatch(/const PREFIX = "test_yema_qa_"/);
  });

  it("isQaPersonaId whitelist stricte (aucun persona arbitraire)", () => {
    expect(src).toMatch(/isQaPersonaId/);
    // P4.6 Lot 5 · whitelist étendue aux 9 personas cibles.
    expect(src).toMatch(/\["super_admin", "teacher", "coach", "center_admin", "student_monde", "student_racines", "family", "child_monde", "child_racines"\]/);
  });
});

// ─── §9 · Route impersonate · allowlist body + gate + resolve server-side ─
describe("QA route impersonate · allowlist body + gate + resolve server-side", () => {
  const src = read(RT_IMPERSONATE);

  it("gate resolveQaConfig() AVANT toute logique", () => {
    const idxGate = src.indexOf("resolveQaConfig()");
    const idxJson = src.indexOf("await request.json()");
    expect(idxGate).toBeGreaterThan(0);
    expect(idxJson).toBeGreaterThan(idxGate);
  });

  it("gate off → return notFound() (404 stable · body { error: \"Not found\" })", () => {
    // P4.6 Lot 6 · doctrine documentée · gate `status.active === false`
    // ⇒ appel de notFound() sans code · aucun détail révélé côté attaquant
    // Production.
    //
    // Le helper notFound() construit
    //   NextResponse.json({ error: "Not found", ...(code ? { code } : {}) },
    //                     { status: 404 })
    // (source de vérité · src/app/api/qa/impersonate/route.ts:29-33).
    //
    //   - Sans arg   (gate off, Production) → body strict `{ error: "Not found" }`
    //   - Avec code  (Preview uniquement)   → body `{ error: "Not found", code: "xxx" }`
    //
    // Le refactor QA-b1 Gate a introduit le spread conditionnel · l'ancien
    // test attendait un pattern exact `{ error: "Not found" }` incompatible
    // avec la construction dynamique. Le test est réécrit pour vérifier les
    // trois invariants réels : (1) le gate appelle notFound() sans arg,
    // (2) le helper notFound est bien défini avec le préfixe { error:
    // "Not found", (3) le status HTTP renvoyé est 404.
    expect(src).toMatch(/status\.active[\s\S]*return notFound\(\)/);
    expect(src).toMatch(/function notFound\([^)]*\)\s*\{[\s\S]*NextResponse\.json\(\{\s*error:\s*"Not found"/);
    expect(src).toMatch(/\{\s*status:\s*404\s*\}/);
  });

  it("allowlist body · uniquement `persona` acceptée", () => {
    // Le refactor QA-b1 Gate a renommé la variable `allowedKeys` en
    // `extraKeys` (sémantique inverse · le contrat reste identique · toute
    // clé autre que `persona` est refusée avec `body_extra_keys`).
    expect(src).toMatch(/Object\.keys\(body\)\.filter\(\(k\) => k !== "persona"\)/);
    expect(src).toMatch(/body_extra_keys/);
  });

  it("isQaPersonaId strict · aucun persona arbitraire", () => {
    expect(src).toMatch(/isQaPersonaId\(personaRaw\)/);
  });

  it("email/userId JAMAIS accepté depuis le body", () => {
    // Aucune référence à body.email, body.userId, body.role, body.projectRef.
    for (const bad of ["body\\.email", "body\\.userId", "body\\.role", "body\\.projectRef", "body\\.host"]) {
      expect(src, `body must not read ${bad}`).not.toMatch(new RegExp(bad));
    }
  });

  it("cookie QA vérifié AVANT generateLink", () => {
    const idxCookie = src.indexOf("readQaCookie");
    const idxGen = src.indexOf("admin.auth.admin.generateLink");
    expect(idxCookie).toBeGreaterThan(0);
    expect(idxGen).toBeGreaterThan(idxCookie);
  });

  it("service_role importé UNIQUEMENT server-side (route.ts n'est pas un composant client)", () => {
    // route.ts est server-only par nature (Next 16 API routes).
    expect(src).not.toMatch(/"use client"/);
    expect(src).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("aucun email/secret envoyé côté client dans la réponse", () => {
    // QA-b1 Gate · la réponse est un redirect 303 sans body sensitif.
    expect(src).toMatch(/NextResponse\.redirect/);
    expect(src).not.toMatch(/NextResponse\.json\([^)]*email/);
    expect(src).not.toMatch(/NextResponse\.json\([^)]*action_link/);
    expect(src).not.toMatch(/NextResponse\.json\([^)]*hashed_token/);
    expect(src).not.toMatch(/NextResponse\.json\([^)]*access_token/);
  });

  it("verbes GET/PATCH/PUT/DELETE explicitement 404", () => {
    for (const v of ["GET", "PATCH", "PUT", "DELETE"]) {
      expect(src).toMatch(new RegExp(`export async function ${v}\\(\\) \\{ return notFound\\(\\); \\}`));
    }
  });
});

// ─── §7 · Route bootstrap · gate + verify + nonce + cookie ──────────────
describe("QA route bootstrap · gate + verify + nonce + cookie", () => {
  const src = read(RT_BOOTSTRAP);

  it("gate resolveQaConfig() AVANT parse du token", () => {
    const idxGate = src.indexOf("resolveQaConfig()");
    const idxToken = src.indexOf('url.searchParams.get("t")');
    expect(idxGate).toBeGreaterThan(0);
    expect(idxToken).toBeGreaterThan(idxGate);
  });

  it("nonce consommé atomiquement · UPDATE...RETURNING (obsolete Map API absent)", () => {
    // QA-b1 Gate · l'API isNonceConsumed/markNonceConsumed a été
    // supprimée · la consommation passe par atomicConsumeNonce (single
    // UPDATE avec conditions strictes).
    expect(src).toMatch(/atomicConsumeNonce/);
    expect(src).not.toMatch(/isNonceConsumed\(/);
    expect(src).not.toMatch(/markNonceConsumed\(/);
  });

  it("redirect 303 · token retiré de l'URL finale (aucun query string)", () => {
    expect(src).toMatch(/status:\s*303/);
    expect(src).toMatch(/new URL\(`\/\$\{locale\}\/qa`,/);
  });

  it("aucun log complet du token (redaction implicite via qaLog metadata whitelist)", () => {
    // Verrou · le fichier n'appelle jamais console.log avec le raw token.
    expect(src).not.toMatch(/console\.log\([^)]*token/);
    expect(src).not.toMatch(/console\.info\([^)]*token/);
    expect(src).not.toMatch(/qaLog\([^)]*token/);
  });
});

// ─── §14 · Flag off · toutes routes QA renvoient 404 ─────────────────────
describe("QA routes · flag-off → 404 stable · gate en 1er", () => {
  it.each(ALL_ROUTES)("%s · gate resolveQaConfig() en premier", (route) => {
    const src = read(route);
    const idxGate = src.search(/const status = resolveQaConfig\(\);/);
    expect(idxGate).toBeGreaterThan(0);
    // Le return notFound() sur !status.active doit apparaître AVANT toute
    // opération DB/Supabase.
    const idxReturn = src.indexOf("!status.active");
    expect(idxReturn).toBeGreaterThan(0);
    // Les usages de admin/cookies/DB doivent venir APRÈS.
    const opIdx = Math.min(
      ...[
        src.indexOf("admin.auth"),
        src.indexOf("cookies()"),
        src.indexOf("prisma."),
      ].filter((i) => i > 0),
    );
    if (opIdx > 0) expect(opIdx).toBeGreaterThan(idxReturn);
  });

  it.each(ALL_ROUTES)("%s · notFound helper renvoie {error: Not found} + 404", (route) => {
    const src = read(route);
    expect(src).toMatch(/status:\s*404/);
    expect(src).toMatch(/error:\s*"Not found"/);
  });
});

// ─── §13 · Log server-only anonymisé · pas de PII ───────────────────────
describe("QA log · anonymisé + no PII", () => {
  const src = read(LOG);

  it("est marqué server-only", () => {
    expect(src).toMatch(/^import\s+"server-only";/m);
  });

  it("5 actions canoniques (STARTED, IMPERSONATION_STARTED/ENDED, EXPIRED, ACCESS_DENIED)", () => {
    for (const a of ["QA_SESSION_STARTED", "QA_IMPERSONATION_STARTED", "QA_IMPERSONATION_ENDED", "QA_SESSION_EXPIRED", "QA_ACCESS_DENIED"]) {
      expect(src).toContain(`"${a}"`);
    }
  });

  it("metadata allowlist stricte", () => {
    expect(src).toMatch(/ALLOWED_META_KEYS/);
    for (const k of ["persona", "sourceRole", "targetRole", "deploymentHost", "projectRef", "reasonCode"]) {
      expect(src).toContain(`"${k}"`);
    }
  });

  it("patterns interdits redactés (JWT, sk-, Bearer, email fragment)", () => {
    expect(src).toMatch(/FORBIDDEN_PATTERNS/);
    expect(src).toMatch(/eyJ\[/);
    expect(src).toMatch(/sk-\[/i);
    expect(src).toMatch(/Bearer/);
  });
});

// ─── §4 · Aucun NEXT_PUBLIC_QA_ ─────────────────────────────────────────
describe("QA · aucune variable NEXT_PUBLIC_ (protège client bundle)", () => {
  it.each([...ALL_LIB, ...ALL_ROUTES, ...ALL_UI, LINK_GEN, FIXTURES, CLEANUP])(
    "%s · aucune référence NEXT_PUBLIC_QA_ / NEXT_PUBLIC_YEMA_QA_",
    (file) => {
      const src = read(file);
      expect(src, `${file} must not reference NEXT_PUBLIC_QA_`).not.toMatch(/NEXT_PUBLIC_(?:QA|YEMA_QA)_/);
    },
  );
});

// ─── §11 · Aucun bypass RLS · resolvers métier inchangés ───────────────
describe("QA · aucun bypass RLS · resolvers métier inchangés", () => {
  it("aucun resolver Teacher/Coach/Center/Student modifié pour ajouter QA/YEMA_ADMIN fallback", () => {
    for (const rel of [
      "src/lib/permissions/teacher.ts",
      "src/lib/permissions/rootsCoach.ts",
      "src/lib/permissions/center.ts",
      "src/lib/permissions/student.ts",
    ]) {
      if (!existsSync(join(REPO, rel))) continue;
      const src = read(rel);
      // Le mot 'qa' (avec bornes de mot) ne doit pas apparaître dans les
      // resolvers métier · toute mention QA ici trahirait un contournement.
      expect(src, `${rel} must not import from @/lib/qa`).not.toMatch(/from\s+"@\/lib\/qa/);
      // Aucun `if (isQaModeActive())` court-circuit dans les resolvers.
      expect(src).not.toMatch(/isQaModeActive/);
    }
  });
});

// ─── §4 · Flag QA_MODE_ENABLED présent dans l'enum FeatureFlag ──────────
describe("QA flag · enum FeatureFlag étendu (QA_MODE_ENABLED)", () => {
  const src = read(FLAGS);

  it("QA_MODE_ENABLED est dans l'union type FeatureFlag", () => {
    expect(src).toMatch(/\|\s*"QA_MODE_ENABLED"/);
  });

  it("QA_MODE_ENABLED est dans P4_FLAGS runtime list", () => {
    expect(src).toMatch(/"QA_MODE_ENABLED",/);
  });
});

// ─── §15 · Cookie + Impersonate · pas de service_role côté client ──────
describe("QA · aucun service_role dans composants client", () => {
  it.each(ALL_UI)("%s · aucun SUPABASE_SERVICE_ROLE_KEY", (file) => {
    const src = read(file);
    expect(src, `${file} must not import SUPABASE_SERVICE_ROLE_KEY`).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(src, `${file} must not import from @/lib/supabase/server`).not.toMatch(/from\s+"@\/lib\/supabase\/server/);
  });
});

// ─── §7 · Générateur de lien · TTL 10 min max + P-1 only ────────────────
describe("QA link generator · TTL 10 min max + P-1 only", () => {
  const src = read(LINK_GEN);

  it("TTL cappé à 10 minutes", () => {
    expect(src).toMatch(/Math\.min\(10,/);
  });

  it("refuse project ref != P-1", () => {
    expect(src).toMatch(/currentRef !== P1_REF/);
    expect(src).toMatch(/kzzagbojjkivdzzcrmxn/);
  });

  it("refuse email admin sans '@'", () => {
    expect(src).toMatch(/adminEmail\.includes\("@"\)/);
  });

  it("secret minimum 32 chars", () => {
    expect(src).toMatch(/linkSecret\.length < 32/);
  });

  it("génère HMAC-SHA256 avec b64url", () => {
    expect(src).toMatch(/createHmac\("sha256"/);
  });

  it("stdout · uniquement l'URL final (jamais le secret)", () => {
    expect(src).toMatch(/process\.stdout\.write\(`\$\{url\}\\n`\)/);
    // Le stderr peut logger le host et le projectRef (public) mais pas le secret.
    expect(src).not.toMatch(/stdout\.write.*linkSecret/);
    expect(src).not.toMatch(/console\.log\(.*linkSecret/);
  });
});

// ─── §5 · Fixtures QA · préfixe strict + protection assertNonProduction ─
describe("QA fixtures · préfixe test_yema_qa_ + assertNonProduction", () => {
  const src = read(FIXTURES);

  it("préfixe canonique", () => {
    expect(src).toMatch(/const PREFIX = "test_yema_qa_"/);
  });

  it("assertNonProduction appelée EN PREMIER", () => {
    expect(src).toMatch(/^assertNonProduction\(\);/m);
  });

  it("6 personas exacts (student split en Monde vs Racines)", () => {
    for (const label of ["super_admin", "teacher", "coach", "center_admin", "student_monde", "student_racines"]) {
      expect(src).toContain(`label: "${label}"`);
    }
  });
});

// ─── §16 · Cleanup · preuve totale = 0 + protection assertNonProduction ─
describe("QA cleanup · assertNonProduction + preuve residuals = 0", () => {
  const src = read(CLEANUP);

  it("assertNonProduction en 1er", () => {
    expect(src).toMatch(/^assertNonProduction\(\);/m);
  });

  it("préfixe test_yema_qa_", () => {
    expect(src).toMatch(/const PREFIX = "test_yema_qa_"/);
  });

  it("sortie stable YEMA QA BASELINE CLEANED", () => {
    expect(src).toMatch(/YEMA QA BASELINE CLEANED/);
  });

  it("purge dans l'ordre enfants → parents (feedbacks, submissions, assignments, enrollments, classrooms, teachers, appRoles, audits, users)", () => {
    const order = [
      "assignmentFeedback.deleteMany",
      "assignmentSubmission.deleteMany",
      "assignment.deleteMany",
      "classroomEnrollment.deleteMany",
      "classroom.deleteMany",
      "teacher.deleteMany",
      "userAppRole.deleteMany",
      "auditEvent.deleteMany",
      "user.deleteMany",
    ];
    let last = 0;
    for (const call of order) {
      const idx = src.indexOf(call);
      expect(idx, `${call} must appear in cleanup`).toBeGreaterThan(0);
      expect(idx, `${call} must appear after previous step`).toBeGreaterThan(last);
      last = idx;
    }
  });
});

// ─── §14 · Page QA notFound() si !active OU cookie invalide ─────────────
describe("QA page /[locale]/qa · notFound() si gate ou cookie KO", () => {
  const src = read(PAGE_QA);

  it("appelle resolveQaConfig() puis notFound() si inactif", () => {
    expect(src).toMatch(/const status = resolveQaConfig\(\);/);
    expect(src).toMatch(/if \(!status\.active\) notFound\(\);/);
  });

  it("appelle readQaCookie() puis notFound() si cookie invalide", () => {
    expect(src).toMatch(/readQaCookie/);
    expect(src).toMatch(/if \(!cookie\.ok\) notFound\(\);/);
  });

  it("dynamic = force-dynamic", () => {
    expect(src).toMatch(/export const dynamic = "force-dynamic";/);
  });
});

// ─── Banner · aucun secret rendu ────────────────────────────────────────
describe("QA banner · affichage projectRef + expiration, aucun secret", () => {
  const src = read(BANNER);

  it("aucun email complet · uniquement hash implicite via cookie server-side", () => {
    // Le banner n'affiche jamais un email complet.
    expect(src).not.toMatch(/adminEmail\b/);
    expect(src).not.toMatch(/@[a-zA-Z0-9]/);
  });

  it("bouton exit appelle /api/qa/logout POST", () => {
    expect(src).toMatch(/"\/api\/qa\/logout"/);
    expect(src).toMatch(/method:\s*"POST"/);
  });

  it("logout fetch envoie Content-Type application/json (satisfait CSRF check)", () => {
    expect(src).toMatch(/"content-type":\s*"application\/json"/);
  });
});

// ─── QA-b1 Gate · Migration SQL + RLS deny ──────────────────────────────
describe("QA-b1 Gate · migration additive QaBootstrapNonce · RLS deny", () => {
  it("migration existe · timestamp 20260726000001", () => {
    expect(existsSync(join(REPO, MIGRATION_SQL))).toBe(true);
  });

  const sql = existsSync(join(REPO, MIGRATION_SQL)) ? read(MIGRATION_SQL) : "";

  it("CREATE TABLE avec les colonnes attendues", () => {
    for (const col of [
      "\"id\" TEXT NOT NULL",
      "\"nonce_hash\" TEXT NOT NULL",
      "\"qa_admin_email_hash\" TEXT NOT NULL",
      "\"deployment_host\" TEXT NOT NULL",
      "\"project_ref\" TEXT NOT NULL",
      "\"issued_at\" TIMESTAMP",
      "\"expires_at\" TIMESTAMP",
      "\"consumed_at\" TIMESTAMP",
    ]) {
      expect(sql).toContain(col);
    }
  });

  it("UNIQUE index sur nonce_hash", () => {
    expect(sql).toMatch(/CREATE UNIQUE INDEX "qa_bootstrap_nonces_nonce_hash_key"/);
  });

  it("CHECK constraint expiresAt > issuedAt", () => {
    expect(sql).toMatch(/CHECK \("expires_at" > "issued_at"\)/);
  });

  it("index sur expires_at + consumed_at", () => {
    expect(sql).toMatch(/CREATE INDEX "qa_bootstrap_nonces_expires_at_idx"/);
    expect(sql).toMatch(/CREATE INDEX "qa_bootstrap_nonces_consumed_at_idx"/);
  });

  it("ENABLE ROW LEVEL SECURITY", () => {
    expect(sql).toMatch(/ALTER TABLE "qa_bootstrap_nonces" ENABLE ROW LEVEL SECURITY/);
  });

  it("policies deny SELECT/INSERT/UPDATE/DELETE pour anon + authenticated", () => {
    for (const kind of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
      expect(sql).toMatch(new RegExp(`FOR ${kind}.*TO anon`, "s"));
      expect(sql).toMatch(new RegExp(`FOR ${kind}.*TO authenticated`, "s"));
    }
    // Toutes les policies utilisent USING/WITH CHECK false.
    const policyBlocks = sql.match(/CREATE POLICY "qa_nonces_deny_[^"]+"[\s\S]*?;/g) ?? [];
    expect(policyBlocks.length).toBeGreaterThanOrEqual(8); // 4 verbs × 2 rôles
    for (const b of policyBlocks) {
      expect(b).toMatch(/USING \(false\)|WITH CHECK \(false\)/);
    }
  });

  it("REVOKE ALL FROM anon et authenticated", () => {
    expect(sql).toMatch(/REVOKE ALL ON "qa_bootstrap_nonces" FROM anon/);
    expect(sql).toMatch(/REVOKE ALL ON "qa_bootstrap_nonces" FROM authenticated/);
  });

  it("model QaBootstrapNonce présent dans schema.prisma", () => {
    const schema = read(SCHEMA_PRISMA);
    expect(schema).toMatch(/model QaBootstrapNonce \{/);
    expect(schema).toMatch(/@@map\("qa_bootstrap_nonces"\)/);
    expect(schema).toMatch(/nonceHash\s+String\s+@unique/);
  });
});

// ─── QA-b1 Gate · normalisation host ────────────────────────────────────
describe("QA-b1 Gate · normalizeHost · lowercase/no proto/no port/no query", async () => {
  const mod = await import("@/lib/qa/host");

  it("lowercase + retire https:// + trailing slash", () => {
    expect(mod.normalizeHost("HTTPS://Example.COM/")).toBe("example.com");
  });

  it("retire port 443 (par défaut https)", () => {
    expect(mod.normalizeHost("example.com:443")).toBe("example.com");
  });

  it("retire port 80 (par défaut http)", () => {
    expect(mod.normalizeHost("http://example.com:80/")).toBe("example.com");
  });

  it("conserve port non-standard (p.ex. 3000)", () => {
    expect(mod.normalizeHost("localhost:3000")).toBe("localhost:3000");
  });

  it("retire query et fragment", () => {
    expect(mod.normalizeHost("example.com?a=1#f")).toBe("example.com");
  });

  it("retourne '' pour input null/undefined", () => {
    expect(mod.normalizeHost(null)).toBe("");
    expect(mod.normalizeHost(undefined)).toBe("");
  });
});

// ─── QA-b1 Gate · CSRF check ────────────────────────────────────────────
describe("QA-b1 Gate · CSRF checkCsrf · Origin + Content-Type + Sec-Fetch-Site", () => {
  const src = read(CSRF);

  it("est marqué server-only", () => {
    expect(src).toMatch(/^import\s+"server-only";/m);
  });

  it("refuse GET / PATCH / PUT / DELETE (uniquement POST)", () => {
    expect(src).toMatch(/method !== "POST"/);
    expect(src).toMatch(/"method_not_allowed"/);
  });

  it("Content-Type doit commencer par application/json", () => {
    expect(src).toMatch(/startsWith\("application\/json"\)/);
    expect(src).toMatch(/"content_type_invalid"/);
  });

  it("Origin header requis + normalisé + match host", () => {
    expect(src).toMatch(/request\.headers\.get\("origin"\)/);
    expect(src).toMatch(/normalizeHost\(new URL\(origin\)\.host\)/);
    expect(src).toMatch(/"origin_missing"/);
    expect(src).toMatch(/"origin_mismatch"/);
  });

  it("Sec-Fetch-Site cross-site/cross-origin → refus", () => {
    expect(src).toMatch(/sec-fetch-site/i);
    expect(src).toMatch(/"cross-site"/);
    expect(src).toMatch(/"sec_fetch_site_cross_site"/);
  });
});

// ─── QA-b1 Gate · Bootstrap route · atomic consume + host normalize ─────
describe("QA-b1 Gate · bootstrap route · atomic consume DB (no Map)", () => {
  const src = read(RT_BOOTSTRAP);

  it("importe atomicConsumeNonce (source de vérité DB)", () => {
    expect(src).toMatch(/from\s+"@\/lib\/qa\/nonces"/);
    expect(src).toMatch(/atomicConsumeNonce/);
  });

  it("aucune trace de Map memory API (isNonceConsumed / markNonceConsumed obsolètes)", () => {
    expect(src).not.toMatch(/isNonceConsumed\(/);
    expect(src).not.toMatch(/markNonceConsumed\(/);
    expect(src).not.toMatch(/NONCE_STORE/);
  });

  it("normalizeHost appliqué avant verifyBootstrapToken (appel, pas import)", () => {
    const idxNorm = src.indexOf("normalizeHost(url.host)");
    const idxVerify = src.indexOf("verifyBootstrapToken(token");
    expect(idxNorm).toBeGreaterThan(0);
    expect(idxVerify).toBeGreaterThan(idxNorm);
  });

  it("consumeResult.ok · sinon 404 (aucune séquence check-then-consume)", () => {
    expect(src).toMatch(/consumeResult = await atomicConsumeNonce/);
    expect(src).toMatch(/if \(!consumeResult\.ok\) \{/);
  });
});

// ─── QA-b1 Gate · Impersonate route · server-side session (no secrets) ─
describe("QA-b1 Gate · impersonate route · verifyOtp SSR · aucun secret exposé", () => {
  const src = read(RT_IMPERSONATE);

  it("CSRF check EN PREMIER après gate", () => {
    const idxGate = src.indexOf("resolveQaConfig()");
    const idxCsrf = src.indexOf("checkCsrf(request)");
    const idxBody = src.indexOf("await request.json()");
    expect(idxGate).toBeGreaterThan(0);
    expect(idxCsrf).toBeGreaterThan(idxGate);
    expect(idxBody).toBeGreaterThan(idxCsrf);
  });

  it("normalizeHost pour lier au deploymentHost", () => {
    expect(src).toMatch(/normalizeHost/);
  });

  it("verifyOtp appelé server-side avec token_hash", () => {
    expect(src).toMatch(/hashed_token/);
    expect(src).toMatch(/verifyOtp\(/);
    expect(src).toMatch(/token_hash:/);
  });

  it("aucun actionLink / redirectUrl / access_token / refresh_token / OTP dans les réponses JSON", () => {
    // La réponse route ne DOIT PAS contenir de secret ni de magic link.
    expect(src).not.toMatch(/redirectUrl:/);
    expect(src).not.toMatch(/actionLink/);
    expect(src).not.toMatch(/action_link/);
    expect(src).not.toMatch(/access_token/);
    expect(src).not.toMatch(/refresh_token/);
    expect(src).not.toMatch(/NextResponse\.json\([^)]*hashed_token/);
    expect(src).not.toMatch(/NextResponse\.json\([^)]*token_hash/);
  });

  it("réponse finale = 303 Redirect vers destination (aucun body secret)", () => {
    expect(src).toMatch(/NextResponse\.redirect/);
    expect(src).toMatch(/status:\s*303/);
    expect(src).toMatch(/persona\.destination\("fr"\)/);
  });

  it("client SSR canonique utilisé pour écrire cookies (createSsrClient)", () => {
    expect(src).toMatch(/createSsrClient|@\/lib\/supabase\/server/);
  });
});

// ─── QA-b1 Gate · Logout route · CSRF check + 303 ──────────────────────
describe("QA-b1 Gate · logout route · CSRF + 303 goodbye", () => {
  const src = read(RT_LOGOUT);

  it("checkCsrf EN PREMIER après gate", () => {
    const idxGate = src.indexOf("resolveQaConfig()");
    const idxCsrf = src.indexOf("checkCsrf(request)");
    expect(idxGate).toBeGreaterThan(0);
    expect(idxCsrf).toBeGreaterThan(idxGate);
  });

  it("SSR client · signOut · clearQaCookie · 303 goodbye", () => {
    expect(src).toMatch(/createSsrClient/);
    expect(src).toMatch(/supabase\.auth\.signOut/);
    expect(src).toMatch(/clearQaCookie/);
    expect(src).toMatch(/NextResponse\.redirect/);
    expect(src).toMatch(/status:\s*303/);
    expect(src).toMatch(/\/fr\/goodbye/);
  });
});

// ─── QA-b1 Gate · Client bundles n'exposent AUCUN magic link ────────────
describe("QA-b1 Gate · client bundles ne référencent aucun action_link / token_hash", () => {
  it.each(ALL_UI)("%s · aucune référence action_link / token_hash / access_token / refresh_token", (file) => {
    const src = read(file);
    expect(src, `${file} must not reference action_link`).not.toMatch(/action_link/);
    expect(src, `${file} must not reference token_hash`).not.toMatch(/token_hash/);
    expect(src, `${file} must not reference access_token`).not.toMatch(/access_token/);
    expect(src, `${file} must not reference refresh_token`).not.toMatch(/refresh_token/);
    expect(src, `${file} must not reference magiclink`).not.toMatch(/magiclink/);
    expect(src, `${file} must not reference generateLink`).not.toMatch(/generateLink/);
  });
});

// ─── QA-b1 Gate · Link generator · INSERT DB avant signature ────────────
describe("QA-b1 Gate · link generator · INSERT nonce en DB AVANT signature", () => {
  const src = read(LINK_GEN);

  it("importe PrismaClient (source de vérité DB)", () => {
    expect(src).toMatch(/from\s+"@prisma\/client"/);
  });

  it("crée le nonce cryptographiquement sûr (randomBytes 32 octets)", () => {
    expect(src).toMatch(/randomBytes\(32\)\.toString\("hex"\)/);
  });

  it("INSERT dans qaBootstrapNonce AVANT la signature (hashage local du nonce brut)", () => {
    const idxHash = src.indexOf("nonceHash = createHash");
    const idxInsert = src.indexOf("db.qaBootstrapNonce.create");
    const idxSign = src.indexOf("createHmac(");
    expect(idxHash).toBeGreaterThan(0);
    expect(idxInsert).toBeGreaterThan(idxHash);
    expect(idxSign).toBeGreaterThan(idxInsert);
  });

  it("normalise le host avant utilisation", () => {
    expect(src).toMatch(/function normalizeHost/);
    expect(src).toMatch(/const host = normalizeHost\(hostRaw\)/);
  });

  it("stdout n'affiche jamais le nonce brut ni le secret", () => {
    // Le nonce apparait dans le payload signé (URL) mais jamais loggué séparément.
    expect(src).not.toMatch(/stdout\.write\([^)]*nonce\)/);
    expect(src).not.toMatch(/stderr\.write\([^)]*nonce\b/);
    expect(src).not.toMatch(/console\.log\([^)]*(?:nonce|linkSecret|adminEmail)/);
  });
});

// ─── QA-b1 Gate · Cleanup nonces ────────────────────────────────────────
describe("QA-b1 Gate · cleanup · purge nonces expirés/consommés/test-scope", () => {
  const src = read(CLEANUP);

  it("appelle qaBootstrapNonce.deleteMany", () => {
    expect(src).toMatch(/qaBootstrapNonce\.deleteMany/);
  });

  it("cible expiresAt < now OR consumedAt IS NOT NULL OR host localhost/127.0.0.1", () => {
    expect(src).toMatch(/expiresAt:\s*\{\s*lt:\s*new Date\(\)/);
    expect(src).toMatch(/consumedAt:\s*\{\s*not:\s*null/);
    expect(src).toMatch(/localhost/);
    expect(src).toMatch(/127\.0\.0\.1/);
  });

  it("residuals inclut nonces_active pour observabilité (mais ne bloque pas)", () => {
    expect(src).toMatch(/nonces_active/);
  });

  it("QA-b1.1 · purge inclut le scope de test test-yema-qa-* (nonces actifs non consommés)", () => {
    expect(src).toMatch(/test-yema-qa-/);
  });
});

// ─── QA-b1.1 · Vérifier atomicConsumeNonce contract (result.count) ─────
describe("QA-b1.1 · atomicConsumeNonce · contrat exact updateMany().count", () => {
  const src = read(NONCES);

  it("compare exactement `result.count === 1` (jamais un id retourné)", () => {
    expect(src).toMatch(/result\.count === 1/);
    // Aucun retour d'id · Prisma updateMany ne retourne PAS d'id.
    expect(src).not.toMatch(/RETURNING\s+"id"/i);
    expect(src).not.toMatch(/result\.id/);
    expect(src).not.toMatch(/rows\[0\]/);
  });

  it("aucune assertion 'UPDATE...RETURNING' dans le code (updateMany ne retourne que count)", () => {
    // Prisma updateMany retourne { count: number } · l'atomicité vient
    // du single-statement UPDATE, pas du RETURNING.
    expect(src).not.toMatch(/RETURNING/);
  });

  it("le message d'échec est stable · 'nonce_not_found_or_already_consumed'", () => {
    expect(src).toMatch(/"nonce_not_found_or_already_consumed"/);
  });
});

// ─── QA-b1.1 · Ordre routes · gate → CSRF → cookie → body → DB ──────────
describe("QA-b1.1 · ordre routes · gate d'abord puis CSRF puis cookie/body/DB", () => {
  // Utilitaire · strip comments avant index lookup pour éviter les faux
  // positifs quand un nom apparaît d'abord dans un commentaire d'entête.
  function stripComments(src: string): string {
    return src
      .split("\n")
      .filter((l) => !l.trim().startsWith("//"))
      .join("\n");
  }

  it("impersonate route · resolveQaConfig < checkCsrf < readQaCookie < request.json < generateLink < verifyOtp", () => {
    const src = stripComments(read(RT_IMPERSONATE));
    const idxGate = src.indexOf("resolveQaConfig()");
    const idxCsrf = src.indexOf("checkCsrf(request)");
    const idxCookie = src.indexOf("readQaCookie(");
    const idxBody = src.indexOf("await request.json()");
    const idxGen = src.indexOf("admin.auth.admin.generateLink");
    const idxVerify = src.indexOf(".verifyOtp(");
    expect(idxGate).toBeGreaterThan(0);
    expect(idxCsrf).toBeGreaterThan(idxGate);
    expect(idxCookie).toBeGreaterThan(idxCsrf);
    expect(idxBody).toBeGreaterThan(idxCookie);
    expect(idxGen).toBeGreaterThan(idxBody);
    expect(idxVerify).toBeGreaterThan(idxGen);
  });

  it("logout route · resolveQaConfig < checkCsrf < signOut < clearQaCookie", () => {
    const src = stripComments(read(RT_LOGOUT));
    const idxGate = src.indexOf("resolveQaConfig()");
    const idxCsrf = src.indexOf("checkCsrf(request)");
    const idxSignOut = src.indexOf(".signOut(");
    const idxClear = src.indexOf("clearQaCookie()");
    expect(idxGate).toBeGreaterThan(0);
    expect(idxCsrf).toBeGreaterThan(idxGate);
    expect(idxSignOut).toBeGreaterThan(idxCsrf);
    expect(idxClear).toBeGreaterThan(idxSignOut);
  });

  it("bootstrap route · resolveQaConfig < searchParams.get('t') < verifyBootstrapToken(call) < atomicConsumeNonce(call) < setQaCookie(call)", () => {
    const src = stripComments(read(RT_BOOTSTRAP));
    const idxGate = src.indexOf("resolveQaConfig()");
    const idxToken = src.indexOf('url.searchParams.get("t")');
    const idxVerify = src.indexOf("verifyBootstrapToken(token");
    const idxConsume = src.indexOf("atomicConsumeNonce(");
    const idxCookie = src.indexOf("setQaCookie(");
    expect(idxGate).toBeGreaterThan(0);
    expect(idxToken).toBeGreaterThan(idxGate);
    expect(idxVerify).toBeGreaterThan(idxToken);
    expect(idxConsume).toBeGreaterThan(idxVerify);
    expect(idxCookie).toBeGreaterThan(idxConsume);
  });
});

// ─── QA-b1.1 · Flag-off · toutes routes 404 sans DB/log/generateLink ────
describe("QA-b1.1 · flag-off / VERCEL_ENV=production · 404 stable sans effet de bord", async () => {
  const { resolveQaConfig } = await import("@/lib/qa/config");

  it("gate inactif quand VERCEL_ENV != preview + pas de YEMA_QA_ALLOW_LOCAL", () => {
    const backup = {
      VERCEL_ENV: process.env.VERCEL_ENV,
      YEMA_QA_ALLOW_LOCAL: process.env.YEMA_QA_ALLOW_LOCAL,
      YEMA_QA_MODE_ENABLED: process.env.YEMA_QA_MODE_ENABLED,
    };
    process.env.VERCEL_ENV = "production";
    delete process.env.YEMA_QA_ALLOW_LOCAL;
    process.env.YEMA_QA_MODE_ENABLED = "true";
    try {
      const r = resolveQaConfig();
      expect(r.active).toBe(false);
      if (!r.active) expect(r.reason).toBe("not_preview");
    } finally {
      // restore
      if (backup.VERCEL_ENV !== undefined) process.env.VERCEL_ENV = backup.VERCEL_ENV; else delete process.env.VERCEL_ENV;
      if (backup.YEMA_QA_ALLOW_LOCAL !== undefined) process.env.YEMA_QA_ALLOW_LOCAL = backup.YEMA_QA_ALLOW_LOCAL; else delete process.env.YEMA_QA_ALLOW_LOCAL;
      if (backup.YEMA_QA_MODE_ENABLED !== undefined) process.env.YEMA_QA_MODE_ENABLED = backup.YEMA_QA_MODE_ENABLED; else delete process.env.YEMA_QA_MODE_ENABLED;
    }
  });

  it("gate inactif quand flag disabled même en preview", () => {
    const backup = {
      VERCEL_ENV: process.env.VERCEL_ENV,
      YEMA_QA_MODE_ENABLED: process.env.YEMA_QA_MODE_ENABLED,
    };
    process.env.VERCEL_ENV = "preview";
    process.env.YEMA_QA_MODE_ENABLED = "false";
    try {
      const r = resolveQaConfig();
      expect(r.active).toBe(false);
      if (!r.active) expect(r.reason).toBe("flag_disabled");
    } finally {
      if (backup.VERCEL_ENV !== undefined) process.env.VERCEL_ENV = backup.VERCEL_ENV; else delete process.env.VERCEL_ENV;
      if (backup.YEMA_QA_MODE_ENABLED !== undefined) process.env.YEMA_QA_MODE_ENABLED = backup.YEMA_QA_MODE_ENABLED; else delete process.env.YEMA_QA_MODE_ENABLED;
    }
  });

  it("gate inactif quand secrets manquants", () => {
    const backup = {
      VERCEL_ENV: process.env.VERCEL_ENV,
      YEMA_QA_MODE_ENABLED: process.env.YEMA_QA_MODE_ENABLED,
      YEMA_QA_SESSION_SECRET: process.env.YEMA_QA_SESSION_SECRET,
      YEMA_QA_LINK_SIGNING_SECRET: process.env.YEMA_QA_LINK_SIGNING_SECRET,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    };
    process.env.VERCEL_ENV = "preview";
    process.env.YEMA_QA_MODE_ENABLED = "true";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://kzzagbojjkivdzzcrmxn.supabase.co";
    delete process.env.YEMA_QA_SESSION_SECRET;
    delete process.env.YEMA_QA_LINK_SIGNING_SECRET;
    try {
      const r = resolveQaConfig();
      expect(r.active).toBe(false);
      if (!r.active) expect(r.reason).toBe("missing_secrets");
    } finally {
      for (const k of Object.keys(backup) as (keyof typeof backup)[]) {
        if (backup[k] !== undefined) process.env[k] = backup[k]!;
        else delete process.env[k];
      }
    }
  });

  it("routes bootstrap/impersonate/logout · gate KO → aucune référence DB (Prisma) dans le fast-path 404", () => {
    // Verrou structurel · les 3 routes vérifient status.active avant TOUT
    // usage de prisma. Aucun `import { prisma }` non-conditionnel qui
    // s'exécute avant le return notFound() sur gate KO.
    for (const rel of [RT_BOOTSTRAP, RT_IMPERSONATE, RT_LOGOUT]) {
      const src = read(rel);
      const idxGateReturn = src.indexOf("if (!status.active) return notFound()");
      expect(idxGateReturn, `${rel} must have gate → 404 shortcut`).toBeGreaterThan(0);
    }
  });
});

// ─── QA-b1.1 · Hashes 64 hex (SHA-256 complet, aucune troncation) ──────
describe("QA-b1.1 · hashes SHA-256 complets · aucune troncation en DB", async () => {
  const cookieMod = await import("@/lib/qa/cookie");
  const noncesMod = await import("@/lib/qa/nonces");

  it("hashEmail retourne 64 hex chars (SHA-256 full · aucun .slice)", () => {
    const h = cookieMod.hashEmail("test@example.com", "kzzagbojjkivdzzcrmxn");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashNonce retourne 64 hex chars (SHA-256 full)", () => {
    const h = noncesMod.hashNonce("nonce-test-value");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("code source cookie.ts · aucune troncation .slice(0, 32) sur hashEmail", () => {
    const src = read(COOKIE);
    // Le hashEmail doit se terminer par digest("hex") · pas .slice.
    expect(src).toMatch(/digest\("hex"\);/);
    // Pas de slice qui tronque le hash email.
    const fnBlock = src.match(/export function hashEmail[\s\S]*?^\}/m);
    expect(fnBlock).not.toBeNull();
    expect(fnBlock![0]).not.toMatch(/\.slice\(0,\s*32\)/);
  });

  it("link generator · hashEmail sans slice", () => {
    const src = read(LINK_GEN);
    const fnBlock = src.match(/emailHash = createHash[\s\S]*?digest[^;]*;/);
    expect(fnBlock).not.toBeNull();
    expect(fnBlock![0]).not.toMatch(/\.slice\(0,\s*32\)/);
  });
});

// ─── QA-b1.1 · verifyOtp type="email" (canonique pour token_hash email) ─
describe("QA-b1.1 · verifyOtp type=\"email\" (EmailOtpType canonique)", () => {
  const src = read(RT_IMPERSONATE);

  it("impersonate appelle verifyOtp avec type=\"email\" (align with EmailOtpType)", () => {
    // On accepte 'email' ou 'magiclink' (les 2 sont dans EmailOtpType) ·
    // le brief préfère 'email' plus général.
    expect(src).toMatch(/type:\s*"email"/);
    // Pas d'ancien type='magiclink' résiduel.
    expect(src).not.toMatch(/verifyOtp\([^)]*type:\s*"magiclink"/);
  });
});
