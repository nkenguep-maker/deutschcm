"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import TeacherLayout from "@/components/TeacherLayout";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const LEVEL_COLORS: Record<string, string> = { A1: "#10b981", A2: "#14b8a6", B1: "#3b82f6", B2: "#8b5cf6", C1: "#f97316" };

export default function NewClassroomPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", level: "A1", maxStudents: "20", schedule: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nom requis";
    if (!form.schedule.trim()) e.schedule = "Horaires requis";
    if (parseInt(form.maxStudents) < 1 || parseInt(form.maxStudents) > 100) e.maxStudents = "Entre 1 et 100";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    router.push("/teacher/classrooms");
  }

  const lc = LEVEL_COLORS[form.level] ?? "#10b981";

  return (
    <TeacherLayout title="Nouvelle classe">
      <div style={{ maxWidth: 560 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button
            onClick={() => router.back()}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "7px 14px", color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer" }}
          >← Retour</button>
          <div>
            <h1 style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.2rem" }}>Créer une classe</h1>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>Les élèves pourront la rejoindre via un code</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Nom */}
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Nom de la classe *
            </label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Groupe A1 Matin 2026"
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14,
                background: "rgba(255,255,255,0.04)", border: `1px solid ${errors.name ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                color: "white", outline: "none", boxSizing: "border-box",
              }}
            />
            {errors.name && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{errors.name}</span>}
          </div>

          {/* Niveau */}
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              Niveau CECR *
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {LEVELS.map(lvl => (
                <button
                  key={lvl} type="button"
                  onClick={() => setForm(f => ({ ...f, level: lvl }))}
                  style={{
                    padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                    background: form.level === lvl ? `${LEVEL_COLORS[lvl]}22` : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${form.level === lvl ? LEVEL_COLORS[lvl] : "rgba(255,255,255,0.1)"}`,
                    color: form.level === lvl ? LEVEL_COLORS[lvl] : "rgba(255,255,255,0.5)",
                    transition: "all 0.15s",
                  }}
                >{lvl}</button>
              ))}
            </div>
          </div>

          {/* Max students + schedule */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                Max. élèves *
              </label>
              <input
                type="number" min="1" max="100"
                value={form.maxStudents}
                onChange={e => setForm(f => ({ ...f, maxStudents: e.target.value }))}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14,
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${errors.maxStudents ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                  color: "white", outline: "none", boxSizing: "border-box",
                }}
              />
              {errors.maxStudents && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{errors.maxStudents}</span>}
            </div>
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                Horaires *
              </label>
              <input
                value={form.schedule}
                onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))}
                placeholder="Ex: Lun · Mer 18h–20h"
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14,
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${errors.schedule ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                  color: "white", outline: "none", boxSizing: "border-box",
                }}
              />
              {errors.schedule && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{errors.schedule}</span>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Description <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>(optionnel)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Décrivez l'objectif de la classe, la méthode pédagogique..."
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                color: "white", outline: "none", resize: "vertical", boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Preview */}
          {form.name && (
            <div style={{
              padding: "16px 18px", borderRadius: 14,
              background: `${lc}08`, border: `1px solid ${lc}30`,
            }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 8 }}>Aperçu</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ background: `${lc}20`, color: lc, border: `1px solid ${lc}40`, borderRadius: 7, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>{form.level}</span>
                <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{form.name}</span>
              </div>
              {form.schedule && <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 6 }}>📅 {form.schedule} · {form.maxStudents} élèves max</div>}
            </div>
          )}

          {/* Submit */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{ flex: 1, padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
            >Annuler</button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2, padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                background: loading ? "rgba(16,185,129,0.4)" : "linear-gradient(135deg, #10b981, #059669)",
                color: "white", border: "none", boxShadow: loading ? "none" : "0 4px 16px rgba(16,185,129,0.3)",
                fontFamily: "'Syne', sans-serif",
              }}
            >{loading ? "Création…" : "✅ Créer la classe"}</button>
          </div>
        </form>
      </div>
    </TeacherLayout>
  );
}
