// LandingFinalCta — écho éditorial du hero. Filet laiton en tête (bleed
// visible), badge live, h2 énorme "Apprends l'allemand. / Sans détour."
// Un seul bouton primaire — pas de store badges parasites.

"use client";

import { useRouter } from "next/navigation";

type Labels = {
  live: string;
  titleLine1: string;
  titleAccent: string;
  body: string;
  cta: string;
  micro: string;
};

export function LandingFinalCta({
  locale,
  labels,
}: {
  locale: string;
  labels: Labels;
}) {
  const router = useRouter();
  return (
    <section className="lfinal">
      <div className="container">
        <span className="lfinal-eye">{labels.live}</span>
        <h2 className="lfinal-h">
          {labels.titleLine1}
          <br />
          <em>{labels.titleAccent}</em>
        </h2>
        <p className="lfinal-lede">{labels.body}</p>
        <button
          type="button"
          className="lfinal-cta"
          onClick={() => router.push(`/${locale}/register`)}
        >
          {labels.cta}
          <span className="lhero-btn-arrow" aria-hidden="true">
            →
          </span>
        </button>
        <p className="lfinal-micro">{labels.micro}</p>
      </div>
    </section>
  );
}
