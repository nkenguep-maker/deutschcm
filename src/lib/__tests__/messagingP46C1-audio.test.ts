import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// P4.6-C.1 · invariants structurels audio privé asynchrone.

const ROOT = resolve(__dirname, "../..");
function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}
function readRepo(rel: string): string {
  return readFileSync(resolve(ROOT, "..", rel), "utf-8");
}

describe("Audio limits · server-only + valeurs brief §3", () => {
  const src = read("lib/messaging/audio/limits.ts");

  it("import 'server-only'", () => {
    expect(src).toMatch(/^import\s+"server-only";/);
  });

  it("adulte · 180s / 8 MiB / 20 uploads/h", () => {
    expect(src).toMatch(/ADULT:\s*\{[\s\S]*?maxDurationMs:\s*180_000/);
    expect(src).toMatch(/ADULT:\s*\{[\s\S]*?maxSizeBytes:\s*8\s*\*\s*1024\s*\*\s*1024/);
    expect(src).toMatch(/ADULT:\s*\{[\s\S]*?maxUploadsPerHour:\s*20/);
  });

  it("enfant · 60s / 4 MiB / 10 uploads/h", () => {
    expect(src).toMatch(/CHILD:\s*\{[\s\S]*?maxDurationMs:\s*60_000/);
    expect(src).toMatch(/CHILD:\s*\{[\s\S]*?maxSizeBytes:\s*4\s*\*\s*1024\s*\*\s*1024/);
    expect(src).toMatch(/CHILD:\s*\{[\s\S]*?maxUploadsPerHour:\s*10/);
  });

  it("5 MIME autorisés · webm/ogg/mp4/mpeg/wav", () => {
    for (const m of ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"]) {
      expect(src).toMatch(new RegExp(`"${m}"`));
    }
  });

  it("bucket canonique yema-messaging-audio-private", () => {
    expect(src).toMatch(/AUDIO_BUCKET_NAME\s*=\s*"yema-messaging-audio-private"/);
  });

  it("TTL signed URL ≤ 300s", () => {
    expect(src).toMatch(/AUDIO_SIGNED_URL_TTL_SECONDS\s*=\s*300/);
  });

  it("retention bornes 30..730 jours · défaut 365", () => {
    expect(src).toMatch(/AUDIO_RETENTION_MIN_DAYS\s*=\s*30/);
    expect(src).toMatch(/AUDIO_RETENTION_MAX_DAYS\s*=\s*730/);
    expect(src).toMatch(/AUDIO_RETENTION_DEFAULT_DAYS\s*=\s*365/);
  });

  it("getRetentionDays clamp via YEMA_MESSAGE_AUDIO_RETENTION_DAYS", () => {
    expect(src).toMatch(/YEMA_MESSAGE_AUDIO_RETENTION_DAYS/);
    expect(src).not.toMatch(/NEXT_PUBLIC_YEMA_MESSAGE_AUDIO/);
  });
});

describe("Audio validation · magic bytes + music-metadata", () => {
  const src = read("lib/messaging/audio/validation.ts");

  it("import 'server-only' + music-metadata pure-JS", () => {
    expect(src).toMatch(/^import\s+"server-only";/);
    expect(src).toMatch(/from\s+["']music-metadata["']/);
  });

  it("détecte magic bytes des 5 formats", () => {
    expect(src).toMatch(/0x1a[\s\S]*?0x45[\s\S]*?0xdf[\s\S]*?0xa3/); // WebM/Matroska
    expect(src).toMatch(/0x4f[\s\S]*?0x67[\s\S]*?0x67[\s\S]*?0x53/); // OggS
    expect(src).toMatch(/0x52[\s\S]*?0x49[\s\S]*?0x46[\s\S]*?0x46/); // RIFF
    expect(src).toMatch(/0x49[\s\S]*?0x44[\s\S]*?0x33/);              // ID3
    expect(src).toMatch(/0x66[\s\S]*?0x74[\s\S]*?0x79[\s\S]*?0x70/); // ftyp
  });

  it("refuse si magic byte inconnu · fail-closed", () => {
    expect(src).toMatch(/unsupported_container/);
  });

  it("valide durée réelle via music-metadata + refuse si absente", () => {
    expect(src).toMatch(/parseBuffer\(buf,\s*\{\s*mimeType:\s*magicMime/);
    expect(src).toMatch(/duration_missing/);
    expect(src).toMatch(/duration_exceeded/);
  });

  it("MIME canonique choisi par le magic byte · pas file.type", () => {
    // On accepte magicMime, pas le mime client.
    expect(src).toMatch(/return \{\s*ok:\s*true,\s*mimeType:\s*magicMime/);
  });
});

describe("Storage helper · service_role + private bucket", () => {
  const src = read("lib/messaging/audio/storage.ts");

  it("service_role only · aucun anon", () => {
    expect(src).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(src).not.toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
    expect(src).toMatch(/^import\s+"server-only";/);
  });

  it("buildStorageKey · v1/<conversationId>/<id>.<ext> · aucune PII", () => {
    expect(src).toMatch(/`v1\/\$\{input\.conversationId\}\/\$\{input\.audioAssetId\}\.\$\{safeExt\}`/);
    // Aucun email/nom/persona dans le path (grep basic).
    expect(src).not.toMatch(/email|persona|firstName|lastName/i);
  });

  it("createPlaybackSignedUrl · TTL bounded ≤ 300s", () => {
    expect(src).toMatch(/Math\.min\(input\.ttlSeconds \?\? AUDIO_SIGNED_URL_TTL_SECONDS,\s*AUDIO_SIGNED_URL_TTL_SECONDS\)/);
  });

  it("uploadAudioObject · upsert:false + cacheControl no-store", () => {
    expect(src).toMatch(/upsert:\s*false/);
    expect(src).toMatch(/cacheControl:\s*["']no-store["']/);
  });
});

describe("Ensure bucket script · P-1 uniquement · fallback SQL runbook", () => {
  const src = readRepo("scripts/ensure-messaging-audio-bucket.mjs");

  it("P-1 hardcode + blocklist 3 refs", () => {
    expect(src).toMatch(/const P1_REF = "kzzagbojjkivdzzcrmxn"/);
    expect(src).toMatch(/"sbjhvlrkbyjckdxujjsk"/);
    expect(src).toMatch(/"mamofhrurksyuuolucea"/);
    expect(src).toMatch(/"qggwvonfumuimjfsgpdz"/);
  });

  it("createBucket · public:false + MIME whitelist + 8 MiB limit", () => {
    expect(src).toMatch(/public:\s*false/);
    expect(src).toMatch(/allowedMimeTypes:\s*MIMES/);
    expect(src).toMatch(/fileSizeLimit:\s*FILE_SIZE_LIMIT/);
  });

  it("fallback SQL Editor runbook si Storage API refuse", () => {
    expect(src).toMatch(/printFallbackSql/);
    expect(src).toMatch(/MANUAL APPLY REQUIRED/);
  });
});

describe("SQL fallback · p4-6-c-audio-storage-p1.sql (paste-ready)", () => {
  const sql = readRepo("scripts/sql/p4-6-c-audio-storage-p1.sql");

  it("bucket INSERT ON CONFLICT · public=false · file_size_limit 8 MiB", () => {
    expect(sql).toMatch(/INSERT INTO storage\.buckets/);
    expect(sql).toMatch(/'yema-messaging-audio-private'/);
    expect(sql).toMatch(/false,\s*8388608/);
    expect(sql).toMatch(/ON CONFLICT[\s\S]*?public\s*=\s*false/);
  });

  it("aucune policy Storage authenticated/anon sur ce bucket · nettoyage préventif", () => {
    expect(sql).toMatch(/DROP POLICY IF EXISTS[\s\S]*?yema_messaging_audio/);
    // Aucune CREATE POLICY publique.
    expect(sql).not.toMatch(/CREATE POLICY[^;]*yema_messaging_audio/);
  });

  it("paste-ready · aucune commande Prisma ni chemin fichier", () => {
    expect(sql).not.toMatch(/npx prisma|prisma\/migrations|node scripts\//);
  });
});

describe("Upload endpoint · ordre strict + rollback + audit", () => {
  const src = read("app/api/messaging/conversations/[conversationId]/audio/route.ts");

  it("runtime nodejs (Buffer + music-metadata)", () => {
    expect(src).toMatch(/export const runtime = "nodejs"/);
  });

  it("ordre · flag → actor → origin → access → matrix → quota → validation", () => {
    // Cible le corps de POST · évite les faux positifs des imports.
    const bodyStart = src.indexOf("export async function POST");
    expect(bodyStart).toBeGreaterThan(0);
    const body = src.slice(bodyStart);
    const idxFlag     = body.indexOf("isMessagingAudioEnabled()");
    const idxActor    = body.indexOf("resolveMessagingActor()");
    const idxOrigin   = body.indexOf("origin_mismatch");
    const idxAccess   = body.indexOf("assertConversationAccess");
    const idxMatrix   = body.indexOf("isKindAllowedForActor");
    const idxQuota    = body.indexOf("hasReachedAudioUploadQuota");
    const idxValidate = body.indexOf("validateAudioBuffer");
    expect(idxFlag).toBeGreaterThan(0);
    expect(idxFlag).toBeLessThan(idxActor);
    expect(idxActor).toBeLessThan(idxOrigin);
    expect(idxOrigin).toBeLessThan(idxAccess);
    expect(idxAccess).toBeLessThan(idxMatrix);
    expect(idxMatrix).toBeLessThan(idxQuota);
    expect(idxQuota).toBeLessThan(idxValidate);
  });

  it("Content-Length preflight refuse >8MiB+margin", () => {
    expect(src).toMatch(/content-length/i);
    expect(src).toMatch(/size_exceeded/);
  });

  it("Idempotence via clientMessageId · refuse collision inter-acteur", () => {
    expect(src).toMatch(/idempotencyKey:\s*clientMessageId/);
    expect(src).toMatch(/idempotency_collision/);
  });

  it("Rollback Storage si transaction DB échoue · deleteAudioObject", () => {
    expect(src).toMatch(/catch\s*\{[\s\S]*?deleteAudioObject\(storageKey\)/);
    expect(src).toMatch(/MESSAGE_AUDIO_UPLOAD_FAILED/);
  });

  it("AuditEvent MESSAGE_AUDIO_CREATED DANS la transaction", () => {
    expect(src).toMatch(/writeAuditEvent\(\s*\{[\s\S]*?MESSAGE_AUDIO_CREATED[\s\S]*?\},\s*tx/);
  });

  it("Broadcast APRÈS commit uniquement", () => {
    const idxCommit = src.indexOf("messageId = result");
    const idxBroadcast = src.indexOf("broadcastMessageCreated(");
    expect(idxCommit).toBeGreaterThan(0);
    expect(idxBroadcast).toBeGreaterThan(idxCommit);
  });

  it("PARENT_COPY si actor est CHILD_PROFILE", () => {
    expect(src).toMatch(/if \(actor\.actorType === "CHILD_PROFILE"\)[\s\S]*?GUARDIAN_OBSERVER[\s\S]*?PARENT_COPY/);
  });

  it("Réponse ne contient JAMAIS l'URL signée", () => {
    expect(src).not.toMatch(/createPlaybackSignedUrl/);
    expect(src).not.toMatch(/signedUrl/i);
    expect(src).not.toMatch(/storageKey:\s*[^,\n]+\}/); // storageKey pas dans le JSON de réponse
  });
});

describe("Playback endpoint · TTL ≤300s + no-store + Super Admin refusé pédagogique", () => {
  const src = read("app/api/messaging/audio/[audioAssetId]/playback/route.ts");

  it("méthode POST · pas GET (brief §7)", () => {
    expect(src).toMatch(/export async function POST\(/);
    expect(src).not.toMatch(/export async function GET\(/);
  });

  it("headers no-store", () => {
    expect(src).toMatch(/set\(["']Cache-Control["'],\s*["']private,\s*no-store["']\)/);
    expect(src).toMatch(/set\(["']Pragma["'],\s*["']no-cache["']\)/);
  });

  it("READY seul autorisé · PENDING/FAILED refusés · DELETED/EXPIRED → 410", () => {
    expect(src).toMatch(/asset\.status !== "READY"/);
    expect(src).toMatch(/DELETED[\s\S]*?EXPIRED[\s\S]*?return gone/);
  });

  it("Super Admin · autorisé UNIQUEMENT CENTER_PLATFORM_SUPPORT / PLATFORM_BROADCAST", () => {
    expect(src).toMatch(/actor\.persona === "super_admin"[\s\S]*?CENTER_PLATFORM_SUPPORT[\s\S]*?PLATFORM_BROADCAST/);
    expect(src).toMatch(/super_admin_pedagogical_forbidden/);
  });

  it("participant leftAt IS NULL requis · non-participant → 404", () => {
    expect(src).toMatch(/leftAt:\s*null/);
    expect(src).toMatch(/not_participant/);
  });

  it("AuditEvent MESSAGE_AUDIO_PLAYBACK_GRANTED + ACCESS_DENIED", () => {
    expect(src).toMatch(/MESSAGE_AUDIO_PLAYBACK_GRANTED/);
    expect(src).toMatch(/MESSAGE_AUDIO_ACCESS_DENIED/);
  });

  it("Réponse contient url + expiresAt + durationMs + mimeType · aucun storageKey/bucket", () => {
    expect(src).toMatch(/url:\s*signed\.data\.url/);
    expect(src).toMatch(/expiresAt:\s*signed\.data\.expiresAt/);
    expect(src).not.toMatch(/bucket:\s*AUDIO_BUCKET_NAME/);
    // storageKey ne fuit pas côté réponse (seule mention est en input du signer).
    const jsonBlock = src.match(/NextResponse\.json\(\{[\s\S]*?\}\)/g) ?? [];
    for (const b of jsonBlock) expect(b).not.toMatch(/storageKey/);
  });
});

describe("Cleanup script · dry-run par défaut · P-1 fail-closed", () => {
  const src = readRepo("scripts/cleanup-messaging-audio.mjs");

  it("P-1 uniquement + blocklist", () => {
    expect(src).toMatch(/const P1_REF = "kzzagbojjkivdzzcrmxn"/);
    expect(src).toMatch(/BLOCKED = new Set/);
    expect(src).toMatch(/sbjhvlrkbyjckdxujjsk/);
  });

  it("--dry-run par défaut · --apply explicite requis", () => {
    expect(src).toMatch(/const APPLY = args\.includes\("--apply"\)/);
    expect(src).toMatch(/dry-run \(défaut/);
  });

  it("purge · pending>24h + failed>7j + retention expirée", () => {
    expect(src).toMatch(/PENDING_TIMEOUT_MS/);
    expect(src).toMatch(/FAILED_RETENTION_MS/);
    expect(src).toMatch(/status:\s*"READY",\s*expiresAt:\s*\{\s*lt:\s*now\s*\}/);
  });

  it("marker DELETED + deletedAt + storageKey=null · aucun log de storageKey complet", () => {
    // P4.6-C.1.1 · mutation déportée dans le core partagé · le CLI passe
    // par deps.markDeleted qui exécute cette update Prisma.
    expect(src).toMatch(/status:\s*"DELETED",\s*deletedAt:\s*at,\s*storageKey:\s*null/);
    expect(src).toMatch(/maskId/);
  });

  it("AuditEvent MESSAGE_AUDIO_PURGED · émis par le core après Storage confirmé", () => {
    // P4.6-C.1.1 · action émise dans cleanupCore.mjs (§4 storage-first).
    // Le CLI expose writeAudit qui appelle db.auditEvent.create.
    expect(src).toMatch(/action:\s*evt\.action/);
    const core = readRepo("src/lib/messaging/audio/cleanupCore.mjs");
    expect(core).toMatch(/action:\s*"MESSAGE_AUDIO_PURGED"/);
  });
});

describe("Commande npm test:messaging-audio:p1 · non-skippable", () => {
  const pkg = JSON.parse(readRepo("package.json"));
  const runner = readRepo("scripts/test-messaging-audio-p1.mjs");

  it("npm script défini", () => {
    expect(pkg.scripts["test:messaging-audio:p1"]).toBe(
      "node scripts/test-baseline/run-p4-5-b2-p1.mjs --flag on -- node scripts/orchestrate-audio-e2e.mjs",
    );
  });

  it("exige 6 credentials E2E + refuse non-P1", () => {
    for (const v of ["E2E_TEACHER_EMAIL", "E2E_TEACHER_PASSWORD", "E2E_STUDENT_EMAIL", "E2E_STUDENT_PASSWORD", "E2E_OUTSIDER_EMAIL", "E2E_OUTSIDER_PASSWORD"]) {
      expect(runner).toMatch(new RegExp(`"${v}"`));
    }
    expect(runner).toMatch(/NON-SKIPPABLE/);
    expect(runner).toMatch(/kzzagbojjkivdzzcrmxn/);
  });

  it("upload Teacher → 201 · playback Teacher/Student → 200 · Outsider → 403/404", () => {
    expect(runner).toMatch(/upload attendu 201/);
    expect(runner).toMatch(/teacher playback attendu 200/);
    expect(runner).toMatch(/student playback attendu 200/);
    expect(runner).toMatch(/outsider playback attendu 403\/404/);
  });

  it("fixture WAV généré en mémoire (aucun enregistrement humain)", () => {
    expect(runner).toMatch(/function makeWav/);
    expect(runner).toMatch(/RIFF/);
  });
});

describe("AuditEvent · aucune fuite storageKey/URL/body dans metadata", () => {
  const uploadSrc = read("app/api/messaging/conversations/[conversationId]/audio/route.ts");
  const playbackSrc = read("app/api/messaging/audio/[audioAssetId]/playback/route.ts");
  const eventsSrc = read("lib/audit/events.ts");

  it("events.ts blackliste body/audioUrl/signedUrl/transcription", () => {
    expect(eventsSrc).toMatch(/FORBIDDEN_METADATA_KEYS[\s\S]*?"body"[\s\S]*?"audioUrl"[\s\S]*?"signedUrl"[\s\S]*?"transcription"/);
  });

  it("metadata audit contient uniquement · actorType/durationBucket/sizeBucket/mimeType/reasonCode", () => {
    // Upload metadata whitelist implicite via keys.
    const auditBlocks = uploadSrc.match(/writeAuditEvent\(\{[\s\S]*?\}[\s,]/g) ?? [];
    expect(auditBlocks.length).toBeGreaterThan(0);
    for (const b of auditBlocks) {
      expect(b).not.toMatch(/storageKey/);
      expect(b).not.toMatch(/signedUrl/);
      expect(b).not.toMatch(/body:\s*[^n]/); // pas de champ 'body' réel
    }
    // Playback idem.
    const playbackAudits = playbackSrc.match(/writeAuditEvent\(\{[\s\S]*?\}\)/g) ?? [];
    for (const b of playbackAudits) {
      expect(b).not.toMatch(/storageKey/);
      expect(b).not.toMatch(/signedUrl/);
    }
  });
});

describe("Migration Prisma · additions minimales", () => {
  const src = readRepo("prisma/migrations/20260731000004_p4_6_c1_messaging_audio_asset_extras/migration.sql");

  it("ADD COLUMN conversationId + deletedAt IF NOT EXISTS", () => {
    expect(src).toMatch(/ADD COLUMN IF NOT EXISTS "conversationId" TEXT/);
    expect(src).toMatch(/ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ/);
  });

  it("DELETED sur enum MessagingAudioStatus · idempotent", () => {
    expect(src).toMatch(/ALTER TYPE "MessagingAudioStatus" ADD VALUE 'DELETED'/);
  });

  it("5 AuditAction ajoutées (idempotent)", () => {
    for (const v of ["MESSAGE_AUDIO_CREATED", "MESSAGE_AUDIO_ACCESS_DENIED", "MESSAGE_AUDIO_PLAYBACK_GRANTED", "MESSAGE_AUDIO_UPLOAD_FAILED", "MESSAGE_AUDIO_PURGED"]) {
      expect(src).toMatch(new RegExp(`'${v}'`));
    }
  });

  it("indexes pour retention/cleanup", () => {
    expect(src).toMatch(/CREATE INDEX IF NOT EXISTS[\s\S]*?conversationId.*status/);
    expect(src).toMatch(/CREATE INDEX IF NOT EXISTS[\s\S]*?status.*deletedAt/);
  });
});
