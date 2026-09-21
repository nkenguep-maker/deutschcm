import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("redesigned dashboard sign out", () => {
  it("keeps a real Supabase sign-out action in both responsive shells", () => {
    const action = read("shared/DashboardSignOutButton.tsx");
    const sidebar = read("shared/DashboardSidebar.tsx");
    const mobileHeader = read("shared/DashboardMobileHeader.tsx");

    expect(action).toContain("createClient().auth.signOut()");
    expect(action).toContain('router.push("/goodbye")');
    expect(action).toContain("<LogOut");
    expect(sidebar).toContain("<DashboardSignOutButton");
    expect(mobileHeader).toContain("<DashboardSignOutButton");
  });
});
