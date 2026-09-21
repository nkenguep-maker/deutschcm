import Link from "next/link";
import { notFound } from "next/navigation";
import { MONDE_A1_V2_MANIFEST } from "@/content/monde-a1-v2";
import { buildA1V2NativeAudioInventory } from "@/content/monde-a1-v2/native-audio";
import styles from "@/features/course-experience/a1-v2/A1V2Preview.module.css";

export const dynamic = "force-dynamic";

export default async function A1V2NativeAudioQaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { locale } = await params;
  const inventory = buildA1V2NativeAudioInventory();
  const kinds = ["dialogue", "exercise", "shadowing", "mock-exam", "card"] as const;
  const counts = Object.fromEntries(kinds.map((kind) => [kind, inventory.filter((asset) => asset.kind === kind).length]));

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}/qa/course-preview/de-a1-v2`}>YEMA · A1</Link>
          <Link className={styles.back} href={`/${locale}/qa/course-preview/de-a1-v2`}>Retour</Link>
        </header>

        <section className={styles.hero}>
          <div className={styles.kicker}>AUDIO NATIF · PACK DE PRODUCTION · QA ONLY</div>
          <h1 className={styles.title}>Ce qui doit être enregistré avant READY.</h1>
          <p className={styles.lead}>
            Les scripts ci-dessous alimentent aujourd’hui le QA/TTS. Ils ne deviennent de l’audio final
            qu’après livraison et validation d’un MP3 natif au chemin exact indiqué. Le statut reste
            {MONDE_A1_V2_MANIFEST.readiness.criticalNativeAudioReady ? " ouvert" : " fermé"}.
          </p>
          <div className={styles.stats}>
            <div className={styles.stat}><strong>{inventory.length}</strong><span>assets natifs requis</span></div>
            <div className={styles.stat}><strong>{counts.dialogue}</strong><span>répliques dialogue</span></div>
            <div className={styles.stat}><strong>{counts.shadowing}</strong><span>cibles shadowing</span></div>
            <div className={styles.stat}><strong>{counts["mock-exam"]}</strong><span>écoutes examens blancs</span></div>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.kicker}>RÈGLE DE LIVRAISON</div>
          <p className={styles.muted}>
            Une ref = un fichier MP3. Conserver exactement le texte allemand et le chemin attendu.
            Le browser TTS reste une aide QA et ne compte jamais comme livraison native.
          </p>
        </section>

        <div className={styles.stack}>
          {kinds.map((kind) => {
            const assets = inventory.filter((asset) => asset.kind === kind);
            if (assets.length === 0) return null;
            return (
              <section className={styles.card} key={kind}>
                <div className={styles.kicker}>{kind} · {assets.length}</div>
                <div className={styles.stack}>
                  {assets.map((asset) => (
                    <article className={styles.exercise} key={asset.ref}>
                      <div className={styles.exerciseHead}>
                        <strong>{asset.ref}</strong>
                        <span className={styles.status}>À ENREGISTRER</span>
                      </div>
                      <div className={styles.de}>{asset.text}</div>
                      <div className={styles.note}>{asset.unitId}{asset.lessonId ? ` · ${asset.lessonId}` : ""}</div>
                      <code className={styles.note}>{asset.publicPath}</code>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
