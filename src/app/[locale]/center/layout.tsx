import { CenterRepresentativeBadge } from "@/features/dashboards/center/CenterRepresentativeBadge";

export default async function CenterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";

  return (
    <>
      {children}
      <CenterRepresentativeBadge locale={loc} />
    </>
  );
}
