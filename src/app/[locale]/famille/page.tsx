// Legacy route /[locale]/famille · redirect permanent vers /[locale]/family.
// La route canonique est /[locale]/family (i18n FR + EN, redesign).

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/family`);
}
