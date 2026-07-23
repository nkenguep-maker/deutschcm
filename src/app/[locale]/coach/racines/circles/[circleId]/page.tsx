// P4.4 · Circle detail · SSR · scope strict via assertRootsCoachCircleAccess.

import { notFound, redirect } from "next/navigation";
import { isRootsCoachWorkspaceActive } from "@/lib/flags";
import {
  resolveRootsCoachActorOrNull,
  assertRootsCoachCircleAccess,
} from "@/lib/permissions/rootsCoach";
import { getRootsCoachCircle, getRootsCoachProfiles } from "@/lib/rootsCoach/queries";
import RootsCoachFeaturePlaceholder from "@/components/rootsCoach/RootsCoachFeaturePlaceholder";
import RootsCoachLayout from "@/components/rootsCoach/RootsCoachLayout";

export const dynamic = "force-dynamic";

const COPY = {
  fr: {
    title: (lang: string) => `Cercle · ${lang}`,
    language: "Langue", children: "Enfants suivis", joinedAt: "Assigné le",
    status: "Statut", active: "Actif", archived: "Archivé", suspended: "Suspendu",
    profiles: "Profils du cercle",
    empty: "Aucun profil actif dans ce cercle.",
    displayName: "Nom d'usage", ageBand: "Tranche",
  },
  en: {
    title: (lang: string) => `Circle · ${lang}`,
    language: "Language", children: "Followed children", joinedAt: "Joined",
    status: "Status", active: "Active", archived: "Archived", suspended: "Suspended",
    profiles: "Profiles in this circle",
    empty: "No active profile in this circle.",
    displayName: "Display name", ageBand: "Band",
  },
} as const;

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; circleId: string }>;
}) {
  const { locale, circleId } = await params;
  if (!isRootsCoachWorkspaceActive()) {
    return <RootsCoachFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveRootsCoachActorOrNull();
  if (!actor) redirect(`/${locale}/login`);

  try {
    await assertRootsCoachCircleAccess(actor, circleId);
  } catch {
    notFound();
  }
  const [circle, profiles] = await Promise.all([
    getRootsCoachCircle(actor.userId, circleId),
    getRootsCoachProfiles(actor.userId, { pageSize: 100 }),
  ]);
  if (!circle) notFound();
  const c = locale === "en" ? COPY.en : COPY.fr;
  const inCircle = profiles.items.filter((p) => p.circleId === circleId);
  const statusLabel = circle.status === "ACTIVE" ? c.active
    : circle.status === "ARCHIVED" ? c.archived : c.suspended;
  return (
    <RootsCoachLayout locale={locale} active="circles" title={c.title(circle.language)}>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500">{c.language}</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">{circle.language}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500">{c.children}</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">{circle.activeChildCount}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500">{c.status}</div>
          <div className={`mt-1 text-sm ${circle.status === "ACTIVE" ? "text-emerald-700" : "text-neutral-500"}`}>{statusLabel}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500">{c.joinedAt}</div>
          <div className="mt-1 text-sm text-neutral-900">
            {circle.joinedAt ? new Date(circle.joinedAt).toLocaleDateString(locale) : "—"}
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-serif text-lg text-neutral-900">{c.profiles}</h2>
        {inCircle.length === 0 ? (
          <div role="status" className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6 text-center">
            <p className="text-neutral-600">{c.empty}</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">{c.displayName}</th>
                  <th className="px-4 py-3">{c.ageBand}</th>
                </tr>
              </thead>
              <tbody>
                {inCircle.map((child) => (
                  <tr key={child.id} className="border-t border-neutral-100" data-testid={`circle-child-${child.id}`}>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      <span aria-hidden="true" className="mr-2">{child.avatarAnimal}</span>
                      {child.displayName}
                    </td>
                    <td className="px-4 py-3">{child.ageBand}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </RootsCoachLayout>
  );
}
