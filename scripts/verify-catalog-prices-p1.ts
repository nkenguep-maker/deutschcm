#!/usr/bin/env npx tsx

import { PrismaClient, type ProductCode } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AFRICAN_FAMILY,
  AFRICAN_SOLO,
  LEVELS,
  RACINES_COACH_ADDON,
  WORLD_PASSAGE_PRICES,
  WORLD_TEACHER_ADD,
  type AfricanOffer,
} from "../src/lib/pricing";
import { toMinorUnits } from "../src/lib/payments/money";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED_REFS = ["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const directUrl = process.env.DIRECT_URL ?? "";

if (!supabaseUrl.includes(P1_REF) || !directUrl.includes(P1_REF)) {
  throw new Error("REFUSED: catalogue verification requires Supabase P-1");
}
if (BLOCKED_REFS.some((ref) => supabaseUrl.includes(ref) || directUrl.includes(ref))) {
  throw new Error("REFUSED: blocked Supabase project ref");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: directUrl }) });

type ExpectedVariant = {
  code: ProductCode;
  language: "DEUTSCH" | "WOLOF";
  level: string | null;
  currency: "EUR" | "XAF";
  durationDays: number;
  amount: number;
  productActive: boolean;
};

const expected: ExpectedVariant[] = [];

for (const level of LEVELS) {
  for (const [code, prices] of [
    ["PASSAGE", WORLD_PASSAGE_PRICES[level]],
    ["TEACHER_ADDON", WORLD_TEACHER_ADD[level]],
  ] as const) {
    expected.push(
      { code, language: "DEUTSCH", level, currency: "XAF", durationDays: 120, amount: prices.fcfa, productActive: true },
      { code, language: "DEUTSCH", level, currency: "EUR", durationDays: 120, amount: toMinorUnits(String(prices.eur), "EUR"), productActive: true },
    );
  }
}

function addSubscriptionOffer(
  code: ProductCode,
  language: "DEUTSCH" | "WOLOF",
  offer: AfricanOffer,
) {
  expected.push(
    { code, language, level: null, currency: "XAF", durationDays: 30, amount: offer.fcfa.month, productActive: true },
    { code, language, level: null, currency: "XAF", durationDays: 365, amount: offer.fcfa.year, productActive: true },
    { code, language, level: null, currency: "EUR", durationDays: 30, amount: toMinorUnits(String(offer.eur.month), "EUR"), productActive: true },
    { code, language, level: null, currency: "EUR", durationDays: 365, amount: toMinorUnits(String(offer.eur.year), "EUR"), productActive: true },
  );
}

addSubscriptionOffer("ROOTS_SOLO", "WOLOF", AFRICAN_SOLO);
addSubscriptionOffer("ROOTS_FAMILY", "WOLOF", AFRICAN_FAMILY);
addSubscriptionOffer("CHILD_WORLD_SINGLE", "DEUTSCH", AFRICAN_SOLO);
addSubscriptionOffer("FAMILY_WORLD", "DEUTSCH", AFRICAN_FAMILY);
expected.push(
  { code: "ROOTS_FOLLOWUP_ADDON", language: "WOLOF", level: null, currency: "XAF", durationDays: 30, amount: RACINES_COACH_ADDON.fcfa, productActive: false },
  { code: "ROOTS_FOLLOWUP_ADDON", language: "WOLOF", level: null, currency: "EUR", durationDays: 30, amount: toMinorUnits(String(RACINES_COACH_ADDON.eur), "EUR"), productActive: false },
);

const keyOf = (value: Pick<ExpectedVariant, "code" | "language" | "level" | "currency" | "durationDays">) =>
  [value.code, value.language, value.level ?? "-", value.currency, value.durationDays].join("|");

async function main() {
  const codes = [...new Set(expected.map((variant) => variant.code))];
  const rows = await db.productVariant.findMany({
    where: { product: { code: { in: codes } } },
    select: {
      language: true,
      level: true,
      currency: true,
      durationDays: true,
      amount: true,
      active: true,
      product: { select: { code: true, isActive: true } },
    },
  });

  const actual = new Map<string, typeof rows[number]>();
  for (const row of rows) {
    if (!row.language || !row.durationDays) continue;
    const key = keyOf({
      code: row.product.code,
      language: row.language as "DEUTSCH" | "WOLOF",
      level: row.level,
      currency: row.currency,
      durationDays: row.durationDays,
    });
    if (actual.has(key)) throw new Error(`duplicate catalogue variant: ${key}`);
    actual.set(key, row);
  }

  for (const wanted of expected) {
    const key = keyOf(wanted);
    const row = actual.get(key);
    if (!row) throw new Error(`missing catalogue variant: ${key}`);
    if (!row.active) throw new Error(`inactive catalogue variant: ${key}`);
    if (row.amount !== wanted.amount) throw new Error(`catalogue amount mismatch: ${key}`);
    if (row.product.isActive !== wanted.productActive) {
      throw new Error(`catalogue availability mismatch: ${wanted.code}`);
    }
  }

  console.log(`[catalogue] OK · ${expected.length}/${expected.length} P-1 prices and availability aligned`);
}

main()
  .catch((error) => {
    console.error(`[catalogue] FAIL · ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
