import Link from "next/link";
import { getLocale } from "next-intl/server";
import { BrandY } from "@/components/brand/BrandY";

export default async function NotFound() {
  const locale = await getLocale();
  const isEn = locale === "en";

  return (
    <div className="porte-seuil porte-404">
      <main className="porte-seuil-main">
        <div className="porte-seuil-inner">
          <p className="maison-kicker">404 · {isEn ? "Lost" : "Perdu"}</p>
          <div className="porte-404-y" aria-hidden="true">
            <BrandY variant="world" state="static" size={180} />
          </div>
          <h1 className="porte-seuil-h">
            {isEn ? "The door you are looking for" : "La porte que vous cherchez"}.{" "}
            <em>{isEn ? "Does not exist." : "N’existe pas."}</em>
          </h1>
          <p className="porte-seuil-lede">
            {isEn
              ? "Go back home. The rest of the house is waiting for you."
              : "Retournez à l’accueil. Le reste de la maison vous attend."}
          </p>
          <Link href={`/${isEn ? "en" : "fr"}`} className="maison-porte-cta" style={{ marginTop: 20 }}>
            {isEn ? "Back home" : "Retour à l’accueil"}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                 stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
                 strokeLinejoin="round" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
}
