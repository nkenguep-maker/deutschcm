import type { ReactNode } from "react";
import { yemaSans } from "./fonts";
import "./yema-tokens.css";
import type { YemaUniverse } from "./types";

type Props = {
  sidebar: ReactNode;
  header?: ReactNode;
  mobileNav?: ReactNode;
  children: ReactNode;
  universe?: YemaUniverse;
};

// DashboardShell : conteneur racine des nouveaux dashboards YEMA.
// Fournit fonte Jakarta + tokens scopés + layout sidebar/main.
export function DashboardShell({
  sidebar,
  header,
  mobileNav,
  children,
  universe = "neutral",
}: Props) {
  return (
    <div
      data-yema-shell
      data-yema-universe={universe}
      className={yemaSans.variable}
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "minmax(0, 260px) minmax(0, 1fr)",
        background: "var(--yema-bg)",
      }}
    >
      <aside
        style={{
          background: "var(--yema-sidebar)",
          borderRight: "1px solid var(--yema-border)",
          padding: "24px 18px",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
        className="yema-sidebar"
      >
        {sidebar}
      </aside>

      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        {header ? (
          <header
            style={{
              position: "sticky",
              top: 0,
              zIndex: 5,
              background: "var(--yema-bg)",
              borderBottom: "1px solid var(--yema-border)",
              padding: "18px 28px",
            }}
          >
            {header}
          </header>
        ) : null}

        {mobileNav ? <div className="yema-mobile-nav">{mobileNav}</div> : null}

        <main style={{ padding: "28px", minWidth: 0, flex: 1 }}>{children}</main>
      </div>

      <style>{`
        .yema-mobile-nav { display: none; }
        @media (max-width: 900px) {
          [data-yema-shell] { grid-template-columns: 1fr; }
          [data-yema-shell] .yema-sidebar { display: none; }
          [data-yema-shell] .yema-mobile-nav { display: block; }
        }
      `}</style>
    </div>
  );
}
