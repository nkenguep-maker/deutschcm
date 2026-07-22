"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import Layout from "@/components/Layout";
import { StateBlock } from "@/components/StateBlock";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassItem {
  id: string; teacherName: string; teacherAvatar: string; verified: boolean;
  level: string; city: string; center: string; students: number; max: number;
  schedule: string; nextSession: string; description: string; tags: string[];
  rating: number; reviews: number; code: string; isOnline?: boolean; lastActive: string;
}
interface CenterItem {
  id: string; name: string; city: string; region: string; avatar: string;
  verified: boolean; plan: string; teachers: number; students: number;
  classes: number; languages: string[]; code: string; successRate: number; yearsActive: number;
}
interface GroupItem {
  id: string; name: string; creatorName: string; creatorAvatar: string;
  level: string; city: string; members: number; max: number;
  goal: string; schedule: string; description: string; tags: string[];
  lastActive: string; memberAvatars: string[]; code: string;
}
interface SoloItem {
  id: string; name: string; avatar: string; level: string; targetLevel: string;
  city: string; goal: string; availability: string; desc: string;
}
interface Filters {
  levels: string[]; cities: string[]; availability: string[];
  spotsOnly: boolean; verifiedOnly: boolean;
}
type NameFilter = "all" | "teachers" | "centers" | "classes" | "groups";

const CLASSES: ClassItem[] = [];
const CENTERS: CenterItem[] = [];
const GROUPS: GroupItem[] = [];
const SOLOS: SoloItem[] = [];
const CODE_LOOKUP: Record<string, { type: "class"; data: ClassItem } | { type: "center"; data: CenterItem } | { type: "group"; data: GroupItem }> = {};

// ─── Locale text ──────────────────────────────────────────────────────────────

const T = {
  fr: {
    layoutTitle: "Découvrir",
    pageTitle: "Découvrir",
    pageSubtitle: "Trouvez une classe, un enseignant, un centre ou bientôt un partenaire d'apprentissage.",
    searchPlaceholder: "Rechercher une classe, un centre, un enseignant...",
    filtersBtn: "🎚️ Filtres",
    mapBtnList: "🗺️ Carte",
    mapBtnGrid: "☰ Liste",
    resultsLabel: (n: number, level: string | null, city: string | null) =>
      `${n} résultat${n !== 1 ? "s" : ""} · ${level ? `Niveau ${level}` : "Tous niveaux"}${city ? ` · ${city}` : ""}`,

    positionTitle: "Avancer seul, ou avec les bonnes personnes",
    positionDesc: "Yema vous aide à apprendre à votre rythme, mais aussi à trouver un cadre, un accompagnement ou une communauté lorsque vous en avez besoin.",

    tabAll: "🎯 Tous",
    tabClasses: "👨‍🏫 Classes",
    tabCenters: "🏫 Centres",
    tabGroups: "👥 Groupes",
    tabPartners: "🤝 Partenaires d'apprentissage",
    tabPartnersSoon: "bientôt",

    sortRelevance: "📊 Pertinence",
    sortActive: "⚡ Les plus actifs",
    sortRating: "⭐ Mieux notés",
    sortNew: "🆕 Places dispo.",

    joinByCodeTitle: "Rejoindre avec un code",
    joinByCodeDesc: "Entrez le code fourni par votre enseignant, votre centre ou votre groupe.",
    joinByCodePlaceholder: "Exemple : YEMA-A1-2026",
    joinByCodeBtn: "Rejoindre",
    codeSubtitle: "· Classes · Centres · Groupes",
    codeNotFound: "Code introuvable. Vérifiez le code ou contactez la personne qui vous l'a envoyé.",
    spotsSent: "✓ Envoyé",
    spotsFull: "Complet",
    spotsAvail: (n: number) => `${n} place${n > 1 ? "s" : ""} dispo`,
    teacherBadge: "Enseignant",
    centerBadge: "Centre",
    groupBadge: "Groupe",
    joinBtn: "📩 Rejoindre",
    fullBtn: "⛔ Complet",

    searchByNameTitle: "Rechercher par nom",
    searchByNameDesc: "Cherchez un enseignant, un centre ou une classe disponible.",
    searchByNamePlaceholder: "Nom d'un enseignant, centre ou classe...",
    nameResultsLabel: (n: number, q: string) => `${n} résultat${n !== 1 ? "s" : ""} pour « ${q} »`,
    nameNoResults: (q: string) => `Aucun résultat pour « ${q} »`,
    nameFilterAll: "Tous",
    nameFilterTeachers: "Enseignants",
    nameFilterCenters: "Centres",
    nameFilterClasses: "Classes",
    nameFilterGroups: "Groupes",
    seeBtn: "Voir →",

    mapTitle: "🗺️ Carte du Cameroun — cliquez une ville",
    mapLegendClass: "Classes disponibles",
    mapLegendCity: "Ville",
    mapClickNote: "Cliquez sur une ville pour filtrer les classes",

    filterSidebarLabel: "🎚️ Filtres",
    filterResultsLabel: (n: number) => `${n} résultat${n !== 1 ? "s" : ""}`,
    filterReset: "Réinitialiser",
    filterLevel: "Niveau",
    filterCity: "Ville",
    filterAvailability: "Disponibilité",
    filterSpotsOnly: "Places disponibles uniquement",
    filterVerifiedOnly: "Centres vérifiés uniquement",
    citiesList: ["Yaoundé", "Douala", "Bafoussam", "Garoua", "Bamenda", "Maroua", "Ngaoundéré", "En ligne"],
    availList: ["Matin", "Après-midi", "Soir", "Weekend"],

    sectionRecommended: "Recommandé pour vous",
    sectionRecommendedSub: (level: string) => `Basé sur votre niveau ${level}`,
    sectionClasses: "Classes enseignants",
    sectionCenters: "Centres de langue",
    sectionGroups: "Groupes d'élèves",
    createGroupBtn: "+ Créer un groupe",

    cardRecommended: "⭐ RECOMMANDÉ",
    cardOnline: "🌐 En ligne",
    cardProgram: "👁 Programme",
    cardWaitlist: "🔴 Liste d'attente",
    cardWaitlisted: "✓ Liste d'attente",
    cardRequestSent: "⏳ Demande envoyée",
    cardJoinClass: "📩 Rejoindre",
    cardSpotsLabel: (cur: number, max: number) => `${cur}/${max} élèves`,
    cardSpotsRemaining: (n: number) => n > 0 ? `${n} places` : "Complet",
    cardSuccessRate: "Taux de réussite",
    cardViewClasses: "📋 Voir les classes",
    cardJoinCenter: "🏫 Rejoindre",
    cardTeachersLabel: "Enseignants",
    cardStudentsLabel: "Élèves",
    cardClassesLabel: "Classes",
    cardMembers: (cur: number, max: number) => `${cur}/${max} membres`,
    cardGroupFull: "⛔ Complet",
    cardGroupJoin: "👥 Rejoindre",
    cardGroupActivity: "💬 Activité",
    cardGroupBy: "par",
    cardSoloInvite: "✉️ Inviter dans mon groupe",
    cardSoloInvited: "✓ Invitation envoyée",

    onboardStep1Title: "Vous avez un code ?",
    onboardStep1Desc: "Entrez votre code enseignant ou code de classe en haut pour rejoindre directement.",
    onboardStep2Title: "Ou recherchez",
    onboardStep2Desc: "Utilisez la barre de recherche et les filtres pour trouver une classe par niveau, ville ou centre.",
    onboardStep3Title: "Rejoignez en 1 clic",
    onboardStep3Desc: "Cliquez sur Rejoindre sur n'importe quelle carte. Votre demande sera envoyée automatiquement.",
    onboardSkip: "Passer",
    onboardNext: "Suivant →",
    onboardDone: "J'ai compris ! 🚀",

    modalJoinGroup: "Rejoindre ce groupe",
    modalJoinCenter: "Rejoindre ce centre",
    modalJoinClass: "Rejoindre cette classe",
    modalMsgLabel: "Message (optionnel)",
    modalMsgPlaceholder: "Bonjour, je m'appelle… je souhaite rejoindre pour…",
    modalSend: "📩 Envoyer la demande",
    modalSending: "Envoi...",
    modalCancel: "Annuler",

    emptyTitle: "Aucun résultat pour le moment",
    emptyText: "Essayez un autre mot-clé, entrez un code de classe ou continuez votre parcours en autonomie.",
    emptyCta1: "Continuer mes cours",
    emptyCta2: "Réinitialiser la recherche",

    communityTitle: "Yema Community arrive bientôt",
    communityText: "Bientôt, vous pourrez trouver des partenaires d'apprentissage, rejoindre des groupes d'étude et échanger avec des personnes qui avancent vers les mêmes objectifs.",
  },
  en: {
    layoutTitle: "Explore",
    pageTitle: "Explore",
    pageSubtitle: "Find a class, teacher, center or soon a learning partner.",
    searchPlaceholder: "Search for a class, center, teacher...",
    filtersBtn: "🎚️ Filters",
    mapBtnList: "🗺️ Map",
    mapBtnGrid: "☰ List",
    resultsLabel: (n: number, level: string | null, city: string | null) =>
      `${n} result${n !== 1 ? "s" : ""} · ${level ? `Level ${level}` : "All levels"}${city ? ` · ${city}` : ""}`,

    positionTitle: "Move forward on your own, or with the right people",
    positionDesc: "Yema helps you learn at your own pace, while also helping you find structure, support or community when you need it.",

    tabAll: "🎯 All",
    tabClasses: "👨‍🏫 Classes",
    tabCenters: "🏫 Centers",
    tabGroups: "👥 Groups",
    tabPartners: "🤝 Learning partners",
    tabPartnersSoon: "coming soon",

    sortRelevance: "📊 Relevance",
    sortActive: "⚡ Most active",
    sortRating: "⭐ Best rated",
    sortNew: "🆕 Available spots",

    joinByCodeTitle: "Join with a code",
    joinByCodeDesc: "Enter the code shared by your teacher, center or group.",
    joinByCodePlaceholder: "Example: YEMA-A1-2026",
    joinByCodeBtn: "Join",
    codeSubtitle: "· Classes · Centers · Groups",
    codeNotFound: "Code not found. Check the code or contact the person who shared it with you.",
    spotsSent: "✓ Sent",
    spotsFull: "Full",
    spotsAvail: (n: number) => `${n} spot${n > 1 ? "s" : ""} left`,
    teacherBadge: "Teacher",
    centerBadge: "Center",
    groupBadge: "Group",
    joinBtn: "📩 Join",
    fullBtn: "⛔ Full",

    searchByNameTitle: "Search by name",
    searchByNameDesc: "Search for an available teacher, center or class.",
    searchByNamePlaceholder: "Teacher, center or class name...",
    nameResultsLabel: (n: number, q: string) => `${n} result${n !== 1 ? "s" : ""} for "${q}"`,
    nameNoResults: (q: string) => `No results for "${q}"`,
    nameFilterAll: "All",
    nameFilterTeachers: "Teachers",
    nameFilterCenters: "Centers",
    nameFilterClasses: "Classes",
    nameFilterGroups: "Groups",
    seeBtn: "View →",

    mapTitle: "🗺️ Map of Cameroon — click a city",
    mapLegendClass: "Available classes",
    mapLegendCity: "City",
    mapClickNote: "Click a city to filter classes",

    filterSidebarLabel: "🎚️ Filters",
    filterResultsLabel: (n: number) => `${n} result${n !== 1 ? "s" : ""}`,
    filterReset: "Reset",
    filterLevel: "Level",
    filterCity: "City",
    filterAvailability: "Availability",
    filterSpotsOnly: "Available spots only",
    filterVerifiedOnly: "Verified centers only",
    citiesList: ["Yaoundé", "Douala", "Bafoussam", "Garoua", "Bamenda", "Maroua", "Ngaoundéré", "Online"],
    availList: ["Morning", "Afternoon", "Evening", "Weekend"],

    sectionRecommended: "Recommended for you",
    sectionRecommendedSub: (level: string) => `Based on your level ${level}`,
    sectionClasses: "Teacher classes",
    sectionCenters: "Language centers",
    sectionGroups: "Study groups",
    createGroupBtn: "+ Create a group",

    cardRecommended: "⭐ RECOMMENDED",
    cardOnline: "🌐 Online",
    cardProgram: "👁 Syllabus",
    cardWaitlist: "🔴 Waitlist",
    cardWaitlisted: "✓ On waitlist",
    cardRequestSent: "⏳ Request sent",
    cardJoinClass: "📩 Join",
    cardSpotsLabel: (cur: number, max: number) => `${cur}/${max} learners`,
    cardSpotsRemaining: (n: number) => n > 0 ? `${n} spot${n > 1 ? "s" : ""}` : "Full",
    cardSuccessRate: "Success rate",
    cardViewClasses: "📋 View classes",
    cardJoinCenter: "🏫 Join",
    cardTeachersLabel: "Teachers",
    cardStudentsLabel: "Learners",
    cardClassesLabel: "Classes",
    cardMembers: (cur: number, max: number) => `${cur}/${max} members`,
    cardGroupFull: "⛔ Full",
    cardGroupJoin: "👥 Join",
    cardGroupActivity: "💬 Activity",
    cardGroupBy: "by",
    cardSoloInvite: "✉️ Invite to my group",
    cardSoloInvited: "✓ Invitation sent",

    onboardStep1Title: "Have a code?",
    onboardStep1Desc: "Enter your teacher code or class code at the top to join directly.",
    onboardStep2Title: "Or search",
    onboardStep2Desc: "Use the search bar and filters to find a class by level, city or center.",
    onboardStep3Title: "Join in one click",
    onboardStep3Desc: "Click Join on any card. Your request will be sent automatically.",
    onboardSkip: "Skip",
    onboardNext: "Next →",
    onboardDone: "Got it! 🚀",

    modalJoinGroup: "Join this group",
    modalJoinCenter: "Join this center",
    modalJoinClass: "Join this class",
    modalMsgLabel: "Message (optional)",
    modalMsgPlaceholder: "Hello, my name is… I'd like to join because…",
    modalSend: "📩 Send request",
    modalSending: "Sending...",
    modalCancel: "Cancel",

    emptyTitle: "No results yet",
    emptyText: "Try another keyword, enter a class code or continue learning on your own.",
    emptyCta1: "Continue my courses",
    emptyCta2: "Reset search",

    communityTitle: "Yema Community is coming soon",
    communityText: "Soon, you will be able to find learning partners, join study groups and connect with people moving toward similar goals.",
  },
};

