// LandingLanguages — showcase des langues YEMA. Deux familles :
// - Étrangères (échelle CEFR A1→C1)
// - Natales (échelle YEMA É1→É5 : Écoute · Voix · Récit · Palabre · Foyer)
// Chaque langue = carte avec nom, région, statut (disponible / prochain
// chapitre / à venir), position sur l'échelle.

type LangStatus = "live" | "next" | "soon";

type Lang = {
  name: string;
  en: string;
  region: string;
  regionEn: string;
  status: LangStatus;
  spineLevel?: string; // A1, A2, B1, etc. ou É1, É2, É3, etc.
  note?: string;
  noteEn?: string;
};

const FOREIGN_LANGS: readonly Lang[] = [
  {
    name: "Allemand",
    en: "German",
    region: "Europe · DACH",
    regionEn: "Europe · DACH",
    status: "live",
    spineLevel: "A1",
    note: "Premier chapitre en cours",
    noteEn: "First chapter live",
  },
  {
    name: "Anglais",
    en: "English",
    region: "International",
    regionEn: "International",
    status: "next",
    spineLevel: "A1",
    note: "Chapitre suivant · 2026",
    noteEn: "Next chapter · 2026",
  },
  {
    name: "Français",
    en: "French",
    region: "International",
    regionEn: "International",
    status: "soon",
    spineLevel: "A1",
  },
  {
    name: "Portugais",
    en: "Portuguese",
    region: "Europe · Amérique",
    regionEn: "Europe · Americas",
    status: "soon",
    spineLevel: "A1",
  },
  {
    name: "Espagnol",
    en: "Spanish",
    region: "Amérique · Europe",
    regionEn: "Americas · Europe",
    status: "soon",
    spineLevel: "A1",
  },
  {
    name: "Arabe",
    en: "Arabic",
    region: "Nord · Golfe",
    regionEn: "North · Gulf",
    status: "soon",
    spineLevel: "A1",
  },
];

const NATIVE_LANGS: readonly Lang[] = [
  {
    name: "Bassa",
    en: "Bassa",
    region: "Cameroun",
    regionEn: "Cameroon",
    status: "next",
    spineLevel: "É1",
    note: "Priorité pays d’origine YEMA",
    noteEn: "Home country priority",
  },
  {
    name: "Wolof",
    en: "Wolof",
    region: "Sénégal · Gambie",
    regionEn: "Senegal · Gambia",
    status: "soon",
    spineLevel: "É1",
  },
  {
    name: "Swahili",
    en: "Swahili",
    region: "Afrique de l’Est",
    regionEn: "East Africa",
    status: "soon",
    spineLevel: "É1",
    note: "150 M locuteurs",
    noteEn: "150M speakers",
  },
  {
    name: "Lingala",
    en: "Lingala",
    region: "RDC · Congo",
    regionEn: "DRC · Congo",
    status: "soon",
    spineLevel: "É1",
  },
];

type Labels = {
  eye: string;
  title: string;
  titleAccent: string;
  body: string;
  familyForeignEye: string;
  familyForeignTitle: string;
  familyForeignSubtitle: string;
  familyNativeEye: string;
  familyNativeTitle: string;
  familyNativeSubtitle: string;
  statusLive: string;
  statusNext: string;
  statusSoon: string;
  scaleLegendCefr: string;
  scaleLegendYema: string;
};

