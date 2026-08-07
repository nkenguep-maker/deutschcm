import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, pageKey: "pricing", path: "/pricing" });
}

export default function PricingLayout({ children }: { children: ReactNode }) {
  const isProduction = process.env.VERCEL_ENV === "production";
  const explicitlyEnabled = process.env.YEMA_PUBLIC_PRICING_ENABLED === "true";

  if (isProduction && !explicitlyEnabled) {
    notFound();
  }

  return children;
}
