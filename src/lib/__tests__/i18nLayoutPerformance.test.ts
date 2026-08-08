import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("locale layout message loading", () => {
  it("loads locale messages once through i18n/request and lets the client provider inherit them", () => {
    const layout = read("src/app/[locale]/layout.tsx");
    const request = read("src/i18n/request.ts");

    expect(request).toContain('messages: (await import(`../../messages/${locale}.json`)).default');
    expect(layout).toContain("<NextIntlClientProvider>");
    expect(layout).not.toContain("messages/${locale}.json");
    expect(layout).not.toContain("messages={messages}");
  });
});
