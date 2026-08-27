import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type {
  CefrLevel,
  Currency,
  LanguageCode,
  Prisma,
  ProductCode,
  Universe,
} from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isInternalTesterEmail, INTERNAL_TEST_COOKIE_MAX_AGE, INTERNAL_TEST_COOKIE_NAME } from "@/lib/internalTest";
import { ensureInternalTestWorkspace, hasInternalTestMarker } from "@/lib/internalTestProvisioning";
import { syncUserMetadata } from "@/lib/roles";
import { CHILD_SESSION_COOKIE_NAME } from "@/lib/security/childSession";
import { toMinorUnits } from "@/lib/payments/money";
import {
  AFRICAN_FAMILY,
  AFRICAN_SOLO,
  WORLD_PASSAGE_PRICES,
  WORLD_TEACHER_ADD,
  type LevelId,
  type Rail,
} from "@/lib/pricing";

export const dynamic = "force-dynamic";

const LEVELS = new Set<LevelId>(["A1", "A2", "B1", "B2", "C1"]);
const ROOT_LANGUAGES = new Set<LanguageCode>([
  "WOLOF",
  "DOUALA",
  "LINGALA",
  "BAMBARA",
  "YORUBA",
  "SWAHILI",
]);
const OFFERS = new Set<ProductCode>(["PASSAGE", "ROOTS_SOLO", "ROOTS_FAMILY"]);

