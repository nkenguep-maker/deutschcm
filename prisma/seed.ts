// YEMA V1 · Seed catalogue idempotent (rejouable).
// Source de vérité UNIQUE pour les prix + entitlement rules.
// Rejouable : upserts sur code (Product) et sur la contrainte
// composite (ProductVariant / ProductEntitlementRule).

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import type {
  ProductCode,
  BillingType,
  Universe,
  LanguageCode,
  CefrLevel,
  Currency,
  Capability,
} from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter, log: ["error", "warn"] });

// ─── Définition du catalogue V1 ──────────────────────────────────
// Chiffres = source du brief. Aucune valeur en dur ailleurs dans le code.
type VariantDef = {
  language?: LanguageCode;
  level?: CefrLevel;
  currency: Currency;
  amount: number;
  durationDays?: number;
};

type ProductDef = {
  code: ProductCode;
  universe: Universe | null;
  billingType: BillingType;
  isActive: boolean;
  variants: VariantDef[];
  capabilities: Capability[];
};

const PASSAGE_LEVELS: Array<{
  level: CefrLevel;
  xaf: number;
  eur: number;
}> = [
  { level: "A1", xaf: 49_000, eur: 75 },
  { level: "A2", xaf: 54_000, eur: 78 },
  { level: "B1", xaf: 58_000, eur: 85 },
  { level: "B2", xaf: 64_000, eur: 99 },
  { level: "C1", xaf: 72_000, eur: 119 },
];

const TEACHER_ADDON_LEVELS: Array<{
  level: CefrLevel;
  xaf: number;
  eur: number;
}> = [
  { level: "A1", xaf: 30_000, eur: 45 },
  { level: "A2", xaf: 40_000, eur: 60 },
  { level: "B1", xaf: 50_000, eur: 75 },
  { level: "B2", xaf: 60_000, eur: 90 },
  { level: "C1", xaf: 75_000, eur: 115 },
];

const CATALOG: ProductDef[] = [
  {
    code: "PASSAGE",
    universe: "MONDE",
    billingType: "ONE_TIME",
    isActive: true,
    variants: PASSAGE_LEVELS.flatMap((L) => [
      { language: "DEUTSCH", level: L.level, currency: "XAF", amount: L.xaf, durationDays: 120 },
      { language: "DEUTSCH", level: L.level, currency: "EUR", amount: L.eur, durationDays: 120 },
    ]),
    capabilities: [
      "COURSE_ACCESS",
      "AI_TEXT",
      "AI_VOICE",
      "MOCK_EXAMS",
      "CERTIFICATE",
    ],
  },
  {
    code: "TEACHER_ADDON",
    universe: "MONDE",
    billingType: "ONE_TIME",
    isActive: true,
    variants: TEACHER_ADDON_LEVELS.flatMap((L) => [
      { language: "DEUTSCH", level: L.level, currency: "XAF", amount: L.xaf, durationDays: 120 },
      { language: "DEUTSCH", level: L.level, currency: "EUR", amount: L.eur, durationDays: 120 },
    ]),
    capabilities: ["CLASSROOM", "THREAD_POST", "HOMEWORK"],
  },
  {
    code: "CAREER_COACH_ADDON",
    universe: "MONDE",
    billingType: "ONE_TIME",
    // INACTIF au lancement · présent au catalogue mais non achetable publiquement
    isActive: false,
    variants: TEACHER_ADDON_LEVELS.flatMap((L) => [
      { language: "DEUTSCH", level: L.level, currency: "XAF", amount: L.xaf, durationDays: 120 },
      { language: "DEUTSCH", level: L.level, currency: "EUR", amount: L.eur, durationDays: 120 },
    ]),
    capabilities: ["CLASSROOM", "THREAD_POST", "HOMEWORK"],
  },
  {
    code: "ROOTS_SOLO",
    universe: "RACINES",
    billingType: "SUBSCRIPTION",
    isActive: true,
    // Simulé par grants à durée en V1 (pas encore de vrai récurrent)
    variants: [
      { language: "WOLOF", currency: "XAF", amount: 3_500, durationDays: 30 },
      { language: "WOLOF", currency: "XAF", amount: 35_000, durationDays: 365 },
      { language: "WOLOF", currency: "EUR", amount: 990, durationDays: 30 },   // 9,90 en centimes
      { language: "WOLOF", currency: "EUR", amount: 99, durationDays: 365 },   // 99 EUR
    ],
    capabilities: ["COURSE_ACCESS", "VEILLEE_CONTENT"],
  },
  {
    code: "ROOTS_FAMILY",
    universe: "RACINES",
    billingType: "SUBSCRIPTION",
    isActive: true,
    variants: [
      { language: "WOLOF", currency: "XAF", amount: 9_900, durationDays: 30 },
      { language: "WOLOF", currency: "XAF", amount: 99_000, durationDays: 365 },
      { language: "WOLOF", currency: "EUR", amount: 1_990, durationDays: 30 }, // 19,90 en centimes
      { language: "WOLOF", currency: "EUR", amount: 149, durationDays: 365 },
    ],
    capabilities: ["COURSE_ACCESS", "VEILLEE_CONTENT", "CHILD_PROFILES"],
  },
  {
    code: "ROOTS_FOLLOWUP_ADDON",
    universe: "RACINES",
    billingType: "ONE_TIME",
    isActive: true,
    // Add-on suivi : prix indicatif V1 (à ajuster). Prérequis SOLO/FAMILY actif.
    variants: [
      { language: "WOLOF", currency: "XAF", amount: 15_000, durationDays: 30 },
      { language: "WOLOF", currency: "EUR", amount: 25, durationDays: 30 },
    ],
    capabilities: ["CLASSROOM", "THREAD_POST", "HOMEWORK"],
  },
  {
    code: "COMPANION",
    universe: null,
    billingType: "SEAT",
    isActive: false, // V1 : réservé (centres pilote)
    variants: [],
    capabilities: ["COURSE_ACCESS"],
  },
];

async function seedProduct(def: ProductDef) {
  const product = await prisma.product.upsert({
    where: { code: def.code },
    update: {
      universe: def.universe,
      billingType: def.billingType,
      isActive: def.isActive,
    },
    create: {
      code: def.code,
      universe: def.universe,
      billingType: def.billingType,
      isActive: def.isActive,
    },
  });

  for (const v of def.variants) {
    // upsert par contrainte composite (productId + language + level + currency + durationDays)
    const existing = await prisma.productVariant.findFirst({
      where: {
        productId: product.id,
        language: v.language ?? null,
        level: v.level ?? null,
        currency: v.currency,
        durationDays: v.durationDays ?? null,
      },
    });
    if (existing) {
      await prisma.productVariant.update({
        where: { id: existing.id },
        data: { amount: v.amount, active: true },
      });
    } else {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          language: v.language,
          level: v.level,
          currency: v.currency,
          amount: v.amount,
          durationDays: v.durationDays,
          active: true,
        },
      });
    }
  }

  for (const cap of def.capabilities) {
    await prisma.productEntitlementRule.upsert({
      where: {
        productId_capability: { productId: product.id, capability: cap },
      },
      update: {},
      create: { productId: product.id, capability: cap },
    });
  }

  const variantCount = await prisma.productVariant.count({ where: { productId: product.id } });
  console.log(`  · ${def.code} · ${variantCount} variantes · ${def.capabilities.length} règles`);
}

async function main() {
  console.log("YEMA V1 · seed catalogue");
  for (const def of CATALOG) {
    await seedProduct(def);
  }
  console.log("Seed OK.");
}

main()
  .catch((e) => {
    console.error("Seed FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
