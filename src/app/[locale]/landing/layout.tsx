import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = buildPageMetadata({ locale, pageKey: "landing", path: "/landing" });

  if (process.env.YEMA_CLOSED_BETA_ENABLED === "true") {
    return {
      ...metadata,
      robots: {
        index: false,
        follow: false,
        nocache: true,
      },
    };
  }

  return metadata;
}

export default async function LandingBLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const safeLocale = locale === "en" ? "en" : "fr";

  if (process.env.YEMA_CLOSED_BETA_ENABLED === "true") {
    redirect(`/${safeLocale}/beta`);
  }

  return children;
}