function cookieOptions(maxAge: number, httpOnly = true) {
  return {
    httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function amountFor(params: {
  offer: "PASSAGE" | "ROOTS_SOLO" | "ROOTS_FAMILY";
  currency: Currency;
  level?: LevelId;
  period?: "MONTH" | "YEAR";
}): number {
  const rail: Rail = params.currency === "XAF" ? "fcfa" : "eur";
  if (params.offer === "PASSAGE") {
    return toMinorUnits(
      String(WORLD_PASSAGE_PRICES[params.level ?? "A1"][rail]),
      params.currency,
    );
  }
  const table = params.offer === "ROOTS_FAMILY" ? AFRICAN_FAMILY : AFRICAN_SOLO;
  const value = table[rail][params.period === "MONTH" ? "month" : "year"];
  return toMinorUnits(String(value), params.currency);
}

function teacherAmount(level: LevelId, currency: Currency): number {
  const rail: Rail = currency === "XAF" ? "fcfa" : "eur";
  return toMinorUnits(String(WORLD_TEACHER_ADD[level][rail]), currency);
}

async function ensureProductVariant(params: {
  code: "PASSAGE" | "ROOTS_SOLO" | "ROOTS_FAMILY" | "TEACHER_ADDON";
  universe: Universe;
  language: LanguageCode;
  level: CefrLevel | null;
  currency: Currency;
  durationDays: number;
  amount: number;
}) {
  const product = await prisma.product.upsert({
    where: { code: params.code },
    update: { isActive: true },
    create: {
      code: params.code,
      universe: params.universe,
      billingType: params.code === "ROOTS_SOLO" || params.code === "ROOTS_FAMILY" ? "SUBSCRIPTION" : "ONE_TIME",
      isActive: true,
    },
  });

  const existing = await prisma.productVariant.findFirst({
    where: {
      productId: product.id,
      language: params.language,
      level: params.level,
      currency: params.currency,
      durationDays: params.durationDays,
    },
  });
  if (existing) return existing;

  return prisma.productVariant.create({
    data: {
      productId: product.id,
      language: params.language,
      level: params.level,
      currency: params.currency,
      amount: params.amount,
      durationDays: params.durationDays,
      market: "INTERNAL_TEST",
      active: true,
    },
  });
}

async function ensurePaidLearningPath(params: {
  userId: string;
  universe: Universe;
  language: LanguageCode;
  level: CefrLevel | null;
  offer: "PASSAGE" | "ROOTS_SOLO" | "ROOTS_FAMILY";
  currency: Currency;
  period?: "MONTH" | "YEAR";
}) {
  const rows = await prisma.learningPath.findMany({
    where: {
      userId: params.userId,
      universe: params.universe,
      language: params.language,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
  });
  const existing = rows.find((row) => hasInternalTestMarker(row.onboardingAnswers));
  const activationIntent = params.universe === "MONDE"
    ? {
        offer: "PASSAGE",
        cefrLevel: params.level ?? "A1",
        withTeacher: false,
        currency: params.currency,
        selectedAt: new Date().toISOString(),
      }
    : {
        racinesOffer: params.offer === "ROOTS_FAMILY" ? "FAMILLE" : "SOLO",
        racinesPeriod: params.period ?? "YEAR",
        currency: params.currency,
        selectedAt: new Date().toISOString(),
      };
  const answers: Prisma.InputJsonValue = params.universe === "MONDE"
    ? {
        internalTest: true,
        paidSimulation: true,
        why: "internal_test",
        startPoint: "beginner",
        selfAssessmentAnswer: 1,
        declaredLevel: params.level ?? "A1",
        recommendedLevel: params.level ?? "A1",
        activationIntent,
      }
    : {
        internalTest: true,
        paidSimulation: true,
        link: "internal_test",
        startPoint: "beginner",
        racinesStep: "E1",
        declaredLevel: "E1",
        recommendedLevel: "E1",
        activationIntent,
      };

  if (existing) {
    return prisma.learningPath.update({
      where: { id: existing.id },
      data: {
        currentLevel: params.universe === "MONDE" ? params.level : null,
        onboardingAnswers: answers,
        status: "ACTIVE",
        archivedAt: null,
      },
    });
  }
  return prisma.learningPath.create({
    data: {
      userId: params.userId,
      universe: params.universe,
      language: params.language,
      currentLevel: params.universe === "MONDE" ? params.level : null,
      intention: params.universe === "MONDE" ? "SUR_PLACE" : "RACINES_SOI",
      onboardingAnswers: answers,
      status: "ACTIVE",
    },
  });
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "BAD_FORM" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isInternalTesterEmail(user.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, supabaseId: true },
  });
  if (!dbUser) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  const rawOffer = String(form.get("offer") ?? "");
  const currency = form.get("currency") === "XAF" ? "XAF" : "EUR";
  const locale = form.get("locale") === "en" ? "en" : "fr";
  if (!OFFERS.has(rawOffer as ProductCode)) {
    return NextResponse.json({ error: "OFFER_INVALID" }, { status: 400 });
  }
  const offer = rawOffer as "PASSAGE" | "ROOTS_SOLO" | "ROOTS_FAMILY";

  const fixture = await ensureInternalTestWorkspace(dbUser.id);
  let language: LanguageCode;
  let level: LevelId | undefined;
  let period: "MONTH" | "YEAR" | undefined;
  let universe: Universe;
  let durationDays: number;

  if (offer === "PASSAGE") {
    language = "DEUTSCH";
    const rawLevel = String(form.get("level") ?? "A1") as LevelId;
    if (!LEVELS.has(rawLevel)) return NextResponse.json({ error: "LEVEL_INVALID" }, { status: 400 });
    level = rawLevel;
    universe = "MONDE";
    durationDays = 120;
  } else {
    const rawLanguage = String(form.get("language") ?? "WOLOF") as LanguageCode;
    if (!ROOT_LANGUAGES.has(rawLanguage)) {
      return NextResponse.json({ error: "LANGUAGE_INVALID" }, { status: 400 });
    }
    language = rawLanguage;
    period = form.get("period") === "MONTH" ? "MONTH" : "YEAR";
    universe = "RACINES";
    durationDays = period === "MONTH" ? 30 : 365;
  }

  const amount = amountFor({ offer, currency, level, period });
  const variant = await ensureProductVariant({
    code: offer,
    universe,
    language,
    level: offer === "PASSAGE" ? (level as CefrLevel) : null,
    currency,
    durationDays,
    amount,
  });
  const learningPath = await ensurePaidLearningPath({
    userId: dbUser.id,
    universe,
    language,
    level: offer === "PASSAGE" ? (level as CefrLevel) : null,
    offer,
    currency,
    period,
  });

  const withTeacher = offer === "PASSAGE" && form.get("withTeacher") === "1";
  const teacherVariant = withTeacher
    ? await ensureProductVariant({
        code: "TEACHER_ADDON",
        universe: "MONDE",
        language,
        level: level as CefrLevel,
        currency,
        durationDays: 120,
        amount: teacherAmount(level as LevelId, currency),
      })
    : null;
  const total = amount + (teacherVariant ? teacherAmount(level as LevelId, currency) : 0);

  const beneficiaryType = offer === "PASSAGE" ? "LEARNING_PATH" : offer === "ROOTS_FAMILY" ? "HOUSEHOLD" : "USER";
  const beneficiaryId = offer === "PASSAGE"
    ? learningPath.id
    : offer === "ROOTS_FAMILY"
    ? fixture.householdId
    : dbUser.id;

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId: dbUser.id,
        status: "PAID",
        currency,
        total,
      },
    });
    const item = await tx.orderItem.create({
      data: {
        orderId: order.id,
        productVariantId: variant.id,
        beneficiaryType,
        beneficiaryId,
        quantity: 1,
        unitAmount: amount,
      },
    });

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "CARD",
        status: "CONFIRMED",
        amount: total,
        currency,
        externalRef: `internal-sim-${order.id}`,
        confirmedAt: new Date(),
        metadata: { internalTest: true, simulated: true } as Prisma.InputJsonValue,
      },
    });

    const existingGrant = await tx.accessGrant.findFirst({
      where: offer === "ROOTS_FAMILY"
        ? {
            beneficiaryType: "HOUSEHOLD",
            beneficiaryId,
            status: "ACTIVE",
            productVariant: { product: { code: "ROOTS_FAMILY" } },
          }
        : {
            beneficiaryType,
            beneficiaryId,
            productVariantId: variant.id,
            status: "ACTIVE",
          },
    });
    if (!existingGrant) {
      await tx.accessGrant.create({
        data: {
          beneficiaryType,
          beneficiaryId,
          productVariantId: variant.id,
          sourceType: "ORDER",
          sourceId: order.id,
          orderItemId: item.id,
          startsAt: new Date(),
          endsAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
          status: "ACTIVE",
          metadata: { internalTest: true, simulatedPayment: true } as Prisma.InputJsonValue,
        },
      });
    }

    if (teacherVariant) {
      const teacherAmountValue = teacherAmount(level as LevelId, currency);
      const teacherItem = await tx.orderItem.create({
        data: {
          orderId: order.id,
          productVariantId: teacherVariant.id,
          beneficiaryType: "LEARNING_PATH",
          beneficiaryId: learningPath.id,
          quantity: 1,
          unitAmount: teacherAmountValue,
        },
      });
      const teacherGrant = await tx.accessGrant.findFirst({
        where: {
          beneficiaryType: "LEARNING_PATH",
          beneficiaryId: learningPath.id,
          productVariantId: teacherVariant.id,
          status: "ACTIVE",
        },
      });
      if (!teacherGrant) {
        await tx.accessGrant.create({
          data: {
            beneficiaryType: "LEARNING_PATH",
            beneficiaryId: learningPath.id,
            productVariantId: teacherVariant.id,
            sourceType: "ORDER",
            sourceId: order.id,
            orderItemId: teacherItem.id,
            startsAt: new Date(),
            endsAt: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
            status: "ACTIVE",
            metadata: { internalTest: true, simulatedPayment: true } as Prisma.InputJsonValue,
          },
        });
      }
    }
  });

  await syncUserMetadata({ supabaseId: dbUser.supabaseId, activeSpace: "STUDENT" });
  const persona = offer === "PASSAGE" ? "student_monde" : offer === "ROOTS_FAMILY" ? "family" : "student_racines";
  const destination = offer === "ROOTS_FAMILY" ? `/${locale}/family` : `/${locale}/dashboard`;
  const response = NextResponse.redirect(new URL(destination, req.url), 303);
  response.cookies.set(INTERNAL_TEST_COOKIE_NAME, persona, cookieOptions(INTERNAL_TEST_COOKIE_MAX_AGE));
  response.cookies.set(CHILD_SESSION_COOKIE_NAME, "", cookieOptions(0));
  response.cookies.set("active_space", "STUDENT", cookieOptions(30 * 24 * 60 * 60, false));
  return response;
}
