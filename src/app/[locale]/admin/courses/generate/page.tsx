"use client";
import React, { useState, useRef } from 'react';
import { Sparkles, Database, RefreshCw, FileJson, BookOpen, Headphones, Mic, PenTool, Check, Upload, Download, Video } from 'lucide-react';

const MANUELS = {
  "Netzwerk neu A1": {
    level: "A1",
    lektionen: [
      { num: 1, title: "Guten Tag!", theme: "Salutations et présentations" },
      { num: 2, title: "Meine Familie", theme: "Famille et adjectifs possessifs" },
      { num: 3, title: "Essen und Trinken", theme: "Nourriture et restaurant" },
      { num: 4, title: "Meine Wohnung", theme: "Logement et meubles" },
      { num: 5, title: "Mein Tag", theme: "Routine quotidienne et heure" },
      { num: 6, title: "Freizeit", theme: "Loisirs et sports" },
      { num: 7, title: "Einkaufen", theme: "Shopping et vêtements" },
      { num: 8, title: "Gesundheit", theme: "Corps humain et médecin" },
      { num: 9, title: "Reisen", theme: "Voyages et transports" },
      { num: 10, title: "Arbeit und Beruf", theme: "Métiers et travail" },
      { num: 11, title: "Feste feiern", theme: "Fêtes et invitations" },
      { num: 12, title: "Rückblick", theme: "Révision A1" },
    ]
  },
  "Netzwerk neu A2": {
    level: "A2",
    lektionen: [
      { num: 1, title: "Kennenlernen", theme: "Biographie et rencontres" },
      { num: 2, title: "Wohnen in der Stadt", theme: "Vie urbaine et quartier" },
      { num: 3, title: "Medien und Kommunikation", theme: "Internet et téléphone" },
      { num: 4, title: "Natur und Wetter", theme: "Météo et environnement" },
      { num: 5, title: "Ausbildung und Schule", theme: "École et formation" },
      { num: 6, title: "Gesund leben", theme: "Santé et alimentation" },
      { num: 7, title: "Deutschland entdecken", theme: "Culture et villes allemandes" },
      { num: 8, title: "Menschen und Begegnungen", theme: "Relations et émotions" },
      { num: 9, title: "Arbeit und Alltag", theme: "Travail et administration" },
      { num: 10, title: "Reise und Verkehr", theme: "Réservations et réclamations" },
      { num: 11, title: "Konsum und Werbung", theme: "Consommation et publicité" },
      { num: 12, title: "Fit für A2", theme: "Révision et simulation d'examen CEFR A2" },
    ]
  },
  "Netzwerk neu B1": {
    level: "B1",
    lektionen: [
      { num: 1, title: "Neue Perspektiven", theme: "Changements de vie et projets" },
      { num: 2, title: "Arbeitswelt", theme: "CV et entretien d'embauche" },
      { num: 3, title: "Sprache und Kommunikation", theme: "Apprentissage des langues" },
      { num: 4, title: "Gesellschaft und Politik", theme: "Société et actualités" },
      { num: 5, title: "Kunst und Kultur", theme: "Art et cinéma allemand" },
      { num: 6, title: "Natur und Umwelt", theme: "Écologie et climatologie" },
      { num: 7, title: "Technik und Innovation", theme: "Technologie et industrie" },
      { num: 8, title: "Gesundheit und Wohlbefinden", theme: "Santé mentale et bien-être" },
      { num: 9, title: "Geschichte und Erinnerung", theme: "Histoire allemande" },
      { num: 10, title: "Globalisierung", theme: "Migration et diversité" },
      { num: 11, title: "Zukunft und Träume", theme: "Rêves et vie en Allemagne" },
      { num: 12, title: "Fit für B1", theme: "Simulation d'examen CEFR B1" },
    ]
  },
  "Aspekte neu B2": {
    level: "B2",
    lektionen: [
      { num: 1, title: "Werte und Normen", theme: "Valeurs sociales et débats" },
      { num: 2, title: "Wissenschaft", theme: "Sciences et innovations" },
      { num: 3, title: "Wirtschaft", theme: "Économie et entrepreneuriat" },
      { num: 4, title: "Medien", theme: "Journalisme et fake news" },
      { num: 5, title: "Geschichte", theme: "Histoire contemporaine" },
      { num: 6, title: "Kunst", theme: "Art contemporain et design" },
      { num: 7, title: "Sprache", theme: "Linguistique et dialectes" },
      { num: 8, title: "Umwelt", theme: "Crise climatique" },
      { num: 9, title: "Gesundheit", theme: "Système de santé avancé" },
      { num: 10, title: "Fit für B2", theme: "Simulation d'examen CEFR B2" },
    ]
  },
  "Aspekte neu C1": {
    level: "C1",
    lektionen: [
      { num: 1, title: "Identität", theme: "Identité culturelle" },
      { num: 2, title: "Bildung", theme: "Université allemande" },
      { num: 3, title: "Beruf und Karriere", theme: "Carrière internationale" },
      { num: 4, title: "Philosophie", theme: "Philosophie allemande" },
      { num: 5, title: "Literatur", theme: "Littérature allemande" },
      { num: 6, title: "Globale Herausforderungen", theme: "Défis mondiaux" },
      { num: 7, title: "Wissenschaft und Ethik", theme: "Éthique scientifique et IA" },
      { num: 8, title: "Medien und Gesellschaft", theme: "Médias et démocratie" },
      { num: 9, title: "Deutsch als Weltsprache", theme: "Allemand dans le monde" },
      { num: 10, title: "Fit für C1", theme: "Simulation d'examen CEFR C1" },
    ]
  }
};

