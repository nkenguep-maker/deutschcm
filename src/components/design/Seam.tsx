"use client";

import { useEffect, useRef, useState } from "react";

// Seam · la couture entre les deux territoires YEMA.
// Dégradé espresso → terre sur ~120 px + halo laiton radial centré
// + monogramme Y (BrandKeystone) posé au centre. Composant soigné,
// pas un simple div de transition.
//
// Signature moment #2 — Le halo laiton apparaît en fondu au scroll
// (IntersectionObserver, threshold 0.4), 480ms var(--ease-enter),
// une seule fois. La clé Y reste toujours visible ; seul le halo
// se peint quand on arrive dessus.

interface SeamProps {
  /** Étiquette lisible par les lecteurs d'écran. Facultatif : par défaut,
   * la couture est décorative (aria-hidden). */
  ariaLabel?: string;
}

export function Seam({ ariaLabel }: SeamProps) {
  const decorative = !ariaLabel;
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // Respect prefers-reduced-motion → halo visible immédiatement
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`seam ${visible ? "seam-visible" : ""}`}
      role={decorative ? undefined : "separator"}
      aria-label={ariaLabel}
      aria-hidden={decorative || undefined}
    >
      <span className="seam-line seam-line-top" aria-hidden="true" />
      <span className="seam-halo" aria-hidden="true" />
      <span className="seam-key" aria-hidden="true">Y</span>
      <span className="seam-line seam-line-bottom" aria-hidden="true" />
    </div>
  );
}
