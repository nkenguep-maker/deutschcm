import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
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

export default async function RegisterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;

  if (process.env.YEMA_CLOSED_BETA_ENABLED === "true") {
    redirect(`/${safeLocale}/beta`);
  }

  return children;
}
