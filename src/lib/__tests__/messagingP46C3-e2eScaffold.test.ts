import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// P4.6-C.3 · invariants du scaffolding E2E audio adulte + enfant + Preview.

const ROOT = resolve(__dirname, "../..");
function readRepo(rel: string): string {
  return readFileSync(resolve(ROOT, "..", rel), "utf-8");
}

describe("MediaRecorder mock · fixture WAV valide, aucun accès micro réel", () => {
  const src = readRepo("tests/e2e/p4-6-c-audio/support/mediaRecorderMock.js");

  it("produit un WAV magic bytes valide (RIFF + WAVE)", () => {
    expect(src).toMatch(/0x52[\s\S]*?0x49[\s\S]*?0x46[\s\S]*?0x46/); // RIFF
    expect(src).toMatch(/0x57[\s\S]*?0x41[\s\S]*?0x56[\s\S]*?0x45/); // WAVE
  });

  it("simule NotAllowedError si __yemaE2E_denyMic true", () => {
    expect(src).toMatch(/window\.__yemaE2E_denyMic/);
    expect(src).toMatch(/NotAllowedError/);
  });

  it("track.stop() enregistré dans trackStops (verify cleanup)", () => {
    expect(src).toMatch(/trackStops\.push\(this\.id\)/);
    expect(src).toMatch(/window\.__yemaE2E\.trackStops/);
  });

  it("MediaRecorder.isTypeSupported whitelist inclut au moins webm/ogg/mp4/wav", () => {
    // Le mock produit un WAV valide · le serveur revalide via magic bytes,
    // donc le mock peut annoncer un sous-ensemble tant qu'il reste compatible.
    for (const m of ["audio/webm", "audio/ogg", "audio/mp4", "audio/wav"]) {
      expect(src).toMatch(new RegExp(`"${m}[^"]*"`));
    }
  });
});

describe("Playwright configs · audio UI adulte + enfant", () => {
  const ui = readRepo("playwright.p4-6-c-audio-ui.config.ts");
  const child = readRepo("playwright.p4-6-c-audio-child.config.ts");

  it("configs distinctes · ports séparés", () => {
    expect(ui).toMatch(/3160/);
    expect(child).toMatch(/3170/);
  });

  it("testDir séparés", () => {
    expect(ui).toMatch(/tests\/e2e\/p4-6-c-audio/);
    expect(child).toMatch(/tests\/e2e\/p4-6-c-audio-child/);
  });

  it("retries=0 · pas de masquage des flakes", () => {
    expect(ui).toMatch(/retries:\s*0/);
    expect(child).toMatch(/retries:\s*0/);
  });
});

describe("Adult UI spec · 6 scénarios A-F", () => {
  const src = readRepo("tests/e2e/p4-6-c-audio/audio-ui.spec.ts");

  it("scenarios A · Teacher → Student", () => {
    expect(src).toMatch(/A\. Teacher → Student/);
  });
  it("scenario B · Student → Teacher", () => {
    expect(src).toMatch(/B\. Student → Teacher/);
  });
  it("scenario C · Outsider · aucun accès", () => {
    expect(src).toMatch(/C\. Outsider/);
    expect(src).toMatch(/expect\(\[403,\s*404\]\)\.toContain\(res\.status\(\)\)/);
  });
  it("scenario D · Permission refusée · texte utilisable après erreur", () => {
    expect(src).toMatch(/D\. Permission refusée/);
    expect(src).toMatch(/denyMic:\s*true/);
    expect(src).toMatch(/fallback texte après erreur mic/);
  });
  it("scenario E · Déconnexion WebSocket · pas de dédup violation", () => {
    expect(src).toMatch(/E\. Déconnexion WebSocket/);
    expect(src).toMatch(/setOffline\(true\)/);
    expect(src).toMatch(/c2\)\.toBeLessThanOrEqual\(c1 \+ 1\)/);
  });
  it("scenario F · Cleanup au changement de conversation", () => {
    expect(src).toMatch(/F\. Changement de conversation pendant RECORDING/);
    expect(src).toMatch(/trackStops/);
  });

  it("MediaRecorder mock injecté via addInitScript AVANT navigation", () => {
    expect(src).toMatch(/ctx\.addInitScript\(MOCK_SRC\)/);
  });

  it("vérifie playback TTL ≤ 305s + no storageKey dans DOM", () => {
    expect(src).toMatch(/expiresAt.*getTime.*Date\.now/);
    expect(src).toMatch(/toBeLessThanOrEqual\(305_000\)/);
    expect(src).toMatch(/not\.toMatch\(\/storageKey\/\)/);
  });
});

describe("Child PIN spec · flow avatar + PIN + assertions polling-only", () => {
  const src = readRepo("tests/e2e/p4-6-c-audio-child/audio-child.spec.ts");

  it("flow avatar + PIN utilisé (pas de bypass)", () => {
    expect(src).toMatch(/enterChildMode/);
    expect(src).toMatch(/CHILD_PIN/);
    expect(src).toMatch(/YEMA_E2E_CHILD_PIN/);
  });

  it("assertion AUCUN textarea côté enfant", () => {
    expect(src).toMatch(/textareaCount\).toBe\(0\)/);
  });

  it("assertion AUCUN WebSocket msg:conv:*/msg:inbox:child:*", () => {
    expect(src).toMatch(/websocket/);
    expect(src).toMatch(/msg:conv:\|msg:inbox:child:/);
    expect(src).toMatch(/msgWs\.length\).toBe\(0\)/);
  });

  it("PIN fallback fixture QA '1234' documenté", () => {
    expect(src).toMatch(/1234.*fixture QA fallback|fixture QA/);
  });
});

