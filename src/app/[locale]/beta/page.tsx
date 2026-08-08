import Link from "next/link";

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
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/login`}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d7b56d] px-6 py-3 font-medium text-[#0f0b07]"
          >
            {isEnglish ? "I already have access" : "J’ai déjà un accès"}
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
