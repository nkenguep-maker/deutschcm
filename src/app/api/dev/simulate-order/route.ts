// POST /api/dev/simulate-order  (dev-only)
// Fabrique un order + items + payment + grants pour tester l'écran d'activation.
// BLOQUÉ en production : NODE_ENV !== "development" → 404.
//
// Body JSON :
//   {
//     preset: "passage_seul" | "passage_prof" | "roots_solo" | "roots_family" | "roots_famille_prof",
//     scenario: "instant" | "slow" | "grace" | "failed" | "cancelled",
//     language?: LanguageCode  (défaut DEUTSCH pour monde, WOLOF pour racines),
//     level?: CefrLevel        (défaut A1 — ignoré pour racines)
//   }
//
// scenario détermine l'état initial :
//   · instant   : paiement CONFIRMED + tous grants créés → tout_pret d'entrée
//   · slow      : paiement CONFIRMED, grants créés en différé (2.5s par item, en background après réponse)
//   · grace     : paiement CONFIRMED, aucun grant créé (le timeout de grâce doit se déclencher)
//   · failed    : payment FAILED, aucun grant
//   · cancelled : order CANCELLED, payment PENDING
//
// Retour : { orderId, url } — url = "/activation?orderId=..."

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { grantFromOrderItem } from "@/lib/entitlements/grants";
import type { LanguageCode, CefrLevel, ProductCode } from "@prisma/client";

type Preset = "passage_seul" | "passage_prof" | "roots_solo" | "roots_family" | "roots_famille_prof";
type Scenario = "instant" | "slow" | "grace" | "failed" | "cancelled";

const PRESET_CODES: Record<Preset, ProductCode[]> = {
  passage_seul: ["PASSAGE"],
  passage_prof: ["PASSAGE", "TEACHER_ADDON"],
  roots_solo: ["ROOTS_SOLO"],
  roots_family: ["ROOTS_FAMILY"],
  roots_famille_prof: ["ROOTS_FAMILY", "ROOTS_FOLLOWUP_ADDON"],
};

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "user profile not found" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as {
    preset?: Preset;
    scenario?: Scenario;
    language?: LanguageCode;
    level?: CefrLevel;
  };
  const preset: Preset = body.preset ?? "passage_seul";
  const scenario: Scenario = body.scenario ?? "instant";
  const codes = PRESET_CODES[preset];
  if (!codes) return NextResponse.json({ error: "unknown preset" }, { status: 400 });

  const isRacines = preset === "roots_solo" || preset === "roots_family" || preset === "roots_famille_prof";
  const language: LanguageCode = body.language ?? (isRacines ? "WOLOF" : "DEUTSCH");
  const level: CefrLevel = body.level ?? "A1";

  // Résout les variants pour chaque product code
  const variantIds: string[] = [];
  for (const code of codes) {
    const product = await prisma.product.findUnique({ where: { code } });
    if (!product) return NextResponse.json({ error: `product ${code} missing (seed?)` }, { status: 500 });

    const variant = await prisma.productVariant.findFirst({
      where: {
        productId: product.id,
        currency: "XAF",
        active: true,
        // Passage/Teacher : scoped par langue+niveau. Racines : générique.
        ...(code === "PASSAGE" || code === "TEACHER_ADDON" || code === "CAREER_COACH_ADDON"
          ? { language, level }
          : {}),
        ...(code === "ROOTS_SOLO" || code === "ROOTS_FAMILY" ? { durationDays: 365 } : {}),
      },
    });
    if (!variant) return NextResponse.json({ error: `variant ${code}/${language}/${level} missing (seed?)` }, { status: 500 });
    variantIds.push(variant.id);
  }

  // Statuts selon scénario
  const orderStatus = scenario === "cancelled" ? "CANCELLED" : scenario === "failed" ? "PENDING" : "PAID";
  const paymentStatus = scenario === "failed" ? "FAILED" : scenario === "cancelled" ? "PENDING" : "CONFIRMED";
  const confirmedAt = paymentStatus === "CONFIRMED" ? new Date() : null;
  const failedAt = paymentStatus === "FAILED" ? new Date() : null;

  const order = await prisma.order.create({
    data: {
      userId: dbUser.id,
      status: orderStatus,
      currency: "XAF",
      total: variantIds.length * 10000,
      items: {
        create: variantIds.map((vId) => ({
          productVariantId: vId,
          beneficiaryType: "USER",
          beneficiaryId: dbUser.id,
          quantity: 1,
          unitAmount: 10000,
        })),
      },
      payments: {
        create: {
          provider: "CINETPAY",
          status: paymentStatus,
          amount: variantIds.length * 10000,
          currency: "XAF",
          confirmedAt,
          failedAt,
          externalRef: `dev_sim_${Date.now()}`,
        },
      },
    },
    include: { items: true },
  });

  // Provisionne les grants selon scénario
  if (scenario === "instant" && orderStatus === "PAID") {
    for (const item of order.items) await grantFromOrderItem(item.id);
  } else if (scenario === "slow" && orderStatus === "PAID") {
    // Différé : 1200ms par item, en background après la réponse HTTP
    (async () => {
      for (let i = 0; i < order.items.length; i++) {
        await new Promise((r) => setTimeout(r, 1200));
        try {
          await grantFromOrderItem(order.items[i].id);
        } catch (e) {
          console.error("[dev/simulate-order] slow grant failed:", e);
        }
      }
    })();
  }
  // "grace" : aucun grant créé (l'écran doit atteindre le timeout de grâce ~20s)

  return NextResponse.json({
    orderId: order.id,
    url: `/activation?orderId=${order.id}`,
    scenario,
    preset,
  });
}
