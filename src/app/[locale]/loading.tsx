export default function LocaleLoading() {
  return (
    <div className="porte-seuil">
      <main className="porte-seuil-main">
        <div className="porte-seuil-inner" aria-busy="true" aria-live="polite">
          <span
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: "hidden",
              clip: "rect(0, 0, 0, 0)",
              whiteSpace: "nowrap",
              border: 0,
            }}
          >
            Chargement · Loading
          </span>
          <p className="maison-kicker">YEMA</p>
          <div style={{ display: "grid", gap: 14, marginTop: 18, width: "min(100%, 520px)" }} aria-hidden="true">
            <div style={{ height: 42, borderRadius: 12, background: "var(--creme-hair)" }} />
            <div style={{ height: 14, width: "82%", borderRadius: 999, background: "var(--creme-hair)" }} />
            <div style={{ height: 14, width: "64%", borderRadius: 999, background: "var(--creme-hair)" }} />
          </div>
        </div>
      </main>
    </div>
  );
}
