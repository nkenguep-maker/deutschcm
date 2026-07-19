import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, pageKey: "histoires", path: "/histoires" });
}

export default function HistoiresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
