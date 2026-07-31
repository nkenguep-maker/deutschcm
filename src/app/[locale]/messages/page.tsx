// P4.6-B · Messagerie · route unique /[locale]/messages.
// Gate flag YEMA_MESSAGING_ENABLED. Persona résolu server-side.

import { notFound, redirect } from "next/navigation";
import { isMessagingEnabled } from "@/lib/flags";
import { resolveMessagingActor } from "@/lib/messaging/actor";
import { MessagesWorkspace } from "@/features/messaging/MessagesWorkspace";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!isMessagingEnabled()) notFound();

  const { locale } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";

  const actor = await resolveMessagingActor();
  if (!actor) redirect(`/${loc}/login`);

  return <MessagesWorkspace persona={actor.persona} />;
}
