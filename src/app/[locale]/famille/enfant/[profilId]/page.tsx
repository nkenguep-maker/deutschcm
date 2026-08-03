// Legacy route /[locale]/famille/enfant/[profilId] · redirect permanent vers
// /[locale]/family. Le nouveau flow sélectionne l'enfant depuis Family puis
// demande le PIN · profilId n'est pas transmis dans la nouvelle URL.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; profilId: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/family`);
}
