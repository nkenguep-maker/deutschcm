// P1 · /decouverte/attente · état honnête pour les langues « bientôt disponibles ».
// Doctrine §11-15 : ne pas simuler des leçons sur une langue sans contenu.

import { redirect } from "@/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { StateBlock } from "@/components/StateBlock";
import { LANGUAGES, prismaLangToId } from "@/lib/discovery";

interface Props { params: Promise<{ locale: string }> }

export default async function DecouverteAttente({ params }: Props) {
  const { locale } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect({ href: "/login", locale }); return null; }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id }, select: { id: true },
  });
  const lp = dbUser
    ? await prisma.learningPath.findFirst({
        where: { userId: dbUser.id, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const langId = prismaLangToId(lp?.language ?? null);
  const langMeta = langId ? LANGUAGES.find((l) => l.id === langId) : null;
  const langName = langMeta ? (loc === "en" ? langMeta.nameEn : langMeta.nameFr) : "";

  const copy = {
    fr: {
      soul: langName
        ? `${langName} arrive *bientôt sur YEMA.*`
        : "Ta langue *arrive bientôt sur YEMA.*",
      body: "Le programme de découverte n'est pas encore prêt pour cette langue. Nous te préviendrons dès qu'il ouvre — ta progression et ton choix sont conservés.",
      ctaBack: "Changer de langue",
      ctaSpace: "Retourner à mon espace",
    },
    en: {
      soul: langName
        ? `${langName} is *coming soon to YEMA.*`
        : "Your language is *coming soon to YEMA.*",
      body: "The discovery track isn't live yet for this language. We'll let you know as soon as it opens — your progress and choice are saved.",
      ctaBack: "Change language",
      ctaSpace: "Back to my space",
    },
  } as const;

  return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
      <StateBlock
        kind="empty"
        centered
        soul={copy[loc].soul}
        body={copy[loc].body}
        action={{ label: copy[loc].ctaSpace, href: `/${locale}/dashboard` }}
        secondary={{ label: copy[loc].ctaBack, href: `/${locale}/onboarding` }}
      />
    </main>
  );
}
