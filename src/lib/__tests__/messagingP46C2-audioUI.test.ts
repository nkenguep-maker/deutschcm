import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// P4.6-C.2 · invariants structurels UI enregistrement / lecture audio.

const ROOT = resolve(__dirname, "../..");
function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}
function readRepo(rel: string): string {
  return readFileSync(resolve(ROOT, "..", rel), "utf-8");
}

describe("MIME negotiation · ordre + fallback", () => {
  const src = read("features/messaging/audio/mimeNegotiation.ts");

  it("ordre de préférence brief §3 · webm+opus, ogg+opus, mp4, webm, ogg", () => {
    const block = src.match(/const PREFERRED[\s\S]*?\]/);
    expect(block).toBeTruthy();
    const list = block![0];
    expect(list.indexOf("audio/webm;codecs=opus")).toBeLessThan(list.indexOf("audio/ogg;codecs=opus"));
    expect(list.indexOf("audio/ogg;codecs=opus")).toBeLessThan(list.indexOf("audio/mp4"));
    expect(list.indexOf("audio/mp4")).toBeLessThan(list.indexOf("audio/webm\","));
    expect(list.indexOf("audio/webm\",")).toBeLessThan(list.indexOf("audio/ogg\""));
  });

  it("canonicalMime normalisé · aligné validation serveur (whitelist 5 MIME)", () => {
    expect(src).toMatch(/audio\/webm;codecs=opus["'],\s*"audio\/webm"/);
    expect(src).toMatch(/audio\/ogg;codecs=opus["'],\s*"audio\/ogg"/);
  });

  it("null si MediaRecorder absent ou aucun MIME supporté", () => {
    expect(src).toMatch(/MediaRecorder\?:\s*typeof MediaRecorder|MediaRecorder\.isTypeSupported/);
    expect(src).toMatch(/return null/);
    expect(src).toMatch(/typeof window === ["']undefined["']/);
  });
});

describe("useAudioRecorder · state machine + cleanup + limites", () => {
  const src = read("features/messaging/audio/useAudioRecorder.ts");

  it("7 états explicites · IDLE/REQ/RECORDING/RECORDED/UPLOADING/SENT/ERROR", () => {
    for (const s of ["IDLE", "REQUESTING_PERMISSION", "RECORDING", "RECORDED", "UPLOADING", "SENT", "ERROR"]) {
      expect(src).toMatch(new RegExp(`["']${s}["']`));
    }
  });

  it("6 error reasons distinctes", () => {
    for (const r of ["unsupported", "permission_denied", "no_microphone", "device_busy", "insecure_context", "unknown"]) {
      expect(src).toMatch(new RegExp(`["']${r}["']`));
    }
  });

  it("distingue NotAllowedError / NotFoundError / NotReadableError", () => {
    expect(src).toMatch(/NotAllowedError[\s\S]*?permission_denied/);
    expect(src).toMatch(/NotFoundError[\s\S]*?no_microphone/);
    expect(src).toMatch(/NotReadableError[\s\S]*?device_busy/);
  });

  it("cleanup obligatoire · stop tracks + revoke URL + clear timers", () => {
    expect(src).toMatch(/for \(const t of streamRef\.current\.getTracks\(\)\)\s*\{[\s\S]*?t\.stop\(\)/);
    expect(src).toMatch(/URL\.revokeObjectURL\(previewUrlRef\.current\)/);
    expect(src).toMatch(/clearInterval\(tickTimerRef\.current\)/);
    expect(src).toMatch(/clearTimeout\(maxTimerRef\.current\)/);
  });

  it("cleanup au démontage · useEffect return", () => {
    expect(src).toMatch(/useEffect\(\(\) => \{\s*return \(\) => \{[\s\S]*?cleanupTracks\(\);/);
  });

  it("refuse double start", () => {
    expect(src).toMatch(/if \(state\.state === "RECORDING" \|\| state\.state === "REQUESTING_PERMISSION" \|\| state\.state === "UPLOADING"\) return/);
  });

  it("auto-stop à maxDurationMs · setTimeout", () => {
    expect(src).toMatch(/setTimeout\(\(\) => \{[\s\S]*?recorder[\s\S]*?stop\(\)[\s\S]*?\},\s*opts\.maxDurationMs\)/);
  });

  it("refuse contexte non-sécurisé (HTTP)", () => {
    expect(src).toMatch(/window\.isSecureContext[\s\S]*?insecure_context/);
  });
});

describe("useAudioPlayback · une seule lecture · TTL + cache + no preload", () => {
  const src = read("features/messaging/audio/useAudioPlayback.ts");

  it("un seul player actif · pauseOthers registre global", () => {
    expect(src).toMatch(/const activePlayers:\s*Set<HTMLAudioElement>/);
    expect(src).toMatch(/function pauseOthers/);
  });

  it("cache mémoire avec marge 15s", () => {
    expect(src).toMatch(/CACHE_MARGIN_MS\s*=\s*15_000/);
    expect(src).toMatch(/expiresAtMs - CACHE_MARGIN_MS > Date\.now\(\)/);
  });

  it("preload='none' sur l'element audio · pas de préchargement bulk", () => {
    // Vérifié dans AudioBubble.tsx.
    const bubble = read("features/messaging/audio/AudioBubble.tsx");
    expect(bubble).toMatch(/preload="none"/);
  });

  it("gestion 401/403/404/410 · unauthorized / gone / network", () => {
    expect(src).toMatch(/r\.status === 401 \|\| r\.status === 403[\s\S]*?unauthorized/);
    expect(src).toMatch(/r\.status === 404 \|\| r\.status === 410[\s\S]*?gone/);
  });

  it("retry unique après échec · pas de boucle", () => {
    expect(src).toMatch(/retryUsedRef/);
    expect(src).toMatch(/!retryUsedRef\.current/);
  });

  it("cache.delete au retry après expiration", () => {
    expect(src).toMatch(/cache\.delete\(assetId\)/);
  });

  it("cleanup au démontage · pause + retire du registre", () => {
    expect(src).toMatch(/return \(\) => \{[\s\S]*?activePlayers\.delete\(el\)/);
  });
});

describe("AudioBubble · zéro donnée sensible exposée", () => {
  const rawSrc = read("features/messaging/audio/AudioBubble.tsx");
  // Strip comments (single line + multi-line) pour éviter faux positifs.
  const src = rawSrc
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  it("aucune mention storageKey/bucket/signedUrl/mimeType/byteSize dans le rendu", () => {
    expect(src).not.toMatch(/storageKey/);
    expect(src).not.toMatch(/bucket/i);
    expect(src).not.toMatch(/signedUrl/i);
    expect(src).not.toMatch(/mimeType/);
    expect(src).not.toMatch(/byteSize/);
    expect(src).not.toMatch(/fileName/i);
  });

  it("controlsList='nodownload' + disablePictureInPicture", () => {
    expect(src).toMatch(/controlsList="nodownload"/);
    expect(src).toMatch(/disablePictureInPicture/);
  });

  it("aria-label play/pause traduit", () => {
    expect(src).toMatch(/aria-label=\{state\.playing \? t\("pause"\) : t\("play"\)\}/);
  });

  it("bouton minHeight/minWidth 44px", () => {
    expect(src).toMatch(/minHeight:\s*44/);
    expect(src).toMatch(/minWidth:\s*44/);
  });
});

describe("MessageComposer · intégration recorder", () => {
  const src = read("features/messaging/MessageComposer.tsx");

  it("useAudioRecorder importé + limite selon persona", () => {
    expect(src).toMatch(/useAudioRecorder\(\{\s*maxDurationMs:\s*maxMs/);
    expect(src).toMatch(/MAX_MS_ADULT\s*=\s*180_000/);
    expect(src).toMatch(/MAX_MS_CHILD\s*=\s*60_000/);
  });

  it("clientMessageId stable par cycle (état réutilisé au retry)", () => {
    expect(src).toMatch(/audioClientMessageId/);
    expect(src).toMatch(/if \(!key\)\s*\{[\s\S]*?makeIdempotencyKey\("audio"\)[\s\S]*?setAudioClientMessageId/);
  });

  it("upload multipart · file + clientMessageId · aucun body texte", () => {
    expect(src).toMatch(/form\.set\("file",\s*blob/);
    expect(src).toMatch(/form\.set\("clientMessageId",\s*key\)/);
  });

  it("enfant · audio possible via grand bouton · aucun textarea", () => {
    // Extrait le bloc `if (isChild)` jusqu'au return adulte.
    const idxChild = src.indexOf("// ─────────────── COMPOSER ENFANT");
    const idxAdult = src.indexOf("// ─────────────── COMPOSER ADULTE");
    const childBlock = src.slice(idxChild, idxAdult);
    expect(childBlock).not.toMatch(/<textarea/);
    expect(childBlock).toMatch(/tapToSpeak/);
    expect(childBlock).toMatch(/minHeight:\s*88/); // gros bouton
  });

  it("adulte · texte non-vide désactive le mic (un message = TEXT XOR AUDIO)", () => {
    expect(src).toMatch(/disabled=\{!audioAvailable \|\| body\.trim\(\)\.length > 0\}/);
  });

  it("cleanup rec.cancel au changement de conversationId", () => {
    expect(src).toMatch(/useEffect\(\(\) => \{\s*return \(\) => \{ rec\.cancel\(\); \};[\s\S]*?\}, \[conversationId\]\)/);
  });

  it("audio-capability endpoint dérivé du flag server-only", () => {
    expect(src).toMatch(/fetch\("\/api\/messaging\/audio-capability"/);
    // Aucun NEXT_PUBLIC_* audio.
    expect(src).not.toMatch(/NEXT_PUBLIC_YEMA_MESSAGE_AUDIO/);
  });
});

describe("audio-capability endpoint · server-only reflect + gate", () => {
  const rawSrc = read("app/api/messaging/audio-capability/route.ts");
  const src = rawSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  it("gate isMessagingEnabled AVANT lecture flag audio", () => {
    const idxMsg = src.indexOf("isMessagingEnabled");
    const idxAudio = src.indexOf("isMessagingAudioEnabled()");
    expect(idxMsg).toBeGreaterThan(0);
    expect(idxMsg).toBeLessThan(idxAudio);
  });

  it("actor requis · sinon 404", () => {
    expect(src).toMatch(/resolveMessagingActor/);
    expect(src).toMatch(/if \(!actor\) return notFound\(\)/);
  });

  it("aucun NEXT_PUBLIC · pas de fuite côté bundle client", () => {
    expect(src).not.toMatch(/NEXT_PUBLIC/);
  });
});

describe("ConversationView · rendu AudioBubble", () => {
  const src = read("features/messaging/ConversationView.tsx");

  it("AudioBubble utilisé pour kind='AUDIO' avec audioAssetId", () => {
    expect(src).toMatch(/import \{ AudioBubble \}/);
    expect(src).toMatch(/m\.kind === "AUDIO"[\s\S]*?m\.audioAssetId[\s\S]*?AudioBubble/);
  });

  it("pas de body texte affiché pour AUDIO (aucun contenu client-side du message)", () => {
    // La bulle AUDIO ne rend PAS m.body (déjà nul serveur-side pour AUDIO).
    const audioBlock = src.match(/m\.kind === "AUDIO"[\s\S]*?\)\s*:\s*m\.kind === "SYSTEM"/);
    expect(audioBlock).toBeTruthy();
    expect(audioBlock![0]).not.toMatch(/m\.body/);
  });
});

describe("i18n · yemaMessaging.audio parité FR/EN", () => {
  const fr = JSON.parse(readRepo("messages/fr.json"));
  const en = JSON.parse(readRepo("messages/en.json"));

  function flatten(obj: Record<string, unknown>, prefix = ""): string[] {
    const keys: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) keys.push(...flatten(v as Record<string, unknown>, key));
      else keys.push(key);
    }
    return keys;
  }

  it("yemaMessaging.audio présent FR + EN avec sous-clé error", () => {
    expect(fr.yemaMessaging.audio).toBeDefined();
    expect(en.yemaMessaging.audio).toBeDefined();
    expect(fr.yemaMessaging.audio.error).toBeDefined();
    expect(en.yemaMessaging.audio.error).toBeDefined();
  });

  it("6 erreurs distinctes pour audio.error · FR = EN", () => {
    for (const r of ["unsupported", "permission_denied", "no_microphone", "device_busy", "insecure_context", "unknown"]) {
      expect(fr.yemaMessaging.audio.error[r]).toBeTruthy();
      expect(en.yemaMessaging.audio.error[r]).toBeTruthy();
    }
  });

  it("composer.startRecording + tapToSpeak présents FR/EN", () => {
    for (const k of ["startRecording", "tapToSpeak"]) {
      expect(fr.yemaMessaging.composer[k]).toBeTruthy();
      expect(en.yemaMessaging.composer[k]).toBeTruthy();
    }
  });

  it("parité stricte des clés yemaMessaging.audio.*", () => {
    const frKeys = new Set(flatten(fr.yemaMessaging.audio, "audio"));
    const enKeys = new Set(flatten(en.yemaMessaging.audio, "audio"));
    expect([...frKeys].filter((k) => !enKeys.has(k))).toEqual([]);
    expect([...enKeys].filter((k) => !frKeys.has(k))).toEqual([]);
  });
});

describe("RecorderPanel · adulte + enfant · a11y + boutons", () => {
  const src = read("features/messaging/audio/RecorderPanel.tsx");

  it("aria-live sur les états d'annonce", () => {
    expect(src).toMatch(/aria-live="polite"/);
    expect(src).toMatch(/role="status"/);
    expect(src).toMatch(/role="alert"/);
  });

  it("boutons min 44px + labels traduits", () => {
    expect(src).toMatch(/minHeight:\s*44/);
    expect(src).toMatch(/aria-label=\{t\("cancel"\)\}/);
    expect(src).toMatch(/aria-label=\{t\("stop"\)\}/);
  });

  it("cleanup preview URL au démontage", () => {
    expect(src).toMatch(/URL\.revokeObjectURL\(snapshot\.previewUrl\)/);
  });

  it("audio preview · controlsList='nodownload'", () => {
    expect(src).toMatch(/controlsList="nodownload"/);
  });
});

describe("Confidentialité client · aucun log/localStorage/sessionStorage", () => {
  const files = [
    "features/messaging/audio/useAudioRecorder.ts",
    "features/messaging/audio/useAudioPlayback.ts",
    "features/messaging/audio/AudioBubble.tsx",
    "features/messaging/audio/RecorderPanel.tsx",
    "features/messaging/MessageComposer.tsx",
  ];
  for (const f of files) {
    it(`${f} · aucun localStorage/sessionStorage/IndexedDB · aucun log de blob/url`, () => {
      const src = read(f);
      expect(src).not.toMatch(/localStorage\./);
      expect(src).not.toMatch(/sessionStorage\./);
      expect(src).not.toMatch(/indexedDB\./);
      expect(src).not.toMatch(/console\.log\([^)]*blob/i);
      expect(src).not.toMatch(/console\.log\([^)]*signed/i);
      expect(src).not.toMatch(/console\.log\([^)]*storageKey/i);
    });
  }
});
