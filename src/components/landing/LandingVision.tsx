// LandingVision — trois ambitions numérotées 01·02·03, éditorial hors carte.
// Filet horizontal entre chaque, chiffres Fraunces oldstyle laiton.

type VisionLabels = {
  title: string;
  subtitle: string;
  items: readonly {
    label: string;
    title: string;
    desc: string;
  }[];
};

export function LandingVision({ labels }: { labels: VisionLabels }) {
  return (
    <section className="lsection" id="vision">
      <div className="container">
        <div className="lsection-head centered">
          <div className="lsection-eye">Le parcours</div>
          <h2 className="lsection-h">{labels.title}</h2>
          <p className="lsection-lede">{labels.subtitle}</p>
        </div>

        <div className="lvision">
          {labels.items.map((v, i) => (
            <div key={i} className="lvision-item">
              <div className="lvision-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="lvision-body">
                <span className="kicker">{v.label}</span>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
