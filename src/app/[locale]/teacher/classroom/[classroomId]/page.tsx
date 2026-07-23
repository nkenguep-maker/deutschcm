// P4.3b · redirect vers `/teacher/classes/[classroomId]` (élimine 905 lignes
// de mock avec charts fictifs, activités inventées et progressions inventées).

import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; classroomId: string }>;
}) {
  const { locale, classroomId } = await params;
  redirect(`/${locale}/teacher/classes/${classroomId}`);
}
