import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, pageKey: "landing", path: "/landing" });
}

export default function LandingBLayout({ children }: { children: React.ReactNode }) {
  return children;
}