const LABELS_FR: Labels = {
  eye: "Les langues",
  title: "Six langues,",
  titleAccent: "deux familles.",
  body:
    "Étrangères, alignées sur le CECRL — pour parler au monde. Natales, alignées sur l’échelle YEMA (Écoute · Voix · Récit · Palabre · Foyer) — pour revenir à sa parole d’origine.",
  familyForeignEye: "Étrangères",
  familyForeignTitle: "Pour ouvrir le monde",
  familyForeignSubtitle: "Échelle CECRL A1 → C1",
  familyNativeEye: "Natales",
  familyNativeTitle: "Pour revenir chez soi",
  familyNativeSubtitle: "Échelle YEMA É1 → É5",
  statusLive: "Chapitre en cours",
  statusNext: "Chapitre suivant",
  statusSoon: "À venir",
  scaleLegendCefr: "CECRL · A1 débutant → C1 maîtrise",
  scaleLegendYema:
    "YEMA · É1 Écoute · É2 Voix · É3 Récit · É4 Palabre · É5 Foyer",
};

const LABELS_EN: Labels = {
  eye: "The languages",
  title: "Six languages,",
  titleAccent: "two families.",
  body:
    "Foreign, aligned to CEFR — to speak to the world. Native, aligned to the YEMA scale (Listen · Voice · Story · Palaver · Home) — to return to your first speech.",
  familyForeignEye: "Foreign",
  familyForeignTitle: "To open onto the world",
  familyForeignSubtitle: "CEFR A1 → C1",
  familyNativeEye: "Native",
  familyNativeTitle: "To come home",
  familyNativeSubtitle: "YEMA É1 → É5",
  statusLive: "Live chapter",
  statusNext: "Next chapter",
  statusSoon: "Coming",
  scaleLegendCefr: "CEFR · A1 beginner → C1 mastery",
  scaleLegendYema:
    "YEMA · É1 Listen · É2 Voice · É3 Story · É4 Palaver · É5 Home",
};

function LangCard({
  lang,
  locale,
  labels,
}: {
  lang: Lang;
  locale: string;
  labels: Labels;
}) {
  const name = locale === "en" ? lang.en : lang.name;
  const region = locale === "en" ? lang.regionEn : lang.region;
  const note = locale === "en" ? lang.noteEn : lang.note;
  const statusText =
    lang.status === "live"
      ? labels.statusLive
      : lang.status === "next"
        ? labels.statusNext
        : labels.statusSoon;

  return (
    <article className={`llang llang-${lang.status}`}>
      <div className="llang-mono" aria-hidden="true">
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div className="llang-body">
        <h3 className="llang-name">{name}</h3>
        <p className="llang-region">{region}</p>
        {note ? <p className="llang-note">{note}</p> : null}
      </div>
      <div className="llang-meta">
        <span className="llang-status">{statusText}</span>
        {lang.spineLevel ? (
          <span className="llang-lvl">{lang.spineLevel}</span>
        ) : null}
      </div>
    </article>
  );
}

export function LandingLanguages({ locale }: { locale: string }) {
  const labels = locale === "en" ? LABELS_EN : LABELS_FR;

  return (
    <section className="lsection llanguages" id="languages">
      <div className="container">
        <div className="lsection-head centered">
          <div className="lsection-eye">{labels.eye}</div>
          <h1 className="lsection-h">
            {labels.title} <em>{labels.titleAccent}</em>
          </h1>
          <p className="lsection-lede">{labels.body}</p>
        </div>

        <div className="llang-family">
          <div className="llang-family-head">
            <div className="llang-family-eye">{labels.familyForeignEye}</div>
            <h2>{labels.familyForeignTitle}</h2>
            <p className="llang-family-scale">{labels.scaleLegendCefr}</p>
          </div>
          <div className="llang-grid">
            {FOREIGN_LANGS.map((l) => (
              <LangCard key={l.name} lang={l} locale={locale} labels={labels} />
            ))}
          </div>
        </div>

        <div className="llang-family">
          <div className="llang-family-head">
            <div className="llang-family-eye">{labels.familyNativeEye}</div>
            <h2>{labels.familyNativeTitle}</h2>
            <p className="llang-family-scale">{labels.scaleLegendYema}</p>
          </div>
          <div className="llang-grid">
            {NATIVE_LANGS.map((l) => (
              <LangCard key={l.name} lang={l} locale={locale} labels={labels} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
