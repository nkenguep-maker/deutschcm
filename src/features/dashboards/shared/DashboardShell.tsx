import type { ReactNode } from "react";
import { yemaSans } from "./fonts";
import "./yema-tokens.css";
import type { YemaUniverse } from "./types";

type Props = {
  sidebar: ReactNode;
  header?: ReactNode;
  mobileHeader?: ReactNode;
  mobileNav?: ReactNode;
  tabBar?: ReactNode;
  children: ReactNode;
  universe?: YemaUniverse;
};

// DashboardShell · conteneur racine des nouveaux dashboards YEMA.
//
// Deux modes pilotés par CSS media query (breakpoint 900px) :
//   - Desktop (≥900px)  : sidebar visible + header sticky en haut ; tab bar
//                         cachée.
//   - Mobile  (<900px)  : sidebar cachée, header mobile compact, contenu en
//                         colonne centrée (max-width 390px), tab bar sticky
//                         en bas si fournie ; drawer mobileNav caché par
//                         défaut (backward-compat, remplaçable par tabBar).
//
// Le padding-bottom 96px sur le main mobile réserve l'espace de la tab bar
// (spec PDF §1). La max-width 390px est centrée sur le fond --yema-bg pour
// éviter toute rupture visuelle à 768px/1024px sous le breakpoint mobile.
export function DashboardShell({
  sidebar,
  header,
  mobileHeader,
  mobileNav,
  tabBar,
  children,
  universe = "neutral",
}: Props) {
  return (
    <div
      data-yema-shell
      data-yema-universe={universe}
      className={yemaSans.variable}
      style={{ minHeight: "100vh", background: "var(--yema-bg)" }}
    >
      <div className="yema-shell-grid">
        <aside className="yema-sidebar">{sidebar}</aside>

        <div className="yema-shell-main">
          {header ? <header className="yema-desktop-header">{header}</header> : null}
          {mobileHeader ? <div className="yema-mobile-header">{mobileHeader}</div> : null}
          {mobileNav ? <div className="yema-mobile-nav-drawer">{mobileNav}</div> : null}

          <main className="yema-main-content">{children}</main>

          {tabBar ? <div className="yema-tab-bar-slot">{tabBar}</div> : null}
        </div>
      </div>

      <style>{`
        [data-yema-shell] .yema-shell-grid {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(0, 260px) minmax(0, 1fr);
        }
        [data-yema-shell] .yema-sidebar {
          background: var(--yema-sidebar);
          border-right: 1px solid var(--yema-border);
          padding: 24px 18px;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        [data-yema-shell] .yema-shell-main {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        [data-yema-shell] .yema-desktop-header {
          position: sticky;
          top: 0;
          z-index: 5;
          background: var(--yema-bg);
          border-bottom: 1px solid var(--yema-border);
          padding: 18px 28px;
        }
        [data-yema-shell] .yema-mobile-header {
          display: none;
        }
        [data-yema-shell] .yema-mobile-nav-drawer {
          display: none;
        }
        [data-yema-shell] .yema-main-content {
          padding: 28px;
          min-width: 0;
          flex: 1;
        }
        [data-yema-shell] .yema-tab-bar-slot {
          display: none;
        }

        @media (max-width: 899.98px) {
          [data-yema-shell] .yema-shell-grid { grid-template-columns: 1fr; }
          [data-yema-shell] .yema-sidebar { display: none; }
          [data-yema-shell] .yema-desktop-header { display: none; }
          [data-yema-shell] .yema-mobile-header {
            display: block;
            position: sticky;
            top: 0;
            z-index: 5;
            background: var(--yema-bg);
            border-bottom: 1px solid var(--yema-border);
            padding: 12px 16px 10px;
          }
          [data-yema-shell] .yema-mobile-nav-drawer { display: block; }
          [data-yema-shell] .yema-main-content {
            max-width: 390px;
            width: 100%;
            margin: 0 auto;
            padding: 20px 16px 96px;
          }
          [data-yema-shell] .yema-tab-bar-slot { display: block; }
        }
      `}</style>
    </div>
  );
}
