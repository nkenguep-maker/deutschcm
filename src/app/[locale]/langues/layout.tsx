// Métadonnées propres à /langues · canonical /{locale}/langues,
// og:url dédié, hreflang croisés fr/en. Pass-through pour les children.

import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, pageKey: "langues", path: "/langues" });
}

export default function LanguesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
