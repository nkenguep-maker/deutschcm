"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { BrandY } from "@/components/brand/BrandY";

export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const isEn = locale === "en";

  return (
    <div className="porte-seuil" role="alert">
      <main className="porte-seuil-main">
        <div className="porte-seuil-inner">
          <p className="maison-kicker">{isEn ? "Something went wrong" : "Un problème est survenu"}</p>
          <div className="porte-404-y" aria-hidden="true">
            <BrandY variant="world" state="static" size={150} />
          </div>
          <h1 className="porte-seuil-h">
            {isEn ? "This room did not open." : "Cette pièce ne s’est pas ouverte."}{" "}
            <em>{isEn ? "Your progress is still here." : "Votre progression reste là."}</em>
          </h1>
          <p className="porte-seuil-lede">
            {isEn
              ? "Try loading this view again. If the problem continues, return home and reopen your space."
              : "Réessayez d’ouvrir cette vue. Si le problème continue, retournez à l’accueil puis rouvrez votre espace."}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
            <button type="button" className="maison-porte-cta" onClick={reset}>
              {isEn ? "Try again" : "Réessayer"}
            </button>
            <Link href={`/${locale}`} className="maison-porte-cta">
              {isEn ? "Back home" : "Retour à l’accueil"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
