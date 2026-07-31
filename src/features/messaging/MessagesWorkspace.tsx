"use client";

// P4.6-B · workspace principal Messagerie. Desktop 3 cols, mobile 3 écrans
// (list → conversation → matrix). Aucun sélecteur libre de persona · les
// filtres sont dérivés de la source unique lib/messaging/filters.ts.

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import "@/features/dashboards/shared/yema-tokens.css";
import { yemaSans } from "@/features/dashboards/shared/fonts";
import { InboxList } from "./InboxList";
import { ConversationView } from "./ConversationView";
import { MatrixView } from "./MatrixView";
import type { ConversationType, PersonaId } from "./types";
import { getFiltersForPersona } from "@/lib/messaging/filters";

type MobileScreen = "list" | "conversation" | "matrix";

type Props = {
  persona: PersonaId;
};

// Locale n'est PAS un prop · ConversationView utilise useLocale() de next-intl
// pour rester en phase avec le segment [locale] et éviter la duplication.
export function MessagesWorkspace({ persona }: Props) {
  const t = useTranslations("yemaMessaging");
  const tFilters = useTranslations("yemaMessaging.filters");
  const tPersonas = useTranslations("yemaMessaging.personaLabels");
  // Filters proviennent de la source UNIQUE lib/messaging/filters.ts ·
  // on ne conserve que la clé pour l'UI (labels via i18n) · les where
  // Prisma restent server-side.
  const filters = useMemo(() => getFiltersForPersona(persona).map((f) => f.key), [persona]);
  const [filter, setFilter] = useState<string>(filters[0]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversationType] = useState<ConversationType | null>(null);
  const [mobileScreen, setMobileScreen] = useState<MobileScreen>("list");

  const openConversation = (id: string) => {
    setActiveConversationId(id);
    setMobileScreen("conversation");
  };
  const openMatrix = () => setMobileScreen("matrix");
  const backToList = () => {
    setMobileScreen("list");
    setActiveConversationId(null);
  };

  return (
    <div
      data-yema-shell
      className={yemaSans.variable}
      style={{ minHeight: "100vh", background: "var(--yema-bg)", color: "var(--yema-text)" }}
    >
      {/* Desktop 3 cols (≥900px) · Mobile 3 écrans (<900px) */}
      <div className="msg-desktop">
        <aside className="msg-col-left">
          <div style={{ padding: 16, borderBottom: "1px solid var(--yema-border)" }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{t("title")}</h1>
            <div style={{ marginTop: 4, fontSize: 12, color: "var(--yema-text-muted)" }}>
              {tPersonas(persona)}
            </div>
          </div>
          <div style={{ padding: 12, borderBottom: "1px solid var(--yema-border)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {filters.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-current={f === filter ? "true" : undefined}
                  style={{
                    minHeight: 32,
                    padding: "6px 12px",
                    fontSize: 11,
                    borderRadius: 999,
                    border: `1px solid ${f === filter ? "var(--yema-gold-edge)" : "var(--yema-border-strong)"}`,
                    background: f === filter ? "var(--yema-gold-glow)" : "transparent",
                    color: f === filter ? "var(--yema-gold-light)" : "var(--yema-text-muted)",
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  {tFilters(f)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflow: "auto" }}>
            <InboxList
              filter={filter}
              activeConversationId={activeConversationId}
              onSelect={setActiveConversationId}
            />
          </div>
        </aside>
        <main className="msg-col-center">
          <ConversationView
            conversationId={activeConversationId}
            conversationType={activeConversationType}
            persona={persona}
          />
        </main>
        <aside className="msg-col-right" aria-label={t("matrix.title")}>
          <MatrixView />
        </aside>
      </div>

      {/* Mobile 3-screen switcher */}
      <div className="msg-mobile">
        {mobileScreen === "list" ? (
          <div>
            <header style={{ padding: "12px 16px 10px", borderBottom: "1px solid var(--yema-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{t("title")}</h1>
              <button
                type="button"
                onClick={openMatrix}
                style={{ minHeight: 44, padding: "8px 14px", borderRadius: 999, border: "1px solid var(--yema-gold-edge)", background: "transparent", color: "var(--yema-gold-light)", fontSize: 12, cursor: "pointer" }}
              >
                {t("matrix.cta")}
              </button>
            </header>
            <div style={{ padding: 12, overflowX: "auto", display: "flex", gap: 6, borderBottom: "1px solid var(--yema-border)" }}>
              {filters.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-current={f === filter ? "true" : undefined}
                  style={{
                    minHeight: 36,
                    padding: "6px 12px",
                    fontSize: 11,
                    borderRadius: 999,
                    border: `1px solid ${f === filter ? "var(--yema-gold-edge)" : "var(--yema-border-strong)"}`,
                    background: f === filter ? "var(--yema-gold-glow)" : "transparent",
                    color: f === filter ? "var(--yema-gold-light)" : "var(--yema-text-muted)",
                    whiteSpace: "nowrap",
                    fontFamily: "inherit",
                  }}
                >
                  {tFilters(f)}
                </button>
              ))}
            </div>
            <div style={{ maxHeight: "calc(100vh - 200px)", overflow: "auto" }}>
              <InboxList filter={filter} activeConversationId={activeConversationId} onSelect={openConversation} />
            </div>
          </div>
        ) : mobileScreen === "conversation" ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <header style={{ padding: "12px 16px 10px", borderBottom: "1px solid var(--yema-border)", display: "flex", gap: 12, alignItems: "center" }}>
              <button
                type="button"
                onClick={backToList}
                style={{ minHeight: 44, minWidth: 44, padding: "8px 14px", borderRadius: 999, border: "1px solid var(--yema-border-strong)", background: "transparent", color: "var(--yema-gold-light)", fontSize: 12, cursor: "pointer" }}
              >
                {t("back")}
              </button>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{t("title")}</h1>
            </header>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ConversationView
                conversationId={activeConversationId}
                conversationType={activeConversationType}
                persona={persona}
              />
            </div>
          </div>
        ) : (
          <div>
            <header style={{ padding: "12px 16px 10px", borderBottom: "1px solid var(--yema-border)", display: "flex", gap: 12, alignItems: "center" }}>
              <button
                type="button"
                onClick={backToList}
                style={{ minHeight: 44, padding: "8px 14px", borderRadius: 999, border: "1px solid var(--yema-border-strong)", background: "transparent", color: "var(--yema-gold-light)", fontSize: 12, cursor: "pointer" }}
              >
                {t("back")}
              </button>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{t("matrix.title")}</h1>
            </header>
            <MatrixView />
          </div>
        )}
      </div>

      <style>{`
        [data-yema-shell] .msg-desktop { display: grid; grid-template-columns: 300px minmax(0, 1fr) 290px; height: 100vh; }
        [data-yema-shell] .msg-col-left, [data-yema-shell] .msg-col-right { border-right: 1px solid var(--yema-border); display: flex; flex-direction: column; overflow: hidden; }
        [data-yema-shell] .msg-col-right { border-right: none; border-left: 1px solid var(--yema-border); overflow: auto; }
        [data-yema-shell] .msg-col-center { display: flex; flex-direction: column; min-width: 0; }
        [data-yema-shell] .msg-mobile { display: none; }
        @media (max-width: 899.98px) {
          [data-yema-shell] .msg-desktop { display: none; }
          [data-yema-shell] .msg-mobile { display: block; max-width: 390px; margin: 0 auto; }
        }
        @media (min-width: 900px) and (max-width: 1199.98px) {
          [data-yema-shell] .msg-desktop { grid-template-columns: 300px minmax(0, 1fr); }
          [data-yema-shell] .msg-col-right { display: none; }
        }
      `}</style>
    </div>
  );
}
