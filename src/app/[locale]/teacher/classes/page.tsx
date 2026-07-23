// P4.3b · Teacher classes list · SSR · scope strict teacherId.

import { redirect } from "next/navigation";
import { isTeacherWorkspaceActive } from "@/lib/flags";
import { resolveTeacherActorOrNull } from "@/lib/permissions/teacher";
import { getTeacherClasses } from "@/lib/teacher/queries";
import TeacherFeaturePlaceholder from "@/components/teacher/TeacherFeaturePlaceholder";
import TeacherClassesView from "@/components/teacher/TeacherClassesView";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; query?: string }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  if (!isTeacherWorkspaceActive()) {
    return <TeacherFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveTeacherActorOrNull();
  if (!actor) redirect(`/${locale}/login`);
  const page = Number(sp.page ?? 1);
  const query = typeof sp.query === "string" ? sp.query : "";
  const result = await getTeacherClasses(actor.teacherId, { page, query });
  return (
    <TeacherClassesView
      locale={locale}
      items={result.items}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      query={query}
    />
  );
}
