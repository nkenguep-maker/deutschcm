import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://deutschcm.vercel.app").replace(/\/$/, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = locale === "en" ? "en" : "fr";
  const canonical = `${SITE_URL}/${lang}/beta`;

  return {
    title: lang === "en" ? "Closed beta — YEMA" : "Bêta fermée — YEMA",
    description:
      lang === "en"
        ? "YEMA closed beta access is reserved for invited testers."
        : "L’accès à la bêta fermée YEMA est réservé aux testeurs invités.",
    alternates: {
      canonical,
      languages: {
        fr: `${SITE_URL}/fr/beta`,
        en: `${SITE_URL}/en/beta`,
        "x-default": `${SITE_URL}/fr/beta`,
      },
    },
    openGraph: {
      url: canonical,
      title: lang === "en" ? "Closed beta — YEMA" : "Bêta fermée — YEMA",
      description:
        lang === "en"
          ? "Invitation-only access while YEMA validates the beta experience."
          : "Accès sur invitation pendant la validation de l’expérience bêta YEMA.",
    },
  };
}

export default async function ClosedBetaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEnglish = locale === "en";

  return (
    <main className="min-h-screen bg-[#0f0b07] text-[#f7f1e8] px-6 py-16 flex items-center justify-center">
      <section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-12">
        <p className="text-xs uppercase tracking-[0.22em] text-[#d7b56d]">
          {isEnglish ? "Closed beta" : "Bêta fermée"}
        </p>
        <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight">
          {isEnglish ? "YEMA is opening gradually." : "YEMA ouvre progressivement."}
        </h1>
        <p className="mt-5 text-base sm:text-lg leading-8 text-white/70">
          {isEnglish
            ? "Access is currently reserved for invited testers while we validate the experience, security and reliability before a wider launch."
            : "L’accès est actuellement réservé aux testeurs invités pendant que nous validons l’expérience, la sécurité et la fiabilité avant une ouverture plus large."}
        </p>

        <div className="mt-7 rounded-2xl border border-[#d7b56d]/20 bg-[#d7b56d]/[0.06] p-5">
          <p className="font-medium text-[#f7f1e8]">
            {isEnglish ? "Have an invitation?" : "Vous avez reçu une invitation ?"}
          </p>
          <p className="mt-2 text-sm leading-6 text-white/65">
            {isEnglish
              ? "Open the personal link sent by YEMA. It is tied to your email address, valid for 72 hours and can be used once. There is no public registration form during the closed beta."
              : "Ouvrez le lien personnel envoyé par YEMA. Il est lié à votre adresse e-mail, valable 72 heures et utilisable une seule fois. Il n’y a pas de formulaire d’inscription public pendant la bêta fermée."}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/login`}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d7b56d] px-6 py-3 font-medium text-[#0f0b07]"
          >
            {isEnglish ? "I already accepted my access" : "J’ai déjà accepté mon accès"}
          </Link>
          <Link
            href={`/${locale}`}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-6 py-3 text-white/85"
          >
            {isEnglish ? "Back to YEMA" : "Retour à YEMA"}
          </Link>
        </div>
      </section>
    </main>
  );
}
