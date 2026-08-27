import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

const DESCRIPTION = {
  fr: "L'enseignant au centre. Découvrez l'espace enseignant YEMA et déposez une candidature pour accompagner des apprenants en langues du monde et africaines.",
  en: "The teacher at the center. Discover the YEMA teacher workspace and apply to support learners across world and African languages.",
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const key: "fr" | "en" = locale === "en" ? "en" : "fr";
  const base = buildPageMetadata({ locale, pageKey: "enseignants", path: "/enseignants" });
  const description = DESCRIPTION[key];

  return {
    ...base,
    description,
    openGraph: base.openGraph ? { ...base.openGraph, description } : undefined,
    twitter: base.twitter ? { ...base.twitter, description } : undefined,
  };
}

export default function EnseignantsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
