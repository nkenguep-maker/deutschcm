import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// P4.6-B · invariants structurels UI + services.

const ROOT = resolve(__dirname, "../..");
function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}

describe("Page /[locale]/messages · gate flag + persona server-side", () => {
  const src = read("app/[locale]/messages/page.tsx");

  it("gate isMessagingEnabled avant tout", () => {
    const idxGate = src.indexOf("isMessagingEnabled()");
    const idxRender = src.lastIndexOf("<MessagesWorkspace");
    const idxActor = src.indexOf("resolveMessagingActor()");
    expect(idxGate).toBeGreaterThan(0);
    expect(idxGate).toBeLessThan(idxActor);
    expect(idxGate).toBeLessThan(idxRender);
  });

  it("params est Promise (Next 16 async)", () => {
    expect(src).toMatch(/params:\s*Promise<\{\s*locale:\s*string\s*\}>/);
    expect(src).toMatch(/await params/);
  });

  it("actor résolu server-side, redirect login si absent", () => {
    expect(src).toMatch(/resolveMessagingActor\(\)/);
    expect(src).toMatch(/redirect\(`\/\$\{loc\}\/login`\)/);
  });
});

describe("Composer · règles enfant strictes", () => {
  const src = read("features/messaging/MessageComposer.tsx");

  it("branche enfant guidée retournée AVANT le return adulte", () => {
    const idxChildBranch = src.indexOf("if (isChild)");
    const idxAdultReturn = src.lastIndexOf("return (");
    expect(idxChildBranch).toBeGreaterThan(0);
    expect(idxChildBranch).toBeLessThan(idxAdultReturn);
  });

  it("branche enfant n'a AUCUN textarea", () => {
    // Extrait la branche enfant : de "if (isChild)" jusqu'au return adulte.
    const idxStart = src.indexOf("if (isChild)");
    const idxAdult = src.lastIndexOf("return (");
    const childBlock = src.slice(idxStart, idxAdult);
    expect(childBlock).not.toMatch(/<textarea/);
    expect(childBlock).not.toMatch(/kind:\s*["']TEXT["']/);
  });

  it("branche enfant envoie GUIDED_PHRASE uniquement", () => {
    const idxStart = src.indexOf("if (isChild)");
    const idxAdult = src.lastIndexOf("return (");
    const childBlock = src.slice(idxStart, idxAdult);
    // Le handler sendGuided est déclaré au-dessus, référencé dans childBlock
    expect(childBlock).toMatch(/sendGuided/);
    // Aucun handler sendText appelé dans childBlock
    expect(childBlock).not.toMatch(/onClick=\{sendText\}/);
  });

  it("boutons audio + attach désactivés (flag audio off)", () => {
    expect(src).toMatch(/disabled\s+aria-disabled="true"/);
    expect(src).toMatch(/microDisabled/);
    expect(src).toMatch(/attachDisabled/);
  });
});

describe("Filtres persona · source unique", () => {
  const src = read("lib/messaging/filters.ts");

  it("PERSONA_FILTERS exporte les 9 personas", () => {
    for (const p of [
      "super_admin",
      "center_admin",
      "teacher",
      "coach",
      "student_monde",
      "student_racines",
      "child_monde",
      "child_racines",
      "family",
    ]) {
      expect(src).toMatch(new RegExp(`${p}:\\s*\\[`));
    }
  });

  it("child_monde et child_racines n'ont QUE le filtre all (pas d'unread/audio)", () => {
    const cmMatch = src.match(/child_monde:\s*\[[\s\S]*?\],/);
    const crMatch = src.match(/child_racines:\s*\[[\s\S]*?\],/);
    expect(cmMatch).toBeTruthy();
    expect(crMatch).toBeTruthy();
    expect(cmMatch![0]).not.toMatch(/unreadOnly/);
    expect(cmMatch![0]).not.toMatch(/audioOnly/);
    expect(crMatch![0]).not.toMatch(/unreadOnly/);
    expect(crMatch![0]).not.toMatch(/audioOnly/);
  });

  it("getDefaultFilter et getFiltersForPersona exportés", () => {
    expect(src).toMatch(/export function getFiltersForPersona/);
    expect(src).toMatch(/export function getDefaultFilter/);
  });

  it("family a filtre child_copies avec childOnly", () => {
    expect(src).toMatch(/child_copies[\s\S]*?childOnly:\s*true/);
  });
});

describe("useConversationSync · polling fallback (P4.6-B legacy · adapté P4.6-B.1)", () => {
  const src = read("features/messaging/hooks/useConversationSync.ts");

  it("polling actif (rapide 15s ou lent 60s selon realtimeConnected)", () => {
    expect(src).toMatch(/POLL_FAST_MS\s*=\s*15_000/);
    expect(src).toMatch(/POLL_SLOW_MS\s*=\s*60_000/);
    expect(src).toMatch(/setInterval\(fetchMessages/);
  });

  it("refetch sur visibilitychange", () => {
    expect(src).toMatch(/addEventListener\(["']visibilitychange["']/);
    expect(src).toMatch(/document\.visibilityState\s*===\s*["']visible["']/);
  });

  it("dédup par messageId via Map", () => {
    expect(src).toMatch(/new Map<string,\s*MessageRow>\(\)/);
    expect(src).toMatch(/for \(const m of json\.messages\) map\.set\(m\.id, m\)/);
  });

  it("cleanup interval + abort in-flight au unmount", () => {
    expect(src).toMatch(/clearInterval\(t\)/);
    expect(src).toMatch(/removeEventListener\(["']visibilitychange["']/);
    expect(src).toMatch(/inFlight\.current\?\.abort\(\)/);
  });
});

describe("Endpoints P4.6-B · gate 404 stable AVANT toute logique DB", () => {
  const endpoints = [
    "app/api/messaging/unread-summary/route.ts",
    "app/api/messaging/guided-phrases/route.ts",
  ];
  for (const p of endpoints) {
    it(`${p} · isMessagingEnabled() AVANT toute logique`, () => {
      const src = read(p);
      const idxGate = src.indexOf("isMessagingEnabled()");
      expect(idxGate).toBeGreaterThan(0);
      expect(src).toMatch(/error:\s*["']Not found["']/);
      expect(src).toMatch(/status:\s*404/);
    });
  }
});

describe("guided-phrases · sécurité univers enfant", () => {
  const src = read("app/api/messaging/guided-phrases/route.ts");

  it("refuse child_monde demandant CHILD_ROOTS_GUIDED (et vice versa)", () => {
    expect(src).toMatch(/child_monde[\s\S]*?CHILD_WORLD_GUIDED[\s\S]*?notFound/);
    expect(src).toMatch(/child_racines[\s\S]*?CHILD_ROOTS_GUIDED[\s\S]*?notFound/);
  });

  it("liste blanche ALLOWED_TYPES uniquement CHILD_WORLD_GUIDED + CHILD_ROOTS_GUIDED", () => {
    expect(src).toMatch(/ALLOWED_TYPES[\s\S]*?"CHILD_WORLD_GUIDED"[\s\S]*?"CHILD_ROOTS_GUIDED"/);
  });
});

describe("MessagesInboxLink · etat explicite quand flag off (404)", () => {
  const src = read("features/messaging/MessagesInboxLink.tsx");

  it("fetch unread-summary et marque la fonctionnalite indisponible si 404 ou erreur", () => {
    expect(src).toMatch(/fetch\("\/api\/messaging\/unread-summary"/);
    expect(src).toMatch(/if \(r\.status === 404\)/);
    expect(src).toMatch(/setAvailable\(false\)/);
  });

  it("affiche un statut accessible quand la fonctionnalite est indisponible", () => {
    expect(src).toMatch(/if \(available === false\)/);
    expect(src).toMatch(/role="status"/);
    expect(src).toContain('t("featureDisabled")');
  });

  it("ne rend le CTA de messagerie qu'apres disponibilite confirmee", () => {
    const readyState = src.indexOf("if (available === false)");
    const cta = src.indexOf("href={`/${locale}/messages`}");
    expect(readyState).toBeGreaterThan(-1);
    expect(cta).toBeGreaterThan(readyState);
  });

  it("CTA vers /[locale]/messages localisé", () => {
    expect(src).toMatch(/href=\{`\/\$\{locale\}\/messages`\}/);
  });
});

describe("InboxList · filtre + active + badge server-derived", () => {
  const src = read("features/messaging/InboxList.tsx");

  it("passe le filter en query param à /api/messaging/inbox", () => {
    expect(src).toMatch(/\/api\/messaging\/inbox\?filter=\$\{encodeURIComponent\(filter\)\}/);
  });

  it("highlight active conversation via aria-current", () => {
    expect(src).toMatch(/aria-current=\{active \? "true" : undefined\}/);
  });

  it("badge unreadCount vient du server (item.unreadCount)", () => {
    expect(src).toMatch(/item\.unreadCount > 0/);
    expect(src).toMatch(/item\.unreadCount > 99 \? "99\+" : item\.unreadCount/);
  });
});

describe("i18n yemaMessaging · parité FR/EN", () => {
  const fr = JSON.parse(readFileSync(resolve(ROOT, "../messages/fr.json"), "utf-8"));
  const en = JSON.parse(readFileSync(resolve(ROOT, "../messages/en.json"), "utf-8"));

  function flatten(obj: Record<string, unknown>, prefix = ""): string[] {
    const keys: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        keys.push(...flatten(v as Record<string, unknown>, key));
      } else {
        keys.push(key);
      }
    }
    return keys;
  }

  it("yemaMessaging présent dans FR et EN", () => {
    expect(fr.yemaMessaging).toBeDefined();
    expect(en.yemaMessaging).toBeDefined();
  });

  it("clés yemaMessaging strictement identiques FR/EN", () => {
    const frKeys = new Set(flatten(fr.yemaMessaging, "yemaMessaging"));
    const enKeys = new Set(flatten(en.yemaMessaging, "yemaMessaging"));
    const missingInEn = [...frKeys].filter((k) => !enKeys.has(k));
    const missingInFr = [...enKeys].filter((k) => !frKeys.has(k));
    expect(missingInEn).toEqual([]);
    expect(missingInFr).toEqual([]);
  });
});
