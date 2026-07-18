"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import { useLocale } from "next-intl";
import TeacherLayout from "@/components/TeacherLayout";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
type Level = (typeof LEVELS)[number];

interface Copy {
  title: string;
  back: string;
  eye: string;
  h: string;
  sub: string;
  fldName: [string, string];
  fldLevel: string;
  fldMax: [string, string];
  fldSchedule: [string, string];
  fldDesc: [string, string, string];
  errRequired: string;
  errRange: string;
  previewEye: string;
  cancel: string;
  create: string;
  creating: string;
}

const FR: Copy = {
  title: "Nouvelle classe",
  back: "Retour",
  eye: "Nouvelle classe",
  h: "Ouvrir une classe.",
  sub: "Les apprenant·e·s la rejoindront avec le code d'accès généré après la création.",
  fldName: ["Nom de la classe", "Ex : Groupe A1 Matin 2026"],
  fldLevel: "Niveau CECRL",
  fldMax: ["Capacité max", "20"],
  fldSchedule: ["Horaires", "Ex : Lun · Mer — 18h → 20h"],
  fldDesc: ["Description", "optionnel", "Décris l'objectif de la classe, la méthode pédagogique…"],
  errRequired: "Champ requis.",
  errRange: "Entre 1 et 100.",
  previewEye: "Aperçu",
  cancel: "Annuler",
  create: "Créer la classe",
  creating: "Création…",
};

const EN: Copy = {
  title: "New class",
  back: "Back",
  eye: "New class",
  h: "Open a class.",
  sub: "Learners will join with the access code generated after creation.",
  fldName: ["Class name", "e.g. Morning A1 group 2026"],
  fldLevel: "CEFR level",
  fldMax: ["Max capacity", "20"],
  fldSchedule: ["Schedule", "e.g. Mon · Wed — 6pm → 8pm"],
  fldDesc: ["Description", "optional", "Describe the class goal, the teaching approach…"],
  errRequired: "Required field.",
  errRange: "Between 1 and 100.",
  previewEye: "Preview",
  cancel: "Cancel",
  create: "Create class",
  creating: "Creating…",
};

export default function NewClassroomPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;

  const [form, setForm] = useState<{ name: string; level: Level; maxStudents: string; schedule: string; description: string }>({
    name: "",
    level: "A1",
    maxStudents: "20",
    schedule: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t.errRequired;
    if (!form.schedule.trim()) e.schedule = t.errRequired;
    const max = parseInt(form.maxStudents, 10);
    if (isNaN(max) || max < 1 || max > 100) e.maxStudents = t.errRange;
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    router.push("/teacher/classrooms");
  };

  return (
    <TeacherLayout title={t.title}>
      <section className="subpage" style={{ maxWidth: 640 }}>
        <header className="subpage-head">
          <div>
            <p className="subpage-eye">{t.eye}</p>
            <h2 className="subpage-h">{t.h}</h2>
            <p className="subpage-sub">{t.sub}</p>
          </div>
          <button type="button" className="subpage-cta ghost" onClick={() => router.back()}>
            ← {t.back}
          </button>
        </header>

        <form onSubmit={handleSubmit} style={{
          background: "var(--espresso-2)",
          border: "1px solid var(--creme-hair)",
          borderRadius: 14,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}>
          <div className="modal-field">
            <label htmlFor="cls-name" className="modal-lbl">{t.fldName[0]}</label>
            <input
              id="cls-name"
              className="modal-input"
              placeholder={t.fldName[1]}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              style={errors.name ? { borderColor: "var(--oxblood)" } : undefined}
            />
            {errors.name && <span style={{ color: "var(--oxblood)", fontSize: 12, marginTop: 4 }}>{errors.name}</span>}
          </div>

          <div className="modal-field">
            <span className="modal-lbl">{t.fldLevel}</span>
            <div className="subpage-filters" role="radiogroup" aria-label={t.fldLevel}>
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  role="radio"
                  aria-checked={form.level === lvl}
                  className={`subpage-filter ${form.level === lvl ? "on" : ""}`}
                  onClick={() => setForm((f) => ({ ...f, level: lvl }))}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
            <div className="modal-field">
              <label htmlFor="cls-max" className="modal-lbl">{t.fldMax[0]}</label>
              <input
                id="cls-max"
                type="number"
                min="1"
                max="100"
                className="modal-input"
                placeholder={t.fldMax[1]}
                value={form.maxStudents}
                onChange={(e) => setForm((f) => ({ ...f, maxStudents: e.target.value }))}
                style={errors.maxStudents ? { borderColor: "var(--oxblood)" } : undefined}
              />
              {errors.maxStudents && <span style={{ color: "var(--oxblood)", fontSize: 12, marginTop: 4 }}>{errors.maxStudents}</span>}
            </div>
            <div className="modal-field">
              <label htmlFor="cls-schedule" className="modal-lbl">{t.fldSchedule[0]}</label>
              <input
                id="cls-schedule"
                className="modal-input"
                placeholder={t.fldSchedule[1]}
                value={form.schedule}
                onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
                style={errors.schedule ? { borderColor: "var(--oxblood)" } : undefined}
              />
              {errors.schedule && <span style={{ color: "var(--oxblood)", fontSize: 12, marginTop: 4 }}>{errors.schedule}</span>}
            </div>
          </div>

          <div className="modal-field">
            <label htmlFor="cls-desc" className="modal-lbl">
              {t.fldDesc[0]} <span style={{ opacity: 0.7 }}>({t.fldDesc[1]})</span>
            </label>
            <textarea
              id="cls-desc"
              rows={3}
              className="modal-textarea"
              placeholder={t.fldDesc[2]}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {form.name && (
            <div style={{
              padding: "14px 18px",
              borderRadius: 12,
              background: "var(--brass-glow)",
              border: "1px solid var(--brass-edge)",
            }}>
              <p className="subpage-eye" style={{ margin: 0 }}>{t.previewEye}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                <span className="status-pill active">{form.level}</span>
                <span style={{
                  fontFamily: "var(--font-fraunces), Georgia, serif",
                  fontSize: 17,
                  color: "var(--creme)",
                }}>{form.name}</span>
              </div>
              {form.schedule && (
                <p style={{
                  color: "var(--creme-mute)",
                  fontSize: 12,
                  fontFamily: "var(--font-jetbrains, monospace)",
                  letterSpacing: "0.04em",
                  margin: "8px 0 0",
                }}>
                  {form.schedule} · {form.maxStudents} max
                </p>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="subpage-cta ghost" onClick={() => router.back()}>
              {t.cancel}
            </button>
            <button type="submit" className="subpage-cta" disabled={loading}>
              {loading ? t.creating : t.create}
            </button>
          </div>
        </form>
      </section>
    </TeacherLayout>
  );
}
