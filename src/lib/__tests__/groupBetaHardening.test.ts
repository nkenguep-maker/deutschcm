import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("beta · study group hardening", () => {
  it("does not simulate Mobile Money or paid access", () => {
    const route = read("src/app/api/group/route.ts");
    const createPage = read("src/app/[locale]/group/create/page.tsx");
    const groupPage = read("src/app/[locale]/group/page.tsx");

    expect(route).toContain("isPaid: false");
    expect(route).toContain("priceXAF: 0");
    expect(route).not.toContain("mock payment");
    expect(route).not.toContain("payPhone");
    expect(route).not.toContain("payMethod");
    expect(createPage).not.toContain("Mobile Money");
    expect(createPage).not.toContain("1.500 XAF");
    expect(createPage).toContain("création sans facturation");
    expect(groupPage).not.toContain("1.500 XAF");
  });

  it("requires group membership or ownership for detailed reads", () => {
    const route = read("src/app/api/group/route.ts");

    expect(route).toContain("{ creatorId: dbUser.id }");
    expect(route).toContain("members: { some: { userId: dbUser.id, isActive: true } }");
    expect(route).toContain('return NextResponse.json({ error: "Group not found" }, { status: 404 })');
  });

  it("keeps code lookup to a minimal preview", () => {
    const route = read("src/app/api/group/route.ts");
    const codeBranch = route.slice(route.indexOf("if (rawCode)"), route.indexOf("if (id.length"));

    expect(codeBranch).toContain("creator: { select: { fullName: true } }");
    expect(codeBranch).toContain("members: { where: { isActive: true }, select: { id: true } }");
    expect(codeBranch).not.toContain("xpTotal");
    expect(codeBranch).not.toContain("streakDays");
    expect(codeBranch).not.toContain("germanLevel");
  });

  it("protects group mutations with exact same-origin", () => {
    const route = read("src/app/api/group/route.ts");

    expect(route).toContain("isSameOriginRequest(request)");
    expect(route).toContain('status: 403');
  });

  it("uses cryptographic randomness for invite codes", () => {
    const route = read("src/app/api/group/route.ts");

    expect(route).toContain('import { randomInt } from "node:crypto"');
    expect(route).not.toContain("Math.random");
    expect(route).toContain("generateUniqueGroupCode");
  });

  it("creates the group and creator membership in one transaction", () => {
    const route = read("src/app/api/group/route.ts");
    const createBranch = route.slice(
      route.indexOf('if (action === "create")'),
      route.indexOf('if (action === "join")'),
    );
    const tx = createBranch.indexOf("prisma.$transaction");
    const groupCreate = createBranch.indexOf("tx.studentGroup.create", tx);
    const memberCreate = createBranch.indexOf("tx.studentGroupMember.create", groupCreate);

    expect(tx).toBeGreaterThan(-1);
    expect(groupCreate).toBeGreaterThan(tx);
    expect(memberCreate).toBeGreaterThan(groupCreate);
  });

  it("serializes direct code joins and checks maxMembers before membership upsert", () => {
    const route = read("src/app/api/group/route.ts");
    const joinBranch = route.slice(route.indexOf('if (action === "join")'));
    const tx = joinBranch.indexOf("prisma.$transaction");
    const lock = joinBranch.indexOf("pg_advisory_xact_lock(hashtextextended(${target.id}, 0))", tx);
    const count = joinBranch.indexOf("tx.studentGroupMember.count", lock);
    const capacity = joinBranch.indexOf("activeCount >= group.maxMembers", count);
    const upsert = joinBranch.indexOf("tx.studentGroupMember.upsert", capacity);

    expect(tx).toBeGreaterThan(-1);
    expect(lock).toBeGreaterThan(tx);
    expect(count).toBeGreaterThan(lock);
    expect(capacity).toBeGreaterThan(count);
    expect(upsert).toBeGreaterThan(capacity);
    expect(joinBranch).toContain('reason: "group_full"');
    expect(joinBranch).toContain('code: "group_full"');
  });
});
