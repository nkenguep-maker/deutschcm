// P4.4 · Détail profil enfant · projection minimale.

import { notFound, redirect } from "next/navigation";
import { isRootsCoachWorkspaceActive } from "@/lib/flags";
import {
  resolveRootsCoachActorOrNull,
  assertRootsCoachChildAccess,
} from "@/lib/permissions/rootsCoach";
import { getRootsCoachProfile } from "@/lib/rootsCoach/queries";
import RootsCoachFeaturePlaceholder from "@/components/rootsCoach/RootsCoachFeaturePlaceholder";
import RootsCoachLayout from "@/components/rootsCoach/RootsCoachLayout";

export const dynamic = "force-dynamic";

const COPY = {
  fr: {
    title: (name: string) => `Profil · ${name}`,
    ageBand: "Tranche d'âge", language: "Langue Racines",
    circle: "Cercle", joinedAt: "Entrée dans le cercle",
    productionsLocked: "Productions et feedbacks — bientôt disponibles.",
    messagesLocked: "Messages — bientôt disponibles.",
    sessionLocked: "Session mensuelle — workflow à venir.",
    unavailable: "P4.5",
    unavailableMsg: "P4.6",
    unavailableSession: "Bientôt",
  },
  en: {
    title: (name: string) => `Profile · ${name}`,
    ageBand: "Age band", language: "Racines language",
    circle: "Circle", joinedAt: "Joined circle",
    productionsLocked: "Productions and feedback — coming soon.",
    messagesLocked: "Messages — coming soon.",
    sessionLocked: "Monthly session — workflow later.",
    unavailable: "P4.5",
    unavailableMsg: "P4.6",
    unavailableSession: "Soon",
  },
} as const;

function LockedCard({ label, note }: { label: string; note: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="mt-1 text-sm italic text-neutral-500">{note}</div>
    </div>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; childProfileId: string }>;
}) {
  const { locale, childProfileId } = await params;
  if (!isRootsCoachWorkspaceActive()) {
    return <RootsCoachFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveRootsCoachActorOrNull();
  if (!actor) redirect(`/${locale}/login`);

  try {
    await assertRootsCoachChildAccess(actor, childProfileId);
  } catch {
    notFound();
  }
  const profile = await getRootsCoachProfile(actor.userId, childProfileId);
  if (!profile) notFound();
  const c = locale === "en" ? COPY.en : COPY.fr;
  return (
    <RootsCoachLayout locale={locale} active="profiles" title={c.title(profile.displayName)}>
      <div className="mt-6 flex items-center gap-4">
        <span aria-hidden="true" className="text-4xl">{profile.avatarAnimal}</span>
        <div>
          <p className="font-serif text-xl text-neutral-900">{profile.displayName}</p>
          <p className="text-sm text-neutral-500">{profile.circleLanguage}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500">{c.ageBand}</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">{profile.ageBand}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500">{c.language}</div>
          <div className="mt-1 text-sm text-neutral-900">{profile.activeLangue ?? "—"}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500">{c.circle}</div>
          <div className="mt-1 text-sm text-neutral-900">{profile.circleLanguage}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-500">{c.joinedAt}</div>
          <div className="mt-1 text-sm text-neutral-900">
            {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString(locale) : "—"}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <LockedCard label={c.productionsLocked} note={c.unavailable} />
        <LockedCard label={c.messagesLocked} note={c.unavailableMsg} />
        <LockedCard label={c.sessionLocked} note={c.unavailableSession} />
      </div>
    </RootsCoachLayout>
  );
}
