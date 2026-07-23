// P4.3b · redirect vers la route canonique `/teacher/classes`.

import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/teacher/classes`);
}