describe("Orchestrator scripts · P-1 fail-closed", () => {
  const uiOrch = readRepo("scripts/orchestrate-audio-ui-e2e.mjs");
  const childOrch = readRepo("scripts/orchestrate-audio-child-e2e.mjs");

  for (const [name, src] of [["ui", uiOrch], ["child", childOrch]] as const) {
    it(`${name} · P-1 uniquement + blocklist`, () => {
      expect(src).toMatch(/const P1_REF = "kzzagbojjkivdzzcrmxn"/);
      for (const b of ["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]) {
        expect(src).toMatch(new RegExp(`"${b}"`));
      }
    });
    it(`${name} · YEMA_MESSAGE_AUDIO_ENABLED=true pour le serveur`, () => {
      expect(src).toMatch(/YEMA_MESSAGE_AUDIO_ENABLED:\s*["']true["']/);
    });
  }
});

describe("Non-skippable commands · exit 2 si envs manquants", () => {
  const uiCmd = readRepo("scripts/test-messaging-audio-ui-p1.mjs");
  const childCmd = readRepo("scripts/test-messaging-audio-child-p1.mjs");

  it("test-messaging-audio-ui-p1 · refuse non-P1", () => {
    expect(uiCmd).toMatch(/URL non-P1 · refusé/);
  });

  it("test-messaging-audio-child-p1 · P1_TEST_PASSWORD requis · exit 2", () => {
    expect(childCmd).toMatch(/MISSING P1_TEST_PASSWORD · NON-SKIPPABLE/);
    expect(childCmd).toMatch(/process\.exit\(2\)/);
  });
});

describe("Provisioning script · pas de log PIN, aucun default hardcodé PIN", () => {
  const src = readRepo("scripts/provision-messaging-audio-ui-e2e.mjs");

  it("lit YEMA_E2E_CHILD_PIN uniquement", () => {
    expect(src).toMatch(/YEMA_E2E_CHILD_PIN/);
    // Aucun default PIN hardcodé dans ce script (fixture QA délégué à yema-qa-fixtures).
    expect(src).not.toMatch(/CHILD_PIN\s*=\s*["']1234["']/);
  });

  it("aucun log qui EXPOSE la valeur d'un password ou d'un PIN", () => {
    // Autorisé · logs qui MENTIONNENT le mot 'PIN' sans révéler la valeur
    // (ex. "PIN absent" ou "aucun log de PIN"). Interdit · toute
    // interpolation directe d'une variable password/PIN.
    const src2 = readRepo("scripts/provision-messaging-audio-ui-e2e.mjs");
    expect(src2).not.toMatch(/console\.log\([^)]*\$\{[^}]*[Pp]assword[^}]*\}/);
    expect(src2).not.toMatch(/console\.log\([^)]*\$\{[^}]*CHILD_PIN[^}]*\}/);
    expect(src2).not.toMatch(/console\.log\([^)]*\.password/i);
  });

  it("P-1 fail-closed", () => {
    expect(src).toMatch(/const P1_REF = "kzzagbojjkivdzzcrmxn"/);
    expect(src).toMatch(/blocklisted/);
  });
});

describe("Capture command · Preview P-1 · outputs locaux uniquement", () => {
  const cmd = readRepo("scripts/capture-messaging-audio-p1.mjs");
  const spec = readRepo("tests/e2e/p4-6-c-audio/captures.spec.ts");

  it("output dans playwright-report/captures (gitignoré)", () => {
    expect(cmd).toMatch(/playwright-report\/captures\/p4-6-c-audio/);
  });

  it("3 viewports · desktop-1440 / tablet-768 / mobile-390", () => {
    expect(spec).toMatch(/desktop-1440/);
    expect(spec).toMatch(/tablet-768/);
    expect(spec).toMatch(/mobile-390/);
  });

  it("MANIFEST texte · sans données personnelles", () => {
    expect(spec).toMatch(/MANIFEST\.txt/);
    expect(spec).toMatch(/aucun contenu personnel/);
  });
});

describe("npm scripts P4.6-C.3", () => {
  const pkg = JSON.parse(readRepo("package.json"));
  it("test:messaging-audio-ui:p1 défini", () => {
    expect(pkg.scripts["test:messaging-audio-ui:p1"]).toBe("node scripts/test-messaging-audio-ui-p1.mjs");
  });
  it("test:messaging-audio-child:p1 défini", () => {
    expect(pkg.scripts["test:messaging-audio-child:p1"]).toBe("node scripts/test-messaging-audio-child-p1.mjs");
  });
  it("capture:messaging-audio:p1 défini", () => {
    expect(pkg.scripts["capture:messaging-audio:p1"]).toMatch(/capture-messaging-audio-p1\.mjs/);
  });
});
