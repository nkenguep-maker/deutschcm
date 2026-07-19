// /not-found · Sprint 8. Aligné sur le seuil.
// Braise statique (aucune animation ambiante ici — --dur-breath est
// réservé au vrai seuil). Le Y, une phrase, un lien retour.

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="porte-seuil porte-404">
      <main className="porte-seuil-main">
        <div className="porte-seuil-inner">
          <p className="maison-kicker">404 · Verlaufen</p>
          <div className="porte-404-y" aria-hidden="true">Y</div>
          <h1 className="porte-seuil-h">
            La porte que vous cherchez.{" "}
            <em>N&apos;existe pas.</em>
          </h1>
          <p className="porte-seuil-lede">
            Rentre à la maison. Toutes les pièces vous y attendent.
          </p>
          <Link href="/" className="maison-porte-cta" style={{ marginTop: 20 }}>
            Retour à la maison
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