type TT = typeof T.fr;
type Locale = "fr" | "en";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, string> = {
  A1: "var(--brass)", A2: "#34d399", B1: "#3b82f6", B2: "#8b5cf6", C1: "#f59e0b", C2: "var(--oxblood)",
};
const PLAN_LABEL: Record<string, { label: string; color: string }> = {
  starter: { label: "Starter", color: "#64748b" },
  pro: { label: "Pro", color: "var(--brass)" },
  enterprise: { label: "Enterprise", color: "#f59e0b" },
};

function Av({ initials, size = 38, color = "var(--brass)" }: { initials: string; size?: number; color?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${color}, ${color}88)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

function LvlBadge({ level }: { level: string }) {
  const c = LEVEL_COLORS[level] ?? "#64748b";
  return <span style={{ background: `${c}20`, color: c, border: `1px solid ${c}40`, borderRadius: 7, padding: "2px 8px", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{level}</span>;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#fbbf24", fontSize: 13 }}>
      {"★".repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 ? "½" : ""}
      <span style={{ color: "var(--creme-hair)" }}>{"★".repeat(5 - Math.ceil(rating))}</span>
    </span>
  );
}

function SpotsBar({ current, max, t }: { current: number; max: number; t: TT }) {
  const pct = (current / max) * 100;
  const color = pct >= 90 ? "var(--oxblood)" : pct >= 70 ? "#f59e0b" : "var(--brass)";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13, color: "var(--creme-soft)" }}>
        <span>{t.cardSpotsLabel(current, max)}</span>
        <span style={{ color: pct >= 90 ? "var(--oxblood)" : "var(--brass)", fontWeight: 600 }}>{t.cardSpotsRemaining(max - current)}</span>
      </div>
      <div style={{ height: 4, background: "var(--creme-hair)", borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width var(--dur-moment)" }} />
      </div>
    </div>
  );
}

// ─── Cameroon Map ─────────────────────────────────────────────────────────────

const MAP_CITIES_BASE = [
  { name: "Yaoundé",   x: 82,  y: 220, classes: 4 },
  { name: "Douala",    x: 35,  y: 215, classes: 3 },
  { name: "Bafoussam", x: 52,  y: 185, classes: 1 },
  { name: "Garoua",   x: 128, y: 95,  classes: 1 },
  { name: "Bamenda",  x: 44,  y: 172, classes: 0 },
  { name: "Maroua",   x: 148, y: 55,  classes: 0 },
];

function CameroonMap({ onCityClick, t }: { onCityClick: (city: string) => void; t: TT }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const onlineKey = t === T.en ? "Online" : "En ligne";
  const mapCities = [...MAP_CITIES_BASE, { name: onlineKey, x: 110, y: 240, classes: 1 }];

  return (
    <div style={{ background: "rgba(244, 235, 220, 0.02)", border: "1px solid var(--creme-hair)", borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ color: "var(--creme-soft)", fontSize: 13, marginBottom: 12 }}>{t.mapTitle}</div>
      <svg viewBox="0 0 200 300" width={200} height={300} style={{ overflow: "visible" }}>
        <path d="M 30,275 C 40,280 65,285 85,282 L 130,278 C 155,265 175,240 185,210 L 190,175 L 185,145 C 182,120 175,100 165,78 L 152,50 C 140,28 122,10 100,3 L 72,0 C 48,5 25,22 14,50 L 3,82 C 0,108 8,132 12,158 L 16,192 L 22,228 Z"
          fill="var(--brass-glow)" stroke="var(--brass-edge)" strokeWidth="1.5" />
        {mapCities.map(city => (
          <g key={city.name} onClick={() => onCityClick(city.name)} style={{ cursor: "pointer" }}
            onMouseEnter={() => setHovered(city.name)} onMouseLeave={() => setHovered(null)}>
            <circle cx={city.x} cy={city.y} r={city.classes > 0 ? 7 : 4}
              fill={city.classes > 0 ? "var(--brass)" : "var(--creme-hair)"}
              stroke={hovered === city.name ? "white" : city.classes > 0 ? "rgba(16,185,129,0.4)" : "var(--creme-hair)"}
              strokeWidth={hovered === city.name ? 2 : 1} opacity={hovered === city.name ? 1 : 0.85} />
            {city.classes > 0 && (
              <text x={city.x} y={city.y + 0.5} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={7} fontWeight="bold">{city.classes}</text>
            )}
            <text x={city.x + 10} y={city.y} dominantBaseline="middle" fill={hovered === city.name ? "white" : "var(--creme-soft)"} fontSize={9}>{city.name}</text>
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 13, color: "var(--creme-soft)" }}>
        <span style={{ display: "flex", gap: 4, alignItems: "center" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brass)", display: "inline-block" }} /> {t.mapLegendClass}</span>
        <span style={{ display: "flex", gap: 4, alignItems: "center" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--creme-hair)", display: "inline-block" }} /> {t.mapLegendCity}</span>
      </div>
    </div>
  );
}

// ─── Dual Search ──────────────────────────────────────────────────────────────

type CodeResult = { type: "class"; data: ClassItem } | { type: "center"; data: CenterItem } | { type: "group"; data: GroupItem };

function DualSearch({ onJoin, t }: { onJoin: (id: string, name: string, type: "class" | "group" | "center", teacher?: string) => void; t: TT }) {
  const [code, setCode] = useState("");
  const [codeResult, setCodeResult] = useState<CodeResult | null | "notfound">(null);
  const [codeSent, setCodeSent] = useState<Set<string>>(new Set());
  const [nameQuery, setNameQuery] = useState("");
  const [nameFilter, setNameFilter] = useState<NameFilter>("all");

  const ac = "var(--brass)";

  const handleCodeSearch = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setCodeResult(CODE_LOOKUP[trimmed] ?? "notfound");
  };

  const nameResults = useMemo(() => {
    if (nameQuery.length < 3) return [];
    const q = nameQuery.toLowerCase();
    type NR = { type: "class" | "center" | "group"; data: ClassItem | CenterItem | GroupItem };
    const r: NR[] = [];
    if (nameFilter === "all" || nameFilter === "teachers" || nameFilter === "classes")
      CLASSES.filter(c => `${c.teacherName} ${c.city} ${c.level} ${c.center}`.toLowerCase().includes(q)).forEach(c => r.push({ type: "class", data: c }));
    if (nameFilter === "all" || nameFilter === "centers")
      CENTERS.filter(c => `${c.name} ${c.city}`.toLowerCase().includes(q)).forEach(c => r.push({ type: "center", data: c }));
    if (nameFilter === "all" || nameFilter === "groups")
      GROUPS.filter(g => `${g.name} ${g.city} ${g.level}`.toLowerCase().includes(q)).forEach(g => r.push({ type: "group", data: g }));
    return r;
  }, [nameQuery, nameFilter]);

  const nameFilterLabels: Record<NameFilter, string> = {
    all: t.nameFilterAll,
    teachers: t.nameFilterTeachers,
    centers: t.nameFilterCenters,
    classes: t.nameFilterClasses,
    groups: t.nameFilterGroups,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>

      {/* Code section */}
      <div style={{ background: "linear-gradient(135deg, var(--brass-glow), rgba(5,150,105,0.03))", border: "1px solid var(--brass-edge)", borderRadius: 18, padding: "16px 20px" }}>
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
            <span style={{ fontSize: 14 }}>🔑</span>
            <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>{t.joinByCodeTitle}</span>
            <span style={{ color: "var(--creme-soft)", fontSize: 13 }}>{t.codeSubtitle}</span>
          </div>
          <div style={{ color: "var(--creme-soft)", fontSize: 13, marginBottom: 12 }}>{t.joinByCodeDesc}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setCodeResult(null); }}
            onKeyDown={e => e.key === "Enter" && code.trim().length >= 4 && handleCodeSearch()}
            placeholder={t.joinByCodePlaceholder}
            style={{ flex: 1, padding: "10px 12px", borderRadius: 11, background: "var(--creme-hair)", border: `1px solid ${codeResult === "notfound" ? "rgba(239,68,68,0.5)" : codeResult ? "rgba(16,185,129,0.5)" : "var(--creme-hair)"}`, color: "white", fontSize: 16, outline: "none", fontFamily: "monospace", letterSpacing: "0.04em", boxSizing: "border-box" as const }}
          />
          <button onClick={handleCodeSearch} disabled={code.trim().length < 4} style={{ padding: "10px 18px", borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: code.trim().length >= 4 ? "pointer" : "not-allowed", background: code.trim().length >= 4 ? `linear-gradient(135deg,${ac},var(--brass-deep))` : "var(--creme-hair)", color: code.trim().length >= 4 ? "white" : "var(--creme-mute)", border: "none", whiteSpace: "nowrap" as const }}>
            {t.joinByCodeBtn} →
          </button>
        </div>

        {codeResult === "notfound" && (
          <div style={{ marginTop: 10, color: "var(--oxblood)", fontSize: 12, display: "flex", gap: 6, alignItems: "center" }} role="alert">
            {t.codeNotFound}
          </div>
        )}

        {codeResult && codeResult !== "notfound" && (() => {
          if (codeResult.type === "class") {
            const cls = codeResult.data;
            const spots = cls.max - cls.students;
            const sent = codeSent.has(cls.id);
            const lc = LEVEL_COLORS[cls.level] ?? ac;
            return (
              <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 14, background: "rgba(244, 235, 220, 0.04)", border: `1px solid ${lc}30`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
                <Av initials={cls.teacherAvatar} size={42} color={lc} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" as const, marginBottom: 3 }}>
                    <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{cls.teacherName}</span>
                    <LvlBadge level={cls.level} />
                    <span style={{ background: "rgba(99,102,241,0.12)", color: "var(--brass)", borderRadius: 5, padding: "1px 6px", fontSize: 13, fontWeight: 700 }}>{t.teacherBadge}</span>
                  </div>
                  <div style={{ color: "var(--creme-soft)", fontSize: 13 }}>📍 {cls.city} · 📅 {cls.schedule} · {spots > 0 ? t.spotsAvail(spots) : t.spotsFull}</div>
                </div>
                <button onClick={() => { if (!sent && spots > 0) { setCodeSent(s => new Set([...s, cls.id])); onJoin(cls.id, `${cls.teacherName} — ${cls.level}`, "class", cls.teacherName); } }} disabled={sent || spots <= 0} style={{ padding: "9px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: (!sent && spots > 0) ? "pointer" : "not-allowed", background: sent ? `${ac}15` : `linear-gradient(135deg,${ac},var(--brass-deep))`, border: sent ? `1px solid ${ac}40` : "none", color: sent ? ac : "white", whiteSpace: "nowrap" as const }}>
                  {sent ? t.spotsSent : spots <= 0 ? t.spotsFull : t.joinBtn}
                </button>
              </div>
            );
          }
          if (codeResult.type === "center") {
            const ctr = codeResult.data;
            const sent = codeSent.has(ctr.id);
            return (
              <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 14, background: "rgba(244, 235, 220, 0.04)", border: "1px solid rgba(234,179,8,0.3)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fbbf24", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{ctr.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" as const, marginBottom: 3 }}>
                    <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{ctr.name}</span>
                    {ctr.verified && <span>✅</span>}
                    <span style={{ background: "rgba(234,179,8,0.12)", color: "#fbbf24", borderRadius: 5, padding: "1px 6px", fontSize: 13, fontWeight: 700 }}>{t.centerBadge}</span>
                  </div>
                  <div style={{ color: "var(--creme-soft)", fontSize: 13 }}>📍 {ctr.city} · {ctr.classes} {t.cardClassesLabel}</div>
                </div>
                <button onClick={() => { if (!sent) { setCodeSent(s => new Set([...s, ctr.id])); onJoin(ctr.id, ctr.name, "center"); } }} disabled={sent} style={{ padding: "9px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: sent ? "not-allowed" : "pointer", background: sent ? "rgba(234,179,8,0.1)" : "linear-gradient(135deg,#eab308,#ca8a04)", border: sent ? "1px solid rgba(234,179,8,0.3)" : "none", color: sent ? "#fbbf24" : "white", whiteSpace: "nowrap" as const }}>
                  {sent ? t.spotsSent : t.joinBtn}
                </button>
              </div>
            );
          }
          const grp = codeResult.data;
          const isFull = grp.members >= grp.max;
          const sent = codeSent.has(grp.id);
          return (
            <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 14, background: "rgba(244, 235, 220, 0.04)", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
              <Av initials={grp.creatorAvatar} size={42} color="var(--brass)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" as const, marginBottom: 3 }}>
                  <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{grp.name}</span>
                  <LvlBadge level={grp.level} />
                  <span style={{ background: "rgba(99,102,241,0.12)", color: "var(--brass)", borderRadius: 5, padding: "1px 6px", fontSize: 13, fontWeight: 700 }}>{t.groupBadge}</span>
                </div>
                <div style={{ color: "var(--creme-soft)", fontSize: 13 }}>📍 {grp.city} · {t.cardMembers(grp.members, grp.max)} · {grp.schedule}</div>
              </div>
              <button onClick={() => { if (!isFull && !sent) { setCodeSent(s => new Set([...s, grp.id])); onJoin(grp.id, grp.name, "group"); } }} disabled={sent || isFull} style={{ padding: "9px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: (sent || isFull) ? "not-allowed" : "pointer", background: sent ? "rgba(99,102,241,0.1)" : isFull ? "rgba(244, 235, 220, 0.04)" : "linear-gradient(135deg,var(--brass),#4f46e5)", border: sent ? "1px solid rgba(99,102,241,0.3)" : isFull ? "1px solid var(--creme-hair)" : "none", color: sent ? "var(--brass)" : isFull ? "var(--creme-mute)" : "white", whiteSpace: "nowrap" as const }}>
                {sent ? t.spotsSent : isFull ? t.fullBtn : t.joinBtn}
              </button>
            </div>
          );
        })()}
      </div>

      {/* Name search */}
      <div style={{ background: "rgba(244, 235, 220, 0.02)", border: "1px solid var(--creme-hair)", borderRadius: 18, padding: "16px 20px" }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
            <span style={{ fontSize: 14 }}>🔍</span>
            <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>{t.searchByNameTitle}</span>
          </div>
          <div style={{ color: "var(--creme-soft)", fontSize: 13 }}>{t.searchByNameDesc}</div>
        </div>
        <div style={{ position: "relative" as const, marginBottom: 10 }}>
          <input
            value={nameQuery}
            onChange={e => setNameQuery(e.target.value)}
            placeholder={t.searchByNamePlaceholder}
            style={{ width: "100%", padding: "10px 36px 10px 36px", borderRadius: 11, background: "var(--creme-hair)", border: "1px solid var(--creme-hair)", color: "white", fontSize: 16, outline: "none", boxSizing: "border-box" as const }}
            onFocus={e => (e.target.style.borderColor = "var(--creme-mute)")}
            onBlur={e => (e.target.style.borderColor = "var(--creme-hair)")}
          />
          <span style={{ position: "absolute" as const, left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.4 }}>🔍</span>
          {nameQuery && <button onClick={() => setNameQuery("")} style={{ position: "absolute" as const, right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--creme-mute)", fontSize: 16, cursor: "pointer" }}>×</button>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
          {(["all", "teachers", "centers", "classes", "groups"] as NameFilter[]).map(f => (
            <button key={f} onClick={() => setNameFilter(f)} style={{ padding: "4px 11px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", background: nameFilter === f ? "var(--creme-hair)" : "rgba(244, 235, 220, 0.04)", border: nameFilter === f ? "1px solid var(--creme-mute)" : "1px solid var(--creme-hair)", color: nameFilter === f ? "white" : "var(--creme-soft)" }}>
              {nameFilterLabels[f]}
            </button>
          ))}
        </div>

        {nameQuery.length >= 3 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ color: "var(--creme-soft)", fontSize: 13, marginBottom: 8 }}>
              {t.nameResultsLabel(nameResults.length, nameQuery)}
            </div>
            {nameResults.length === 0 ? (
              <div style={{ color: "var(--creme-soft)", fontSize: 13, textAlign: "center" as const, padding: "10px 0" }}>
                {t.nameNoResults(nameQuery)}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, maxHeight: 320, overflowY: "auto" as const }}>
                {nameResults.slice(0, 8).map((r, i) => {
                  if (r.type === "class") {
                    const cls = r.data as ClassItem;
                    const lc = LEVEL_COLORS[cls.level] ?? ac;
                    return (
                      <div key={`c${i}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "rgba(244, 235, 220, 0.03)", border: "1px solid var(--creme-hair)" }}>
                        <Av initials={cls.teacherAvatar} size={32} color={lc} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" as const }}>
                            <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>{cls.teacherName}</span>
                            <LvlBadge level={cls.level} />
                            <span style={{ background: "rgba(99,102,241,0.12)", color: "var(--brass)", borderRadius: 5, padding: "1px 5px", fontSize: 13, fontWeight: 700 }}>{t.teacherBadge}</span>
                          </div>
                          <div style={{ color: "var(--creme-soft)", fontSize: 13 }}>📍 {cls.city} · {t.cardSpotsRemaining(cls.max - cls.students)}</div>
                        </div>
                        <button onClick={() => onJoin(cls.id, `${cls.teacherName} — ${cls.level}`, "class", cls.teacherName)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", background: `linear-gradient(135deg,${ac},var(--brass-deep))`, color: "white", border: "none", whiteSpace: "nowrap" as const }}>{t.seeBtn}</button>
                      </div>
                    );
                  }
                  if (r.type === "center") {
                    const ctr = r.data as CenterItem;
                    return (
                      <div key={`t${i}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "rgba(244, 235, 220, 0.03)", border: "1px solid var(--creme-hair)" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fbbf24", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{ctr.avatar}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                            <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>{ctr.name}</span>
                            <span style={{ background: "rgba(234,179,8,0.12)", color: "#fbbf24", borderRadius: 5, padding: "1px 5px", fontSize: 13, fontWeight: 700 }}>{t.centerBadge}</span>
                          </div>
                          <div style={{ color: "var(--creme-soft)", fontSize: 13 }}>📍 {ctr.city} · {ctr.classes} {t.cardClassesLabel}</div>
                        </div>
                        <button onClick={() => onJoin(ctr.id, ctr.name, "center")} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg,#eab308,#ca8a04)", color: "white", border: "none", whiteSpace: "nowrap" as const }}>{t.seeBtn}</button>
                      </div>
                    );
                  }
                  const grp = r.data as GroupItem;
                  const lc = LEVEL_COLORS[grp.level] ?? ac;
                  return (
                    <div key={`g${i}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "rgba(244, 235, 220, 0.03)", border: "1px solid var(--creme-hair)" }}>
                      <Av initials={grp.creatorAvatar} size={32} color="var(--brass)" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" as const }}>
                          <span style={{ color: "white", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: 120 }}>{grp.name}</span>
                          <LvlBadge level={grp.level} />
                          <span style={{ background: "rgba(99,102,241,0.12)", color: "var(--brass)", borderRadius: 5, padding: "1px 5px", fontSize: 13, fontWeight: 700 }}>{t.groupBadge}</span>
                        </div>
                        <div style={{ color: "var(--creme-soft)", fontSize: 13 }}>📍 {grp.city} · {t.cardMembers(grp.members, grp.max)}</div>
                      </div>
                      <button onClick={() => onJoin(grp.id, grp.name, "group")} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg,var(--brass),#4f46e5)", color: "white", border: "none", whiteSpace: "nowrap" as const }}>{t.seeBtn}</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Onboarding overlay ───────────────────────────────────────────────────────

function OnboardingOverlay({ onClose, t }: { onClose: () => void; t: TT }) {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: "🔑", title: t.onboardStep1Title, desc: t.onboardStep1Desc },
    { icon: "🔍", title: t.onboardStep2Title, desc: t.onboardStep2Desc },
    { icon: "📩", title: t.onboardStep3Title, desc: t.onboardStep3Desc },
  ];
  const current = steps[step];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "var(--espresso-2)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 24, padding: "32px 28px", maxWidth: 400, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{current.icon}</div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
          {steps.map((_, i) => <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? "var(--brass)" : "var(--creme-hair)", transition: "width var(--dur-move)" }} />)}
        </div>
        <h3 style={{ color: "white", fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>{current.title}</h3>
        <p style={{ color: "var(--creme-soft)", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>{current.desc}</p>
        <div style={{ display: "flex", gap: 10 }}>
          {step < steps.length - 1 ? (
            <>
              <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 12, background: "var(--creme-hair)", border: "1px solid var(--creme-hair)", color: "var(--creme-soft)", fontSize: 13, cursor: "pointer" }}>{t.onboardSkip}</button>
              <button onClick={() => setStep(s => s + 1)} style={{ flex: 2, padding: "11px", borderRadius: 12, background: "linear-gradient(135deg,var(--brass),var(--brass-deep))", color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t.onboardNext}</button>
            </>
          ) : (
            <button onClick={onClose} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "linear-gradient(135deg,var(--brass),var(--brass-deep))", color: "white", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{t.onboardDone}</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Filter sidebar ───────────────────────────────────────────────────────────

const LEVELS_LIST = ["A1", "A2", "B1", "B2", "C1"];

function FilterSidebar({ filters, onChange, onReset, count, t }: { filters: Filters; onChange: (f: Filters) => void; onReset: () => void; count: number; t: TT }) {
  const toggle = (key: keyof Pick<Filters, "levels" | "cities" | "availability">, val: string) => {
    const arr = filters[key];
    onChange({ ...filters, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] });
  };

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", background: active ? "var(--brass-glow)" : "rgba(244, 235, 220, 0.04)", border: active ? "1px solid rgba(16,185,129,0.4)" : "1px solid var(--creme-hair)", color: active ? "var(--brass)" : "var(--creme-soft)", transition: "all var(--dur-touch)" }}>
      {label}
    </button>
  );

  return (
    <div style={{ width: "100%", maxWidth: 220, flexShrink: 0, background: "rgba(244, 235, 220, 0.02)", border: "1px solid var(--creme-hair)", borderRadius: 16, padding: 16, height: "fit-content", position: "sticky", top: 140 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>{t.filterSidebarLabel}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ background: "var(--brass-glow)", color: "var(--brass)", borderRadius: 8, padding: "2px 8px", fontSize: 13, fontWeight: 700 }}>{t.filterResultsLabel(count)}</span>
          <button onClick={onReset} style={{ color: "var(--creme-soft)", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>{t.filterReset}</button>
        </div>
      </div>

      {[
        { label: t.filterLevel, key: "levels" as const, items: LEVELS_LIST },
        { label: t.filterCity, key: "cities" as const, items: t.citiesList },
        { label: t.filterAvailability, key: "availability" as const, items: t.availList },
      ].map(section => (
        <div key={section.key} style={{ marginBottom: 16 }}>
          <div style={{ color: "var(--creme-soft)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{section.label}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {section.items.map(item => (
              <Chip key={item} label={item} active={filters[section.key].includes(item)} onClick={() => toggle(section.key, item)} />
            ))}
          </div>
        </div>
      ))}

      <div style={{ borderTop: "1px solid var(--creme-hair)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { key: "spotsOnly", label: t.filterSpotsOnly },
          { key: "verifiedOnly", label: t.filterVerifiedOnly },
        ].map(opt => (
          <label key={opt.key} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
            <div onClick={() => onChange({ ...filters, [opt.key]: !filters[opt.key as keyof Filters] })} style={{ width: 16, height: 16, borderRadius: 4, border: "1px solid var(--creme-hair)", background: filters[opt.key as keyof Filters] ? "var(--brass)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              {filters[opt.key as keyof Filters] && <span style={{ color: "white", fontSize: 10 }}>✓</span>}
            </div>
            <span style={{ color: "var(--creme-soft)", fontSize: 13 }}>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Class Card ───────────────────────────────────────────────────────────────

function ClassCard({ cls, recommended, onJoin, faved, onFav, sent, t }: { cls: ClassItem; recommended?: boolean; onJoin: (id: string, name: string, teacher: string) => void; faved: boolean; onFav: (id: string) => void; sent?: boolean; t: TT }) {
  const [hovered, setHovered] = useState(false);
  const [waitlisted, setWaitlisted] = useState(false);
  const isFull = cls.students >= cls.max;
  const lc = LEVEL_COLORS[cls.level] ?? "var(--brass)";

  const share = () => {
    const url = `${window.location.origin}/discover/class/${cls.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    const wa = `https://wa.me/?text=${encodeURIComponent(`${cls.teacherName} (${cls.level}) — ${url}`)}`;
    window.open(wa, "_blank");
  };

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      background: "rgba(244, 235, 220, 0.03)", border: `1px solid ${hovered ? "rgba(16,185,129,0.3)" : "var(--creme-hair)"}`,
      borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 12,
      transform: hovered ? "translateY(-3px)" : "translateY(0)",
      boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.3)" : "none",
      transition: "all var(--dur-move) var(--ease-enter)", position: "relative",
    }}>
      {recommended && <div style={{ position: "absolute", top: -8, left: 16, background: "#f59e0b", color: "#000", fontSize: 12, fontWeight: 800, padding: "2px 10px", borderRadius: 99, letterSpacing: "0.05em" }}>{t.cardRecommended}</div>}

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Av initials={cls.teacherAvatar} size={44} color="var(--brass)" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 2 }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{cls.teacherName}</span>
            {cls.verified && <span title="✅" style={{ fontSize: 12 }}>✅</span>}
            {cls.isOnline && <span style={{ background: "rgba(99,102,241,0.15)", color: "var(--brass)", borderRadius: 5, padding: "1px 6px", fontSize: 13 }}>{t.cardOnline}</span>}
          </div>
          <div style={{ color: "var(--creme-soft)", fontSize: 13 }}>🏛️ {cls.center} · 📍 {cls.city}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <code style={{ fontSize: 11, color: "var(--creme-mute)", letterSpacing: "0.03em" }}>{cls.code}</code>
            <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(cls.code).catch(() => {}); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 9, opacity: 0.4, lineHeight: 1 }} title={t.cardProgram}>📋</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          <LvlBadge level={cls.level} />
          <button onClick={() => onFav(cls.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1, opacity: faved ? 1 : 0.3, transition: "opacity var(--dur-move)" }}>
            {faved ? "❤️" : "🤍"}
          </button>
        </div>
      </div>

      <p style={{ margin: 0, color: "var(--creme)", fontSize: 13, lineHeight: 1.6 }}>{cls.description}</p>

      <SpotsBar current={cls.students} max={cls.max} t={t} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 13, color: "var(--creme-soft)" }}>
        <div>📅 {cls.schedule}</div>
        <div style={{ color: "var(--brass)" }}>⏭ {cls.nextSession}</div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}><Stars rating={cls.rating} /> <span>{cls.rating} ({cls.reviews})</span></div>
        <div style={{ color: "var(--creme-mute)", fontSize: 13 }}>🕐 {cls.lastActive}</div>
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {cls.tags.map(tag => <span key={tag} style={{ background: "var(--creme-hair)", border: "1px solid var(--creme-hair)", borderRadius: 5, padding: "1px 7px", fontSize: 13, color: "var(--creme-soft)" }}>#{tag}</span>)}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Link href={`/discover/class/${cls.id}`} style={{ flex: 1, textAlign: "center", padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: "none", background: "var(--creme-hair)", border: "1px solid var(--creme-hair)", color: "var(--creme-soft)" }}>
          {t.cardProgram}
        </Link>
        {isFull ? (
          <button onClick={() => setWaitlisted(true)} style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: waitlisted ? "default" : "pointer", background: waitlisted ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: waitlisted ? "var(--creme-mute)" : "#f87171" }}>
            {waitlisted ? t.cardWaitlisted : t.cardWaitlist}
          </button>
        ) : sent ? (
          <button disabled style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "not-allowed", background: "var(--creme-hair)", border: "1px solid var(--creme-hair)", color: "var(--creme-mute)" }}>
            {t.cardRequestSent}
          </button>
        ) : (
          <button onClick={() => onJoin(cls.id, cls.teacherName + " — " + cls.level, cls.teacherName)} style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg, var(--brass), var(--brass-deep))", color: "white", border: "none", boxShadow: hovered ? "0 4px 14px rgba(16,185,129,0.5)" : "0 4px 14px rgba(16,185,129,0.3)" }}>
            {t.cardJoinClass}
          </button>
        )}
        <button onClick={share} style={{ padding: "9px 10px", borderRadius: 10, background: "rgba(244, 235, 220, 0.04)", border: "1px solid var(--creme-hair)", color: "var(--creme-mute)", fontSize: 14, cursor: "pointer" }}>↗</button>
      </div>
    </div>
  );
}

// ─── Center Card ──────────────────────────────────────────────────────────────

function CenterCard({ center, onJoin, faved, onFav, sent, t }: { center: CenterItem; onJoin: (id: string, name: string) => void; faved: boolean; onFav: (id: string) => void; sent?: boolean; t: TT }) {
  const [hovered, setHovered] = useState(false);
  const plan = PLAN_LABEL[center.plan];

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      background: "rgba(244, 235, 220, 0.03)", border: `1px solid ${hovered ? "rgba(234,179,8,0.3)" : "var(--creme-hair)"}`,
      borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 12,
      transform: hovered ? "translateY(-3px)" : "translateY(0)",
      boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.3)" : "none",
      transition: "all var(--dur-move) var(--ease-enter)",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.05))", border: "1px solid rgba(234,179,8,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fbbf24", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
          {center.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 2 }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{center.name}</span>
            {center.verified && <span title="Vérifié" style={{ fontSize: 12 }}>✅</span>}
          </div>
          <div style={{ color: "var(--creme-soft)", fontSize: 13 }}>📍 {center.city}, {center.region} · {center.yearsActive} ans</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <code style={{ fontSize: 11, color: "var(--creme-mute)", letterSpacing: "0.03em" }}>{center.code}</code>
            <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(center.code).catch(() => {}); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 9, opacity: 0.4, lineHeight: 1 }}>📋</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
          <span style={{ background: `${plan.color}20`, color: plan.color, borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 700 }}>{plan.label}</span>
          <button onClick={() => onFav(center.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, opacity: faved ? 1 : 0.3 }}>
            {faved ? "❤️" : "🤍"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[{ v: center.teachers, l: t.cardTeachersLabel }, { v: center.students, l: t.cardStudentsLabel }, { v: center.classes, l: t.cardClassesLabel }].map(s => (
          <div key={s.l} style={{ textAlign: "center", background: "rgba(244, 235, 220, 0.03)", borderRadius: 10, padding: "8px 4px" }}>
            <div style={{ color: "#fbbf24", fontWeight: 800, fontSize: 16 }}>{s.v}</div>
            <div style={{ color: "var(--creme-soft)", fontSize: 13 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4 }}>{center.languages.map(l => <span key={l} style={{ fontSize: 18 }}>{l}</span>)}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ color: "var(--creme-soft)", fontSize: 11 }}>{t.cardSuccessRate}</div>
          <div style={{ background: "var(--brass-glow)", color: "var(--brass)", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>{center.successRate}%</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Link href={`/discover/center/${center.id}`} style={{ flex: 1, textAlign: "center", padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: "none", background: "var(--creme-hair)", border: "1px solid var(--creme-hair)", color: "var(--creme-soft)" }}>
          {t.cardViewClasses}
        </Link>
        {sent ? (
          <button disabled style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "not-allowed", background: "var(--creme-hair)", border: "1px solid var(--creme-hair)", color: "var(--creme-mute)" }}>
            {t.cardRequestSent}
          </button>
        ) : (
          <button onClick={() => onJoin(center.id, center.name)} style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg, #eab308, #ca8a04)", color: "white", border: "none", boxShadow: hovered ? "0 4px 14px rgba(234,179,8,0.4)" : "none" }}>
            {t.cardJoinCenter}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Group Card ───────────────────────────────────────────────────────────────

function GroupCard({ group, onJoin, faved, onFav, sent, t }: { group: GroupItem; onJoin: (id: string, name: string) => void; faved: boolean; onFav: (id: string) => void; sent?: boolean; t: TT }) {
  const [hovered, setHovered] = useState(false);
  const isFull = group.members >= group.max;
  const lc = LEVEL_COLORS[group.level] ?? "var(--brass)";
  const isActive = group.lastActive.includes("min") || group.lastActive.includes("1h") || group.lastActive.includes("2h") || group.lastActive.includes("3h");

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      background: "rgba(244, 235, 220, 0.03)", border: `1px solid ${hovered ? "rgba(99,102,241,0.3)" : "var(--creme-hair)"}`,
      borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 12,
      transform: hovered ? "translateY(-3px)" : "translateY(0)", transition: "all var(--dur-move) var(--ease-enter)",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Av initials={group.creatorAvatar} size={40} color="var(--brass)" />
        <div style={{ flex: 1 }}>
          <div style={{ color: "white", fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{group.name}</div>
          <div style={{ color: "var(--creme-soft)", fontSize: 13 }}>{t.cardGroupBy} {group.creatorName} · 📍 {group.city}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <code style={{ fontSize: 11, color: "var(--creme-mute)", letterSpacing: "0.03em" }}>{group.code}</code>
            <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(group.code).catch(() => {}); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 9, opacity: 0.4, lineHeight: 1 }}>📋</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <LvlBadge level={group.level} />
          <button onClick={() => onFav(group.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, opacity: faved ? 1 : 0.3 }}>{faved ? "❤️" : "🤍"}</button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex" }}>
          {group.memberAvatars.slice(0, 5).map((av, i) => (
            <div key={i} style={{ width: 26, height: 26, borderRadius: "50%", background: `hsl(${i * 60}, 60%, 50%)`, border: "2px solid var(--espresso-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 9, fontWeight: 700, marginLeft: i > 0 ? -8 : 0, zIndex: 5 - i, position: "relative" }}>
              {av}
            </div>
          ))}
          {group.members > 5 && <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--creme-hair)", border: "2px solid var(--espresso-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--creme-mute)", fontSize: 9, marginLeft: -8, zIndex: 0 }}>+{group.members - 5}</div>}
        </div>
        <div style={{ fontSize: 13, color: "var(--creme-soft)" }}>{t.cardMembers(group.members, group.max)}</div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "var(--brass)" : "var(--creme-hair)", display: "inline-block", flexShrink: 0 }} />
          <span style={{ color: "var(--creme-soft)" }}>{group.lastActive}</span>
        </div>
      </div>

      <SpotsBar current={group.members} max={group.max} t={t} />

      <div style={{ fontSize: 13, color: "var(--creme-soft)" }}>
        <div style={{ marginBottom: 4 }}>🎯 <strong style={{ color: "var(--creme)" }}>{group.goal}</strong></div>
        <div>📅 {group.schedule}</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Link href={`/discover/group/${group.id}`} style={{ flex: 1, textAlign: "center", padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: "none", background: "var(--creme-hair)", border: "1px solid var(--creme-hair)", color: "var(--creme-soft)" }}>
          {t.cardGroupActivity}
        </Link>
        {sent ? (
          <button disabled style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "not-allowed", background: "var(--creme-hair)", border: "1px solid var(--creme-hair)", color: "var(--creme-mute)" }}>
            {t.cardRequestSent}
          </button>
        ) : (
          <button onClick={() => !isFull && onJoin(group.id, group.name)} disabled={isFull} style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: isFull ? "default" : "pointer", background: isFull ? "rgba(244, 235, 220, 0.04)" : "linear-gradient(135deg,var(--brass),#4f46e5)", border: isFull ? "1px solid var(--creme-hair)" : "none", color: isFull ? "var(--creme-mute)" : "white", boxShadow: (!isFull && hovered) ? "0 4px 14px rgba(99,102,241,0.4)" : "none" }}>
            {isFull ? t.cardGroupFull : t.cardGroupJoin}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Solo Card (learning partners — coming soon placeholder) ──────────────────

function SoloCard({ student, onInvite, invited, t }: { student: SoloItem; onInvite: (id: string, name: string) => void; invited: boolean; t: TT }) {
  const [hovered, setHovered] = useState(false);
  const lc = LEVEL_COLORS[student.level] ?? "var(--brass)";

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      background: "rgba(244, 235, 220, 0.03)", border: `1px solid ${hovered ? "rgba(245,158,11,0.3)" : "var(--creme-hair)"}`,
      borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 12,
      transform: hovered ? "translateY(-3px)" : "translateY(0)", transition: "all var(--dur-move) var(--ease-enter)",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Av initials={student.avatar} size={44} color="#f59e0b" />
        <div style={{ flex: 1 }}>
          <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{student.name}</div>
          <div style={{ color: "var(--creme-soft)", fontSize: 13 }}>📍 {student.city}</div>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <LvlBadge level={student.level} />
          <span style={{ color: "var(--creme-mute)", fontSize: 11 }}>→</span>
          <LvlBadge level={student.targetLevel} />
        </div>
      </div>

      <p style={{ margin: 0, color: "var(--creme)", fontSize: 13, lineHeight: 1.6, fontStyle: "italic" }}>&ldquo;{student.desc}&rdquo;</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 13, color: "var(--creme-soft)" }}>
        <div>🎯 {student.goal}</div>
        <div>⏰ {student.availability}</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => !invited && onInvite(student.id, student.name)} disabled={invited} style={{
          flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: invited ? "default" : "pointer",
          background: invited ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.15)",
          border: invited ? "1px solid rgba(245,158,11,0.15)" : "1px solid rgba(245,158,11,0.35)",
          color: "#f59e0b", boxShadow: (!invited && hovered) ? "0 4px 14px rgba(245,158,11,0.2)" : "none",
        }}>
          {invited ? t.cardSoloInvited : t.cardSoloInvite}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type TabKey = "all" | "classes" | "centers" | "groups" | "solo";
