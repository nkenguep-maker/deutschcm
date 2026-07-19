import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, pageKey: "veillee", path: "/veillee" });
}

export default function VeilleeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
