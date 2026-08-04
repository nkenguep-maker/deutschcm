// P4.5-QA · console persona-picker /[locale]/qa.
//
// Comportement · si le mode QA n'est pas actif OU le cookie QA n'est pas
// valide, `notFound()` (404 Next canonique · aucune indication que la
// feature existe).

import { notFound } from "next/navigation";
import { resolveQaConfig } from "@/lib/qa/config";
import { readQaCookie } from "@/lib/qa/cookie";
import { QA_PERSONAS } from "@/lib/qa/personas";
import { headers } from "next/headers";
import QaConsoleView from "@/components/qa/QaConsoleView";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const status = resolveQaConfig();
  if (!status.active) notFound();

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "";
  // `Date.now()` est considéré impur par React 19 · usage légitime dans
  // un Server Component `force-dynamic` (re-rendu à chaque requête · pas
  // de mémoïsation possible).
  // eslint-disable-next-line react-hooks/purity
  const now = Math.floor(Date.now() / 1000);
  const sessionSecret = process.env.YEMA_QA_SESSION_SECRET!;
  const cookie = await readQaCookie(sessionSecret, {
    deploymentHost: host,
    projectRef: status.projectRef,
    nowSeconds: now,
  });
  if (!cookie.ok) notFound();

  const personas = QA_PERSONAS.map((p) => ({
    id: p.id,
    label: locale === "en" ? p.label.en : p.label.fr,
    role: p.role,
    destination: p.destination(locale),
    available: p.available,
    unavailableReason: p.unavailableReason,
  }));

  return (
    <QaConsoleView
      locale={locale}
      projectRef={status.projectRef}
      deploymentHost={host}
      expiresAtSeconds={cookie.payload.expiresAt}
      personas={personas}
    />
  );
}
