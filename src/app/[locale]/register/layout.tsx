import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = buildPageMetadata({ locale, pageKey: "register", path: "/register" });
  const description = locale === "en"
    ? "Open the door and create your YEMA space. Choose your universe, set up your journey and start where content is available."
    : "Ouvrez la porte et créez votre espace YEMA. Choisissez votre univers, configurez votre parcours et commencez là où le contenu est disponible.";

  return {
    ...metadata,
    description,
    openGraph: metadata.openGraph ? { ...metadata.openGraph, description } : undefined,
    twitter: metadata.twitter ? { ...metadata.twitter, description } : undefined,
  };
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
