import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, pageKey: "pricingMonde", path: "/pricing/monde" });
}

export default function PricingMondeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