type SortKey = "relevance" | "active" | "new" | "rating";
const DEFAULT_FILTERS: Filters = { levels: [], cities: [], availability: [], spotsOnly: false, verifiedOnly: false };

export default function DiscoverPage() {
  const pathname = usePathname();
  const locale: Locale = pathname.startsWith("/en") ? "en" : "fr";
  const t = T[locale] as TT;
  const tStates = useTranslations("states");

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabKey>("all");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string; type: "class" | "group" | "center"; teacherName?: string } | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [userLevel, setUserLevel] = useState<string | null>(null);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [centers, setCenters] = useState<CenterItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [solos] = useState<SoloItem[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem("discoverSeen");
    if (!seen) { setShowOnboarding(true); localStorage.setItem("discoverSeen", "1"); }
    const favs = localStorage.getItem("discoverFavs");
    if (favs) setFavorites(new Set(JSON.parse(favs)));

    fetch("/api/me").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.germanLevel) setUserLevel(d.germanLevel);
      if (d?.city) setUserCity(d.city);
    }).catch(() => {});

    fetch("/api/discover")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.success) {
          const apiClasses: ClassItem[] = (d.teachers ?? []).flatMap((teacher: any) =>
            (teacher.classrooms ?? []).map((c: any) => ({
              id: c.id,
              teacherName: teacher.fullName,
              teacherAvatar: (teacher.fullName || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
              verified: false,
              level: c.level,
              city: teacher.city ?? "—",
              center: "",
              students: c.enrollments ?? 0,
              max: c.maxStudents ?? 30,
              schedule: "",
              nextSession: "",
              description: teacher.bio ?? "",
              tags: [],
              rating: 0,
              reviews: 0,
              code: c.code,
              lastActive: "—",
            }))
          );
          const apiCenters: CenterItem[] = (d.centers ?? []).map((c: any) => ({
            id: c.id,
            name: c.centerName ?? c.fullName,
            city: c.centerCity ?? "—",
            region: "",
            avatar: (c.centerName ?? c.fullName ?? "?").slice(0, 2).toUpperCase(),
            verified: false,
            plan: "starter",
            teachers: 0,
            students: 0,
            classes: 0,
            languages: [""],
            code: "",
            successRate: 0,
            yearsActive: 0,
          }));
          setClasses(apiClasses);
          setCenters(apiCenters);
          setGroups(d.groups ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setDiscoverLoading(false));
  }, []);

  const toggleFav = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("discoverFavs", JSON.stringify([...next]));
      return next;
    });
  };

  const matchSearch = (text: string) => !search || text.toLowerCase().includes(search.toLowerCase());

  const filteredClasses = useMemo(() => {
    let r = classes.filter(c =>
      matchSearch(`${c.teacherName} ${c.center} ${c.level} ${c.city} ${c.tags.join(" ")}`) &&
      (filters.levels.length === 0 || filters.levels.includes(c.level)) &&
      (filters.cities.length === 0 || filters.cities.includes(c.city)) &&
      (!filters.spotsOnly || c.students < c.max)
    );
    if (sort === "rating") r = [...r].sort((a, b) => b.rating - a.rating);
    if (sort === "new") r = [...r].sort((a, b) => a.students - b.students);
    if (sort === "active") r = [...r].sort((a, b) => a.lastActive.localeCompare(b.lastActive));
    return r;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes, search, filters, sort]);

  const filteredCenters = useMemo(() => centers.filter(c =>
    matchSearch(`${c.name} ${c.city} ${c.region}`) &&
    (filters.cities.length === 0 || filters.cities.includes(c.city)) &&
    (!filters.verifiedOnly || c.verified)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [centers, search, filters]);

  const filteredGroups = useMemo(() => groups.filter(g =>
    matchSearch(`${g.name} ${g.level} ${g.city} ${g.goal}`) &&
    (filters.levels.length === 0 || filters.levels.includes(g.level)) &&
    (filters.cities.length === 0 || filters.cities.includes(g.city)) &&
    (!filters.spotsOnly || g.members < g.max)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [groups, search, filters]);

  const recommendedIds = useMemo(() => {
    if (!userLevel) return new Set<string>();
    return new Set(classes.filter(c => c.level === userLevel || (userCity && c.city === userCity)).map(c => c.id));
  }, [classes, userLevel, userCity]);

  const totalCount = filteredClasses.length + filteredCenters.length + filteredGroups.length;
  const isEmpty = !discoverLoading && totalCount === 0;

  const openJoin = (id: string, name: string, type: "class" | "group" | "center", teacher?: string) => {
    if (joined.has(id)) return;
    setSelectedItem({ id, name, type, teacherName: teacher });
    setModalOpen(true);
  };

  const accentColor = "var(--brass)";
  const showClasses = tab === "all" || tab === "classes";
  const showCenters = tab === "all" || tab === "centers";
  const showGroups = tab === "all" || tab === "groups";

  const tabs = [
    { key: "all" as TabKey, label: t.tabAll, count: totalCount, disabled: false },
    { key: "classes" as TabKey, label: t.tabClasses, count: filteredClasses.length, disabled: false },
    { key: "centers" as TabKey, label: t.tabCenters, count: filteredCenters.length, disabled: false },
    { key: "groups" as TabKey, label: t.tabGroups, count: filteredGroups.length, disabled: false },
  ];

  return (
    <Layout title={t.layoutTitle}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        .syne { font-family: var(--font-fraunces), Georgia, serif; }
      `}</style>

      {showOnboarding && <OnboardingOverlay onClose={() => setShowOnboarding(false)} t={t} />}

      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,12,16,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--creme-hair)", margin: "-24px -24px 24px", padding: "16px 24px" }}>
        {/* Title + actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <h1 className="syne" style={{ margin: 0, color: "white", fontWeight: 800, fontSize: 20 }}>
              {t.pageTitle}
            </h1>
            <p style={{ margin: "2px 0 0", color: "var(--creme-soft)", fontSize: 13 }}>
              {t.pageSubtitle}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowFilters(f => !f)} style={{ padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", background: showFilters ? "var(--brass-glow)" : "var(--creme-hair)", border: showFilters ? "1px solid rgba(16,185,129,0.3)" : "1px solid var(--creme-hair)", color: showFilters ? accentColor : "var(--creme-soft)" }}>
              {t.filtersBtn}
            </button>
            <button onClick={() => setViewMode(v => v === "list" ? "map" : "list")} style={{ padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "var(--creme-hair)", border: "1px solid var(--creme-hair)", color: "var(--creme-soft)" }}>
              {viewMode === "list" ? t.mapBtnList : t.mapBtnGrid}
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 10 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            style={{ width: "100%", padding: "11px 14px 11px 38px", borderRadius: 12, boxSizing: "border-box", background: "var(--creme-hair)", border: "1px solid var(--creme-hair)", color: "white", fontSize: 16, outline: "none", transition: "border-color var(--dur-move)" }}
            onFocus={e => e.target.style.borderColor = "rgba(16,185,129,0.5)"}
            onBlur={e => e.target.style.borderColor = "var(--creme-hair)"}
          />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.4 }}>🔍</span>
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--creme-mute)", fontSize: 16, cursor: "pointer" }}>×</button>}
        </div>

        {/* Tabs + sort */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {tabs.map(tb => (
              <button key={tb.key} onClick={() => setTab(tb.key)} style={{ padding: "6px 12px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer", background: tab === tb.key ? `${accentColor}18` : "rgba(244, 235, 220, 0.04)", border: tab === tb.key ? `1px solid ${accentColor}40` : "1px solid var(--creme-hair)", color: tab === tb.key ? accentColor : "var(--creme-soft)" }}>
                {tb.label} <span style={{ opacity: 0.7, fontSize: 13 }}>({tb.count})</span>
              </button>
            ))}
            {/* Learning partners — coming soon (non-interactive) */}
            <span style={{ padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: "rgba(244, 235, 220, 0.02)", border: "1px solid var(--creme-hair)", color: "var(--creme-mute)", display: "flex", alignItems: "center", gap: 6 }}>
              {t.tabPartners}
              <span style={{ background: "var(--creme-hair)", color: "var(--creme-mute)", borderRadius: 8, padding: "1px 6px", fontSize: 9, fontWeight: 700 }}>{t.tabPartnersSoon}</span>
            </span>
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)} style={{ padding: "6px 10px", borderRadius: 8, background: "var(--creme-hair)", border: "1px solid var(--creme-hair)", color: "var(--creme-soft)", fontSize: 12, outline: "none", cursor: "pointer" }}>
            <option value="relevance">{t.sortRelevance}</option>
            <option value="active">{t.sortActive}</option>
            <option value="rating">{t.sortRating}</option>
            <option value="new">{t.sortNew}</option>
          </select>
        </div>
      </div>

      {/* Dual search */}
      <DualSearch onJoin={openJoin} t={t} />

      {/* Results count line */}
      <div style={{ marginBottom: 20, color: "var(--creme-soft)", fontSize: 13 }}>
        {t.resultsLabel(totalCount, userLevel, userCity)}
      </div>

      {viewMode === "map" ? (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "220px 1fr", gap: 20 }}>
          <CameroonMap onCityClick={(city) => { setFilters(f => ({ ...f, cities: [city] })); setViewMode("list"); }} t={t} />
          <div style={{ color: "var(--creme-soft)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
            {t.mapClickNote}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexDirection: isMobile && showFilters ? "column" : "row" }}>
          {showFilters && (
            <FilterSidebar filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} count={totalCount} t={t} />
          )}

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 32 }}>

            {/* Positioning intro */}
            <div style={{ background: "rgba(16,185,129,0.04)", border: "1px solid var(--brass-glow)", borderRadius: 14, padding: "16px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>🌍</span>
              <div>
                <div className="syne" style={{ color: "var(--brass)", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t.positionTitle}</div>
                <div style={{ color: "var(--creme-soft)", fontSize: 13, lineHeight: 1.6 }}>{t.positionDesc}</div>
              </div>
            </div>

            {/* Recommended */}
            {recommendedIds.size > 0 && showClasses && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span style={{ color: "#f59e0b", fontSize: 16 }}>⭐</span>
                  <h2 className="syne" style={{ margin: 0, color: "white", fontWeight: 700, fontSize: 16 }}>{t.sectionRecommended}</h2>
                  {userLevel && <span style={{ color: "var(--creme-mute)", fontSize: 13 }}>{t.sectionRecommendedSub(userLevel)}</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
                  {filteredClasses.filter(c => recommendedIds.has(c.id)).map(cls => (
                    <ClassCard key={cls.id} cls={cls} recommended onJoin={(id, name, teacher) => openJoin(id, name, "class", teacher)} faved={favorites.has(cls.id)} onFav={toggleFav} sent={joined.has(cls.id)} t={t} />
                  ))}
                </div>
              </div>
            )}

            {/* Classes */}
            {showClasses && filteredClasses.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 16 }}>👨‍🏫</span>
                  <h2 className="syne" style={{ margin: 0, color: "white", fontWeight: 700, fontSize: 16 }}>{t.sectionClasses}</h2>
                  <span style={{ background: "var(--creme-hair)", color: "var(--creme-mute)", borderRadius: 8, padding: "2px 8px", fontSize: 12 }}>{filteredClasses.length}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
                  {filteredClasses.map(cls => (
                    <ClassCard key={cls.id} cls={cls} recommended={recommendedIds.has(cls.id)} onJoin={(id, name, teacher) => openJoin(id, name, "class", teacher)} faved={favorites.has(cls.id)} onFav={toggleFav} sent={joined.has(cls.id)} t={t} />
                  ))}
                </div>
              </div>
            )}

            {/* Centers */}
            {showCenters && filteredCenters.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 16 }}>🏫</span>
                  <h2 className="syne" style={{ margin: 0, color: "white", fontWeight: 700, fontSize: 16 }}>{t.sectionCenters}</h2>
                  <span style={{ background: "var(--creme-hair)", color: "var(--creme-mute)", borderRadius: 8, padding: "2px 8px", fontSize: 12 }}>{filteredCenters.length}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
                  {filteredCenters.map(center => (
                    <CenterCard key={center.id} center={center} onJoin={(id, name) => openJoin(id, name, "center")} faved={favorites.has(center.id)} onFav={toggleFav} sent={joined.has(center.id)} t={t} />
                  ))}
                </div>
              </div>
            )}

            {/* Groups */}
            {showGroups && filteredGroups.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 16 }}>👥</span>
                    <h2 className="syne" style={{ margin: 0, color: "white", fontWeight: 700, fontSize: 16 }}>{t.sectionGroups}</h2>
                    <span style={{ background: "var(--creme-hair)", color: "var(--creme-mute)", borderRadius: 8, padding: "2px 8px", fontSize: 12 }}>{filteredGroups.length}</span>
                  </div>
                  <Link href="/group/create" style={{ padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: "none", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "var(--brass)" }}>
                    {t.createGroupBtn}
                  </Link>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
                  {filteredGroups.map(group => (
                    <GroupCard key={group.id} group={group} onJoin={(id, name) => openJoin(id, name, "group")} faved={favorites.has(group.id)} onFav={toggleFav} sent={joined.has(group.id)} t={t} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state — StateBlock kind="empty" */}
            {isEmpty && (
              <StateBlock
                kind="empty"
                centered
                soul={tStates("search_none.soul")}
                body={tStates("search_none.body")}
                action={{
                  label: t.emptyCta1,
                  href: "/courses",
                }}
                secondary={{
                  label: t.emptyCta2,
                  onClick: () => { setSearch(""); setFilters(DEFAULT_FILTERS); setTab("all"); },
                }}
              />
            )}

            {/* Community coming soon */}
            <div style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <div className="syne" style={{ color: "#a5b4fc", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{t.communityTitle}</div>
                  <div style={{ color: "var(--creme-soft)", fontSize: 13, lineHeight: 1.6 }}>{t.communityText}</div>
                </div>
                <span style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
                  {t.tabPartnersSoon}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Join modal */}
      {modalOpen && selectedItem && (
        <div onClick={() => setModalOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "linear-gradient(160deg,#0f1a14,var(--espresso))", border: "1px solid var(--brass-edge)", borderRadius: 24, padding: 32 }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--creme-hair)", margin: "0 auto 24px" }} />
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>
              {selectedItem.type === "group" ? t.modalJoinGroup : selectedItem.type === "center" ? t.modalJoinCenter : t.modalJoinClass}
            </h2>
            <p style={{ color: "var(--creme-soft)", fontSize: 13, margin: "0 0 20px" }}>{selectedItem.name}</p>
            <label style={{ color: "var(--creme-soft)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>
              {t.modalMsgLabel}
            </label>
            <textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder={t.modalMsgPlaceholder}
              rows={4}
              style={{ width: "100%", background: "var(--creme-hair)", border: "1px solid var(--creme-hair)", borderRadius: 12, padding: 12, color: "white", fontSize: 16, resize: "none", outline: "none", marginBottom: 20, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={async () => {
                  const item = selectedItem;
                  setSending(true);
                  const action = item.type === "group" ? "request-join-group" : "request-join-class";
                  const bodyKey = item.type === "group" ? "groupId" : "classroomId";
                  try {
                    await fetch("/api/social", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action, [bodyKey]: item.id, message: messageText }),
                    });
                  } catch { /* optimistic */ }
                  setJoined(prev => new Set([...prev, item.id]));
                  setModalOpen(false);
                  setMessageText("");
                  setSending(false);
                }}
                disabled={sending}
                style={{ flex: 1, padding: "14px", borderRadius: 14, background: "linear-gradient(135deg,var(--brass),var(--brass-deep))", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: sending ? 0.7 : 1 }}>
                {sending ? t.modalSending : t.modalSend}
              </button>
              <button onClick={() => setModalOpen(false)} style={{ padding: "14px 20px", borderRadius: 14, background: "var(--creme-hair)", border: "1px solid var(--creme-hair)", color: "var(--creme-soft)", cursor: "pointer", fontSize: 14 }}>
                {t.modalCancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
