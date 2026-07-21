"use client";

// /[locale]/activation · l'écran de passage.
// Lit ?orderId=xxx, poll /api/activation-status, gère timeouts + redirection.
// Redirection via next-intl useRouter → chemins nus (jamais /fr/fr).

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { ActivationScreen } from "@/components/activation/ActivationScreen";
import type { ActivationStatus } from "@/lib/entitlements/activation";

const MIN_DISPLAY_MS = 2500;          // durée minimale avant redirection
const FINAL_BREATH_MS = 600;          // laisse voir la dernière coche s'allumer
const POLL_MS_FAST = 1000;            // tir initial toutes les 1s
const POLL_MS_SLOW = 2000;            // au-delà de 8 tirs, on ralentit
const POLL_SLOW_AFTER = 8;
const GRACE_MS = 20_000;              // fenêtre de grâce

export default function ActivationPage() {
  const rawLocale = useLocale();
  const locale: "fr" | "en" = rawLocale === "en" ? "en" : "fr";
  const router = useRouter();
  const search = useSearchParams();
  const orderId = search.get("orderId");

  const [status, setStatus] = useState<ActivationStatus | null>(null);
  const [graceMode, setGraceMode] = useState(false);
  const mountedAt = useRef<number>(0);
  const pollCount = useRef(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const redirected = useRef(false);

  // Redirige proprement vers l'espace cible (via next-intl → jamais /fr/fr).
  const gotoEspace = useCallback(
    (target: string) => {
      if (redirected.current) return;
      redirected.current = true;
      router.replace(target);
    },
    [router],
  );

  // Sans orderId → redirection immédiate vers l'espace par défaut.
  useEffect(() => {
    if (orderId === null || orderId === "") {
      router.replace("/dashboard");
    }
  }, [orderId, router]);

  // Poll de l'endpoint. Backoff léger.
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    mountedAt.current = Date.now();

    const tick = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/activation-status?orderId=${encodeURIComponent(orderId)}`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (cancelled) return;
        if (res.status === 401) {
          // Anon : la page est publique mais l'API ne l'est pas.
          router.replace("/login");
          return;
        }
        if (res.status === 403 || res.status === 404) {
          router.replace("/dashboard");
          return;
        }
        if (!res.ok) throw new Error(`activation-status HTTP ${res.status}`);
        const data = (await res.json()) as ActivationStatus;
        setStatus(data);

        // Échec réel : on reste sur l'écran (le composant affiche l'écran d'échec).
        if (data.echec) return;

        // tout_pret : programme la redirection en respectant MIN_DISPLAY.
        if (data.tout_pret) {
          const elapsed = Date.now() - mountedAt.current;
          const wait = Math.max(0, MIN_DISPLAY_MS - elapsed) + FINAL_BREATH_MS;
          const to = setTimeout(() => gotoEspace(data.espace_cible), wait);
          timers.current.push(to);
          return;
        }

        // Prochain tir
        pollCount.current += 1;
        const nextDelay = pollCount.current >= POLL_SLOW_AFTER ? POLL_MS_SLOW : POLL_MS_FAST;
        const to = setTimeout(tick, nextDelay);
        timers.current.push(to);
      } catch (e) {
        console.error("[activation] poll failed:", e);
        // On retente sans agressivité — le réseau peut hoqueter.
        const to = setTimeout(tick, POLL_MS_SLOW);
        timers.current.push(to);
      }
    };

    tick();
    // Fenêtre de grâce
    const graceTimer = setTimeout(() => {
      if (!cancelled) setGraceMode(true);
    }, GRACE_MS);
    timers.current.push(graceTimer);

    return () => {
      cancelled = true;
      for (const t of timers.current) clearTimeout(t);
      timers.current = [];
    };
  }, [orderId, router, gotoEspace]);

  const onGraceContinue = useCallback(() => {
    gotoEspace(status?.espace_cible ?? "/dashboard");
  }, [gotoEspace, status]);

  // Pré-rendu : tant qu'on n'a pas le premier payload (et qu'il n'y a
  // pas d'échec), on affiche un shell minimum sans clignotement — le
  // composant lui-même prend le relais dès que status arrive.
  if (!orderId) return null;
  if (!status) {
    return (
      <main className="activation territory-world" aria-busy="true">
        <div className="activation-card">
          <div className="activation-brand" aria-hidden="true">
            {/* Placeholder — le Brand SVG s'insère dès que l'écran monte
                réellement (fetch initial). On laisse une hauteur stable
                pour éviter le layout shift. */}
          </div>
        </div>
      </main>
    );
  }

  return (
    <ActivationScreen
      locale={locale}
      status={status}
      graceMode={graceMode && !status.tout_pret && !status.echec}
      onGraceContinue={onGraceContinue}
    />
  );
}
