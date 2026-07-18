// LandingSimulator — démo chat allemand + score. Résout l'overflow mobile
// (grid 1 col sous 800 px, bulle max-width 82 %, overflow-wrap break-word).

"use client";

import { useRouter } from "next/navigation";
import { IconCheck } from "./icons";

type Labels = {
  eye: string;
  title: string;
  body: string;
  scenarios: readonly string[];
  cta: string;
  chatName: string;
  chatStatus: string;
  msgs: readonly {
    who: "them" | "you";
    de: string;
    tr: string;
  }[];
  scoreLbl: string;
  scoreGrammar: string;
  scoreVocab: string;
  scoreRelevance: string;
};

export function LandingSimulator({
  locale,
  labels,
}: {
  locale: string;
  labels: Labels;
}) {
  const router = useRouter();

  return (
    <section className="lsection" id="simulator">
      <div className="container">
        <div className="lsim">
          <div>
            <div className="lsection-eye">{labels.eye}</div>
            <h2 className="lsection-h">{labels.title}</h2>
            <p className="lsection-lede" style={{ marginBottom: 0 }}>
              {labels.body}
            </p>
            <div className="lsim-scenarios">
              {labels.scenarios.map((s, i) => (
                <div key={i} className="lsim-scenario">
                  <span className="lsim-check" aria-hidden="true">
                    <IconCheck size={14} strokeWidth={2} />
                  </span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="lhero-btn-primary"
              onClick={() => router.push(`/${locale}/simulateur`)}
            >
              {labels.cta}
              <span className="lhero-btn-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </div>

          <div className="lsim-chat">
            <div className="lsim-chat-head">
              <div className="lsim-avatar" aria-hidden="true">K</div>
              <div>
                <p className="lsim-chat-name">{labels.chatName}</p>
                <p className="lsim-chat-status">{labels.chatStatus}</p>
              </div>
            </div>

            {labels.msgs.map((m, i) => (
              <div key={i} className={`lsim-msg ${m.who}`}>
                <div className="lsim-msg-bubble">
                  <p className="lsim-msg-text">{m.de}</p>
                  <p className="lsim-msg-t">{m.tr}</p>
                </div>
              </div>
            ))}

            <div className="lsim-score">
              <p className="lsim-score-lbl">{labels.scoreLbl}</p>
              <div className="lsim-score-vals">
                <span className="lsim-score-item">
                  {labels.scoreGrammar} <b>8/10</b>
                </span>
                <span className="lsim-score-item">
                  {labels.scoreVocab} <b>7/10</b>
                </span>
                <span className="lsim-score-item">
                  {labels.scoreRelevance} <b>9/10</b>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
