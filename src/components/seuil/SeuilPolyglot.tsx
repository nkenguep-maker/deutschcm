"use client";

// SeuilPolyglot · le seuil polyglotte.
// Détecte navigator.language au mount. Si la locale préférée du
// visiteur est ES/PT/IT/DE (non servies par le site), on affiche
// UN message d'accueil dans SA langue, discret, avec les deux
// portes disponibles (FR / EN).
//
// Un événement analytique est émis (yema.polyglot.seen) pour
// décider la prochaine locale par la donnée.

import { useEffect, useState } from "react";

const POLYGLOT_MESSAGES: Record<string, { hello: string; both: string; fr: string; en: string }> = {
  es: {
    hello: "La casa aún está aprendiendo español.",
    both: "Mientras tanto, le recibimos en francés o en inglés.",
    fr: "Continuer en français",
    en: "Continue in English",
  },
  pt: {
    hello: "A casa ainda está a aprender português.",
    both: "Entretanto, recebemo-lo em francês ou em inglês.",
    fr: "Continuar em francês",
    en: "Continue in English",
  },
  it: {
    hello: "La casa sta ancora imparando l'italiano.",
    both: "Nel frattempo, vi accogliamo in francese o in inglese.",
    fr: "Continuare in francese",
    en: "Continue in English",
  },
  de: {
    hello: "Das Haus lernt noch Deutsch für seine Seiten.",
    both: "Bis dahin empfangen wir Sie auf Französisch oder Englisch.",
    fr: "Auf Französisch fortfahren",
    en: "Continue in English",
  },
};

const DISMISS_KEY = "yema.polyglot.dismissed";

export function SeuilPolyglot({ currentLocale }: { currentLocale: "fr" | "en" }) {
  const [detected, setDetected] = useState<string | null>(null);

  useEffect(() => {
    // Sur revisite ou après clic sur une porte, on ne réaffiche pas.
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    // navigator.language renvoie "es-ES", "pt-BR", etc. On garde le
    // préfixe 2 lettres. Si c'est déjà FR/EN, rien à faire.
    const nav = (typeof navigator !== "undefined" ? navigator.language : "").toLowerCase();
    const prefix = nav.slice(0, 2);
    if (prefix === "fr" || prefix === "en") return;
    if (!(prefix in POLYGLOT_MESSAGES)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetected(prefix);

    // Tracker discret · analytics.polyglot.seen. On ne fait pas de
    // fetch si l'endpoint n'existe pas — silence gracieux.
    try {
      fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: "polyglot.seen", lang: prefix, locale: currentLocale }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }, [currentLocale]);

  const dismiss = (goto?: "fr" | "en") => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    if (goto && goto !== currentLocale) {
      document.cookie = `NEXT_LOCALE=${goto}; path=/; max-age=31536000; SameSite=Lax`;
      const path = window.location.pathname.replace(/^\/(fr|en)/, `/${goto}`);
      window.location.assign(path);
      return;
    }
    setDetected(null);
  };

  if (!detected) return null;
  const msg = POLYGLOT_MESSAGES[detected];

  return (
    <div className="seuil-polyglot" role="dialog" aria-live="polite" aria-label={msg.hello}>
      <p className="seuil-polyglot-hello">{msg.hello}</p>
      <p className="seuil-polyglot-both">{msg.both}</p>
      <div className="seuil-polyglot-actions">
        <button type="button" className="seuil-polyglot-btn" onClick={() => dismiss("fr")}>
          {msg.fr}
        </button>
        <button type="button" className="seuil-polyglot-btn" onClick={() => dismiss("en")}>
          {msg.en}
        </button>
        <button
          type="button"
          className="seuil-polyglot-close"
          onClick={() => dismiss()}
          aria-label={detected === "de" ? "Schließen" : detected === "es" ? "Cerrar" : detected === "pt" ? "Fechar" : detected === "it" ? "Chiudi" : "Close"}
        >
          ×
        </button>
      </div>
    </div>
  );
}
