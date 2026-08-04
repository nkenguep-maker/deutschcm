import { notFound } from "next/navigation";
import type { InternalPersonaId } from "@/lib/internalPersona";
import { resolveActiveInternalPersona } from "@/lib/internalPersonaPage";
import { INTERNAL_PERSONA_UI_CONTRACTS } from "./contracts";
import { InternalPersonaDashboard } from "./InternalPersonaDashboard";

type Props = {
  accepted: readonly InternalPersonaId[];
  locale: string;
  sectionId: string;
};

export async function InternalPersonaSectionRoute({ accepted, locale, sectionId }: Props) {
  const persona = await resolveActiveInternalPersona(accepted);
  if (!persona) notFound();

  const contract = INTERNAL_PERSONA_UI_CONTRACTS[persona];
  if (!contract.sections.some((section) => section.id === sectionId)) notFound();

  return (
    <InternalPersonaDashboard
      persona={persona}
      locale={locale === "en" ? "en" : "fr"}
      activeSectionId={sectionId}
    />
  );
}
