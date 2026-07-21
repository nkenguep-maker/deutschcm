// Tests d'intégration · getActivationStatus.
// Utilisent la vraie DB (Supabase Postgres via DIRECT_URL) — même stratégie
// que entitlements.test.ts : prefix d'IDs isolé + cleanup ciblé.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getActivationStatus } from "@/lib/entitlements/activation";
import { grantFromOrderItem } from "@/lib/entitlements/grants";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const db = new PrismaClient({ adapter, log: ["error"] });

const TAG = `act_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const uid = (label: string) => `${TAG}_${label}`;

let passageA1Xaf: string;
let teacherA1Xaf: string;
let rootsSoloYearXaf: string;

async function makeUser(label: string) {
  return db.user.create({
    data: {
      id: uid(label),
      supabaseId: uid(`sb_${label}`),
      email: `${uid(label)}@yema.test`,
      fullName: label,
    },
  });
}

async function makeOrder(params: {
  userId: string;
  variants: string[];
  paymentStatus: "PENDING" | "CONFIRMED" | "FAILED";
  orderStatus?: "PENDING" | "PAID" | "CANCELLED";
}) {
  const orderStatus =
    params.orderStatus ?? (params.paymentStatus === "CONFIRMED" ? "PAID" : "PENDING");
  const order = await db.order.create({
    data: {
      id: uid(`ord_${Math.random().toString(36).slice(2, 6)}`),
      userId: params.userId,
      status: orderStatus,
      currency: "XAF",
      total: params.variants.length * 10000,
      items: {
        create: params.variants.map((vId, i) => ({
          id: uid(`item_${Math.random().toString(36).slice(2, 6)}_${i}`),
          productVariantId: vId,
          beneficiaryType: "USER",
          beneficiaryId: params.userId,
          quantity: 1,
          unitAmount: 10000,
        })),
      },
      payments: {
        create: {
          id: uid(`pay_${Math.random().toString(36).slice(2, 6)}`),
          provider: "CINETPAY",
          status: params.paymentStatus,
          amount: params.variants.length * 10000,
          currency: "XAF",
          confirmedAt: params.paymentStatus === "CONFIRMED" ? new Date() : null,
          failedAt: params.paymentStatus === "FAILED" ? new Date() : null,
        },
      },
    },
    include: { items: true },
  });
  return order;
}

beforeAll(async () => {
  const passageProd = await db.product.findUnique({ where: { code: "PASSAGE" } });
  const teacherProd = await db.product.findUnique({ where: { code: "TEACHER_ADDON" } });
  const soloProd = await db.product.findUnique({ where: { code: "ROOTS_SOLO" } });
  if (!passageProd || !teacherProd || !soloProd) {
    throw new Error("Seed manquant. Lance : npx tsx prisma/seed.ts");
  }
  const passageA1 = await db.productVariant.findFirst({
    where: { productId: passageProd.id, language: "DEUTSCH", level: "A1", currency: "XAF" },
  });
  const teacherA1 = await db.productVariant.findFirst({
    where: { productId: teacherProd.id, language: "DEUTSCH", level: "A1", currency: "XAF" },
  });
  const solo = await db.productVariant.findFirst({
    where: { productId: soloProd.id, currency: "XAF", durationDays: 365 },
  });
  passageA1Xaf = passageA1!.id;
  teacherA1Xaf = teacherA1!.id;
  rootsSoloYearXaf = solo!.id;
});

afterAll(async () => {
  await db.accessGrant.deleteMany({ where: { sourceId: { startsWith: TAG } } });
  await db.payment.deleteMany({ where: { id: { startsWith: TAG } } });
  await db.orderItem.deleteMany({ where: { id: { startsWith: TAG } } });
  await db.order.deleteMany({ where: { id: { startsWith: TAG } } });
  await db.user.deleteMany({ where: { id: { startsWith: TAG } } });
  await db.$disconnect();
});

describe("getActivationStatus", () => {
  it("Passage seul + paiement confirmé + grants → tout_pret = true, ambiance world, 3 étapes", async () => {
    const u = await makeUser("u1");
    const order = await makeOrder({
      userId: u.id,
      variants: [passageA1Xaf],
      paymentStatus: "CONFIRMED",
    });
    for (const item of order.items) await grantFromOrderItem(item.id);

    const s = await getActivationStatus(order.id);
    expect(s).not.toBeNull();
    expect(s!.paiement_confirme).toBe(true);
    expect(s!.tout_pret).toBe(true);
    expect(s!.ambiance).toBe("world");
    expect(s!.echec).toBeNull();
    expect(s!.titre.cle).toBe("passage_seul");
    expect(s!.titre.params.niveau).toBe("A1");
    // paiement + passage_cours + passage_examens = 3 étapes
    expect(s!.droits.map((d) => d.cle)).toEqual([
      "paiement",
      "passage_cours",
      "passage_examens",
    ]);
    expect(s!.droits.every((d) => d.pret)).toBe(true);
  });

  it("Passage + prof, paiement OK mais grants pas encore créés → paiement pret, autres pas prêts", async () => {
    const u = await makeUser("u2");
    const order = await makeOrder({
      userId: u.id,
      variants: [passageA1Xaf, teacherA1Xaf],
      paymentStatus: "CONFIRMED",
    });
    // On ne crée PAS les grants → simule la fenêtre entre paiement et provisioning
    const s = await getActivationStatus(order.id);
    expect(s!.paiement_confirme).toBe(true);
    expect(s!.tout_pret).toBe(false);
    expect(s!.titre.cle).toBe("passage_prof");
    // paiement + passage_cours + passage_examens + teacher_salle + teacher_fil = 5
    expect(s!.droits).toHaveLength(5);
    const paiement = s!.droits.find((d) => d.cle === "paiement");
    expect(paiement!.pret).toBe(true);
    const teacher = s!.droits.find((d) => d.cle === "teacher_salle");
    expect(teacher!.pret).toBe(false);
  });

  it("Racines solo → ambiance sources, titre roots_solo", async () => {
    const u = await makeUser("u3");
    const order = await makeOrder({
      userId: u.id,
      variants: [rootsSoloYearXaf],
      paymentStatus: "CONFIRMED",
    });
    for (const item of order.items) await grantFromOrderItem(item.id);
    const s = await getActivationStatus(order.id);
    expect(s!.ambiance).toBe("sources");
    expect(s!.titre.cle).toBe("roots_solo");
    expect(s!.tout_pret).toBe(true);
    // paiement + roots_parcours = 2
    expect(s!.droits.map((d) => d.cle)).toEqual(["paiement", "roots_parcours"]);
  });

  it("Paiement échoué → echec = PAYMENT_FAILED", async () => {
    const u = await makeUser("u4");
    const order = await makeOrder({
      userId: u.id,
      variants: [passageA1Xaf],
      paymentStatus: "FAILED",
    });
    const s = await getActivationStatus(order.id);
    expect(s!.paiement_confirme).toBe(false);
    expect(s!.echec).toEqual({ kind: "PAYMENT_FAILED" });
    expect(s!.tout_pret).toBe(false);
  });

  it("Order CANCELLED → echec = ORDER_CANCELLED", async () => {
    const u = await makeUser("u5");
    const order = await makeOrder({
      userId: u.id,
      variants: [passageA1Xaf],
      paymentStatus: "PENDING",
      orderStatus: "CANCELLED",
    });
    const s = await getActivationStatus(order.id);
    expect(s!.echec).toEqual({ kind: "ORDER_CANCELLED" });
  });

  it("orderId inconnu → null", async () => {
    const s = await getActivationStatus(uid("nope"));
    expect(s).toBeNull();
  });
});