const PROGRESS_MESSAGES = [
  "🔍 Analyse du programme CEFR...",
  "📚 Génération du vocabulaire...",
  "✍️ Création des exercices Lesen...",
  "🎧 Préparation des dialogues Hören...",
  "🎙️ Configuration du module Sprechen...",
  "✏️ Génération des exercices Schreiben...",
  "✅ Finalisation du cours..."
];

const SAVED_COURSES = [
  { manuel: "Netzwerk neu A1", lektion: "L1 — Guten Tag!", level: "A1", competences: ["Lesen","Hören","Sprechen","Schreiben"], date: "09/05/2026", status: "publié" },
  { manuel: "Netzwerk neu A1", lektion: "L2 — Meine Familie", level: "A1", competences: ["Lesen","Hören"], date: "09/05/2026", status: "brouillon" },
];

type ManuelKey = keyof typeof MANUELS;
type CompetenceKey = "lesen" | "hoeren" | "sprechen" | "schreiben";

interface SavedCourse {
  manuel: string;
  lektion: string;
  level: string;
  competences: string[];
  date: string;
  status: string;
  courseId?: string;
}

export default function AdminGenerateCourse() {
  const [selectedManuel, setSelectedManuel] = useState<ManuelKey>("Netzwerk neu A1");
  const [selectedLektion, setSelectedLektion] = useState(0);
  const [competences, setCompetences] = useState<Record<CompetenceKey, boolean>>({ lesen: true, hoeren: true, sprechen: true, schreiben: true });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("lesen");
  const [savedCourses, setSavedCourses] = useState<SavedCourse[]>(SAVED_COURSES);
  const [videoUrl, setVideoUrl] = useState("");
  const [publishNow, setPublishNow] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const manuel = MANUELS[selectedManuel];
  const lektion = manuel.lektionen[selectedLektion];

  const toggleCompetence = (key: CompetenceKey) => setCompetences(prev => ({ ...prev, [key]: !prev[key] }));

  const handleGenerate = async () => {
    setLoading(true);
    setProgress(0);
    setGeneratedData(null);

    for (let i = 0; i < PROGRESS_MESSAGES.length; i++) {
      setStatusMsg(PROGRESS_MESSAGES[i]);
      setProgress(Math.round((i / PROGRESS_MESSAGES.length) * 100));
      await new Promise(r => setTimeout(r, 800));
    }

    try {
      const response = await fetch('/api/courses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lektion_number: lektion.num,
          lektion_title: lektion.title,
          level: manuel.level,
          theme: lektion.theme,
          manuel: selectedManuel,
          competences: (Object.entries(competences) as [CompetenceKey, boolean][]).filter(([, v]) => v).map(([k]) => k),
          save_to_db: false
        })
      });

      const result = await response.json();
      setGeneratedData(result.data);
      setProgress(100);
      setStatusMsg("✅ Cours généré avec succès !");
    } catch {
      setStatusMsg("❌ Erreur lors de la génération. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedData) {
      setStatusMsg("⚠️ Générez d'abord un cours avant de sauvegarder.");
      return;
    }
    setStatusMsg("💾 Sauvegarde en base de données...");
    try {
      const resp = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generatedData,
          lektion_number: lektion.num,
          lektion_title: lektion.title,
          level: manuel.level,
          theme: lektion.theme,
          manuel: selectedManuel,
          competences: (Object.entries(competences) as [CompetenceKey, boolean][])
            .filter(([, v]) => v).map(([k]) => k),
          videoUrl: videoUrl.trim() || null,
          isPublished: publishNow,
        }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || "Sauvegarde échouée");
      const newCourse: SavedCourse = {
        manuel: selectedManuel,
        lektion: `L${lektion.num} — ${lektion.title}`,
        level: manuel.level,
        competences: (Object.entries(competences) as [CompetenceKey, boolean][])
          .filter(([, v]) => v).map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)),
        date: new Date().toLocaleDateString("fr-FR"),
        status: publishNow ? "publié" : "brouillon",
        courseId: result.courseId,
      };
      setSavedCourses(prev => [newCourse, ...prev]);
      setStatusMsg(publishNow
        ? "🌐 Cours publié ! Les élèves peuvent y accéder depuis /courses."
        : "✅ Sauvegardé en brouillon. Cliquez sur Publier pour le rendre visible.");
    } catch (e) {
      setStatusMsg("❌ " + (e instanceof Error ? e.message : "Erreur de connexion"));
    }
  };

  const handlePublish = async (courseId: string, idx: number) => {
    try {
      const resp = await fetch("/api/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, isPublished: true }),
      });
      if (!resp.ok) throw new Error();
      setSavedCourses(prev => prev.map((c, i) => i === idx ? { ...c, status: "publié" } : c));
      setStatusMsg("🌐 Cours publié ! Les élèves peuvent y accéder depuis /courses.");
    } catch {
      setStatusMsg("❌ Erreur lors de la publication.");
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(generatedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedManuel.replace(/ /g, '_') + '_L' + lektion.num + '.json';
    a.click();
  };

  const exportForNotebookLM = () => {
    if (!generatedData) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = generatedData as any;
    const lines: string[] = [
      `COURS D'ALLEMAND — ${selectedManuel} — LEKTION ${lektion.num} : ${lektion.title}`,
      `Niveau CECR : ${manuel.level} | Thème : ${lektion.theme}`,
      "=".repeat(70), "",
    ];

    if (d.lektion) {
      lines.push("## VOCABULAIRE (Wortschatz)", "");
      d.lektion.wortschatz?.words?.forEach((w: { article?: string; de: string; fr: string; example?: string }) => {
        lines.push(`• ${w.article ? w.article + " " : ""}${w.de} → ${w.fr}${w.example ? " | Ex: " + w.example : ""}`);
      });
      lines.push("", "## GRAMMAIRE (Grammatik)", "");
      if (d.lektion.grammatik) {
        lines.push(`Point : ${d.lektion.grammatik.point}`, d.lektion.grammatik.explication_fr, "");
        d.lektion.grammatik.exemples?.forEach((e: { de: string; fr: string }) => lines.push(`  ${e.de} → ${e.fr}`));
      }
      lines.push("", "## TEXTE DE LECTURE (Lesetext)", "");
      if (d.lektion.lesetext) {
        lines.push(`Titre : ${d.lektion.lesetext.title}`, "", d.lektion.lesetext.text, "");
        lines.push("Questions de compréhension :");
        d.lektion.lesetext.questions?.forEach((q: { question: string; options: string[]; correct: number }, i: number) => {
          lines.push(`${i + 1}. ${q.question}`, `   Réponse : ${q.options[q.correct]}`);
        });
      }
    }

    if (d.hoeren) {
      lines.push("", "## COMPRÉHENSION ORALE (Hören)", "");
      d.hoeren.dialoge?.forEach((dia: { title: string; context_fr: string; script?: { sprecher: string; text: string }[] }) => {
        lines.push(`Dialogue : ${dia.title}`, `Contexte : ${dia.context_fr}`, "");
        dia.script?.forEach((s: { sprecher: string; text: string }) => lines.push(`${s.sprecher} : ${s.text}`));
        lines.push("");
      });
    }

    if (d.sprechen) {
      lines.push("## EXPRESSION ORALE (Sprechen)", "");
      d.sprechen.uebungen?.forEach((u: { title: string; instruction_fr: string; instruction_de?: string }) => {
        lines.push(`• ${u.title}`, `  ${u.instruction_fr}`, u.instruction_de ? `  (DE) ${u.instruction_de}` : "", "");
      });
    }

    if (d.schreiben) {
      lines.push("## EXPRESSION ÉCRITE (Schreiben)", "");
      d.schreiben.uebungen?.forEach((u: { title: string; instruction_fr: string; musterloesung?: string }) => {
        lines.push(`• ${u.title}`, `  ${u.instruction_fr}`, u.musterloesung ? `  Exemple : ${u.musterloesung}` : "", "");
      });
    }

    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NotebookLM_${selectedManuel.replace(/ /g, "_")}_L${lektion.num}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVideoUpload = async (file: File) => {
    if (!file || !file.type.startsWith("video/")) {
      setStatusMsg("❌ Veuillez sélectionner un fichier vidéo (MP4).");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setUploadDone(false);
    try {
      // 1. Get signed upload URL
      const urlRes = await fetch("/api/upload/video-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      });
      const { signedUrl, token, path, publicUrl, error: urlErr } = await urlRes.json();
      if (urlErr) throw new Error(urlErr);

      // 2. Upload directly to Supabase Storage with progress tracking
      // Upload with progress via XMLHttpRequest
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Erreur réseau"));
        xhr.send(file);
      });

      setVideoUrl(publicUrl);
      setUploadDone(true);
      setStatusMsg("🎬 Vidéo NotebookLM uploadée ! Cliquez sur Sauvegarder.");
    } catch (e) {
      setStatusMsg("❌ " + (e instanceof Error ? e.message : "Erreur upload"));
    } finally {
      setUploading(false);
    }
  };

  const COMP_ICONS: Record<CompetenceKey, React.ReactNode> = {
    lesen: <BookOpen size={14} />,
    hoeren: <Headphones size={14} />,
    sprechen: <Mic size={14} />,
    schreiben: <PenTool size={14} />
  };

  const COMP_LABELS: Record<CompetenceKey, string> = { lesen: "Lesen", hoeren: "Hören", sprechen: "Sprechen", schreiben: "Schreiben" };

  return (
    <div className="min-h-screen text-white p-8" style={{ background: "#080c10", fontFamily: "'DM Mono', monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono&display=swap');`}</style>

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-1" style={{ fontFamily: "'Syne',sans-serif" }}>
            <Sparkles className="text-emerald-400" /> Yema — Générateur de Cours IA
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            Programme aligné CEFR A1–C1
          </p>
        </div>

        {/* Formulaire */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: 28, marginBottom: 24 }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

            {/* Manuel */}
            <div>
              <label style={{ color: "#10b981", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Manuel officiel
              </label>
              <select
                value={selectedManuel}
                onChange={e => { setSelectedManuel(e.target.value as ManuelKey); setSelectedLektion(0); }}
                style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", color: "white", fontSize: 13, outline: "none" }}
              >
                {Object.keys(MANUELS).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Lektion */}
            <div>
              <label style={{ color: "#10b981", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Lektion
              </label>
              <select
                value={selectedLektion}
                onChange={e => setSelectedLektion(Number(e.target.value))}
                style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", color: "white", fontSize: 13, outline: "none" }}
              >
                {manuel.lektionen.map((l, i) => (
                  <option key={i} value={i}>L{l.num} — {l.title}</option>
                ))}
              </select>
            </div>

            {/* Niveau badge */}
            <div className="flex flex-col justify-between gap-3">
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Niveau</span>
                <span style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                  {manuel.level}
                </span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>📖 {lektion.theme}</p>
            </div>
          </div>

          {/* Compétences */}
          <div className="mb-6">
            <label style={{ color: "#10b981", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
              Compétences à générer
            </label>
            <div className="flex gap-3 flex-wrap">
              {(Object.entries(competences) as [CompetenceKey, boolean][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => toggleCompetence(key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                    background: val ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                    border: val ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(255,255,255,0.08)",
                    color: val ? "#10b981" : "rgba(255,255,255,0.4)",
                    cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  {val && <Check size={12} />}
                  {COMP_ICONS[key]}
                  {COMP_LABELS[key]}
                </button>
              ))}
            </div>
          </div>

          {/* Video URL + publish options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label style={{ color: "#10b981", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                🎬 URL vidéo YouTube (optionnel)
              </label>
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", color: "white", fontSize: 13, outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "12px 14px", borderRadius: 12, background: publishNow ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)", border: publishNow ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(255,255,255,0.08)", transition: "all 0.2s" }}>
                <input
                  type="checkbox"
                  checked={publishNow}
                  onChange={e => setPublishNow(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#10b981", cursor: "pointer" }}
                />
                <span style={{ color: publishNow ? "#10b981" : "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600 }}>
                  Publier immédiatement
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>
                  {publishNow ? "Visible par les élèves" : "Brouillon privé"}
                </span>
              </label>
            </div>
          </div>

          {/* Progress bar */}
          {loading && (
            <div className="mb-5">
              <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", width: progress + "%", background: "linear-gradient(90deg,#059669,#10b981)", borderRadius: 99, transition: "width 0.5s ease", boxShadow: "0 0 10px rgba(16,185,129,0.5)" }} />
              </div>
              <p style={{ color: "#10b981", fontSize: 12 }} className="animate-pulse">{statusMsg}</p>
            </div>
          )}

          {!loading && statusMsg && (
            <p style={{ color: "#10b981", fontSize: 12, marginBottom: 12 }}>{statusMsg}</p>
          )}

          {/* Bouton générer */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              background: loading ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg,#10b981,#059669)",
              border: "none", borderRadius: 14, padding: "14px 28px",
              color: "white", fontWeight: 700, fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
              fontFamily: "'Syne',sans-serif"
            }}
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? "Génération en cours..." : "Générer avec notre IA"}
          </button>
        </div>

        {/* Résultat généré */}
        {generatedData && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, padding: 28, marginBottom: 24 }}>

            {/* Actions */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <button onClick={handleSave} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 99, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <Database size={13} /> Sauvegarder en DB
              </button>
              <button onClick={handleGenerate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 99, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <RefreshCw size={13} /> Régénérer
              </button>
              <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 99, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <FileJson size={13} /> Exporter JSON
              </button>
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {[
                { key: "lesen", icon: <BookOpen size={13} />, label: "Lesen" },
                { key: "hoeren", icon: <Headphones size={13} />, label: "Hören" },
                { key: "sprechen", icon: <Mic size={13} />, label: "Sprechen" },
                { key: "schreiben", icon: <PenTool size={13} />, label: "Schreiben" },
                { key: "json", icon: <FileJson size={13} />, label: "JSON brut" },
              ].map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "7px 16px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: activeTab === t.key ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)",
                    border: activeTab === t.key ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.08)",
                    color: activeTab === t.key ? "#10b981" : "rgba(255,255,255,0.4)"
                  }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Contenu onglet */}
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 16, padding: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
              {activeTab === "lesen" && generatedData.lektion && (
                <div>
                  <h3 style={{ color: "#10b981", fontFamily: "'Syne',sans-serif", marginBottom: 12 }}>
                    📖 {generatedData.lektion.title} — {generatedData.lektion.titleDE}
                  </h3>
                  {generatedData.lektion.wortschatz && (
                    <div className="mb-4">
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Vocabulaire ({generatedData.lektion.wortschatz.total_words} mots)
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {generatedData.lektion.wortschatz.words?.slice(0, 6).map((w: { article?: string; de: string; fr: string }, i: number) => (
                          <div key={i} style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 10, padding: "8px 12px" }}>
                            <p style={{ color: "#10b981", fontWeight: 700, fontSize: 13 }}>{w.article ? w.article + " " : ""}{w.de}</p>
                            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{w.fr}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {generatedData.lektion.lesetext && (
                    <div>
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Texte de lecture</p>
                      <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.7, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 12 }}>
                        {generatedData.lektion.lesetext.text}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "hoeren" && generatedData.hoeren && (
                <div>
                  <h3 style={{ color: "#10b981", fontFamily: "'Syne',sans-serif", marginBottom: 12 }}>🎧 Compréhension orale</h3>
                  {generatedData.hoeren.dialoge?.map((d: { title: string; context_fr: string; script?: { sprecher: string; text: string }[] }, i: number) => (
                    <div key={i} style={{ marginBottom: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14 }}>
                      <p style={{ color: "white", fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{d.title}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 10 }}>{d.context_fr}</p>
                      {d.script?.slice(0, 3).map((s, j) => (
                        <div key={j} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                          <span style={{ color: "#10b981", fontSize: 11, fontWeight: 700, minWidth: 50 }}>{s.sprecher}</span>
                          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{s.text}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "sprechen" && generatedData.sprechen && (
                <div>
                  <h3 style={{ color: "#10b981", fontFamily: "'Syne',sans-serif", marginBottom: 12 }}>🎙️ Expression orale</h3>
                  {generatedData.sprechen.uebungen?.map((u: { title: string; instruction_fr: string }, i: number) => (
                    <div key={i} style={{ marginBottom: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14 }}>
                      <p style={{ color: "white", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{u.title}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{u.instruction_fr}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "schreiben" && generatedData.schreiben && (
                <div>
                  <h3 style={{ color: "#10b981", fontFamily: "'Syne',sans-serif", marginBottom: 12 }}>✍️ Expression écrite</h3>
                  {generatedData.schreiben.uebungen?.map((u: { title: string; instruction_fr: string }, i: number) => (
                    <div key={i} style={{ marginBottom: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14 }}>
                      <p style={{ color: "white", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{u.title}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{u.instruction_fr}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "json" && (
                <pre style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, overflow: "auto", maxHeight: 400 }}>
                  {JSON.stringify(generatedData, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* ── Section NotebookLM ── */}
        {generatedData && (
          <div style={{ background: "rgba(66,133,244,0.05)", border: "1px solid rgba(66,133,244,0.2)", borderRadius: 24, padding: 28, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(66,133,244,0.15)", border: "1px solid rgba(66,133,244,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📓</div>
              <div>
                <div style={{ color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>Créer la vidéo avec NotebookLM</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>Google NotebookLM génère une vidéo IA à partir du contenu du cours</div>
              </div>
            </div>

            {/* Étapes */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { step: "1", icon: "📥", label: "Télécharger le script", desc: "Contenu formaté pour NotebookLM (.txt)", action: (
                  <button onClick={exportForNotebookLM} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, padding: "8px 14px", borderRadius: 8, background: "rgba(66,133,244,0.15)", border: "1px solid rgba(66,133,244,0.3)", color: "#60a5fa", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    <Download size={13} /> Télécharger .txt
                  </button>
                )},
                { step: "2", icon: "🎬", label: "Créer sur NotebookLM", desc: "Importez le fichier → Video Overview → Téléchargez le MP4", action: (
                  <a href="https://notebooklm.google.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, padding: "8px 14px", borderRadius: 8, background: "rgba(66,133,244,0.15)", border: "1px solid rgba(66,133,244,0.3)", color: "#60a5fa", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                    <Video size={13} /> Ouvrir NotebookLM ↗
                  </a>
                )},
                { step: "3", icon: "⬆️", label: "Importer la vidéo MP4", desc: "La vidéo sera stockée et intégrée dans le cours", action: null },
              ].map((s) => (
                <div key={s.step} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 14, padding: 16, border: "1px solid rgba(66,133,244,0.1)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(66,133,244,0.2)", border: "1px solid rgba(66,133,244,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#60a5fa", flexShrink: 0 }}>{s.step}</span>
                    <span style={{ fontSize: 16 }}>{s.icon}</span>
                    <span style={{ color: "white", fontWeight: 600, fontSize: 12 }}>{s.label}</span>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>{s.desc}</p>
                  {s.action}
                </div>
              ))}
            </div>

            {/* Zone d'upload vidéo */}
            <input ref={fileInputRef} type="file" accept="video/mp4,video/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f); }} />

            {!uploadDone ? (
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleVideoUpload(f); }}
                style={{
                  border: "2px dashed rgba(66,133,244,0.3)", borderRadius: 14, padding: "28px 20px",
                  textAlign: "center", cursor: uploading ? "default" : "pointer",
                  background: uploading ? "rgba(66,133,244,0.04)" : "rgba(0,0,0,0.2)",
                  transition: "all 0.2s",
                }}
              >
                {uploading ? (
                  <div>
                    <div style={{ color: "#60a5fa", fontSize: 13, marginBottom: 10, fontWeight: 600 }}>
                      ⬆️ Upload en cours... {uploadProgress}%
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", maxWidth: 300, margin: "0 auto" }}>
                      <div style={{ height: "100%", width: uploadProgress + "%", background: "linear-gradient(90deg,#3b82f6,#60a5fa)", borderRadius: 99, transition: "width 0.3s ease" }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={28} style={{ color: "rgba(66,133,244,0.5)", marginBottom: 8 }} />
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                      Glissez votre vidéo MP4 ici ou cliquez pour sélectionner
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>Fichier MP4 exporté depuis NotebookLM · max 500 MB</div>
                  </>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 14 }}>
                <span style={{ fontSize: 28 }}>✅</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#10b981", fontWeight: 700, fontSize: 13, marginBottom: 3 }}>Vidéo uploadée avec succès</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, wordBreak: "break-all" }}>{videoUrl}</div>
                </div>
                <button onClick={() => { setUploadDone(false); setVideoUrl(""); setUploadProgress(0); }} style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, cursor: "pointer", background: "none", border: "none" }}>Remplacer</button>
              </div>
            )}
          </div>
        )}

        {/* Tableau cours sauvegardés */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, padding: 28 }}>
          <h2 style={{ color: "white", fontFamily: "'Syne',sans-serif", fontSize: 18, marginBottom: 16 }}>📋 Cours générés</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {["Manuel", "Lektion", "Niveau", "Compétences", "Date", "Statut", "Actions"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {savedCourses.map((c, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.7)" }}>{c.manuel}</td>
                    <td style={{ padding: "10px 12px", color: "white", fontWeight: 600 }}>{c.lektion}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
                        {c.level}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {c.competences.map(comp => (
                          <span key={comp} style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", borderRadius: 6, padding: "1px 6px", fontSize: 9 }}>{comp}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.4)" }}>{c.date}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        background: c.status === "publié" ? "rgba(16,185,129,0.15)" : "rgba(255,165,0,0.15)",
                        color: c.status === "publié" ? "#10b981" : "#f59e0b",
                        border: c.status === "publié" ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(245,158,11,0.25)",
                        borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700
                      }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        {c.status !== "publié" && c.courseId && (
                          <button
                            onClick={() => handlePublish(c.courseId!, i)}
                            style={{ color: "#10b981", fontSize: 11, cursor: "pointer", background: "none", border: "none", fontWeight: 700 }}
                          >
                            Publier
                          </button>
                        )}
                        <button style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer", background: "none", border: "none" }}>Modifier</button>
                        <button style={{ color: "#ef4444", fontSize: 11, cursor: "pointer", background: "none", border: "none" }}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
