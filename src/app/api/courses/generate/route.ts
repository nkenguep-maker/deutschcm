import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { DifficultyLevel, ModuleType } from "@prisma/client";

// ── Auth helper ────────────────────────────────────────────────────────────────

async function getAdminUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, role: true },
  });
  const allowed = ["ADMIN", "TEACHER", "CENTER_MANAGER"];
  if (!dbUser || !allowed.includes(dbUser.role)) return null;
  return dbUser;
}

// ── Prompt builder ─────────────────────────────────────────────────────────────

function buildPrompt(
  level: string,
  lektionNumber: number,
  lektionTitle: string,
  theme: string,
  manuel: string,
  competences: string[]
): string {
  const sections: string[] = [];

  if (competences.includes("lesen")) {
    sections.push(`
"lektion": {
  "title": "string (titre en français)",
  "titleDE": "string (titre en allemand)",
  "wortschatz": {
    "total_words": number,
    "words": [
      { "de": "string", "article": "string|null (der/die/das ou null si pas un nom)", "fr": "string", "example": "string (phrase exemple en allemand)", "example_fr": "string" }
      // 20 mots minimum liés au thème
    ]
  },
  "grammatik": {
    "point": "string (point grammatical principal de cette lektion)",
    "explication_fr": "string (2-3 phrases)",
    "exemples": [{ "de": "string", "fr": "string" }]
  },
  "lesetext": {
    "title": "string",
    "text": "string (texte authentique en allemand, 120-180 mots, niveau ${level})",
    "questions": [
      { "question": "string", "options": ["string","string","string","string"], "correct": number }
    ]
  }
}`);
  }

  if (competences.includes("hoeren")) {
    sections.push(`
"hoeren": {
  "dialoge": [
    {
      "title": "string",
      "context_fr": "string (contexte en français)",
      "duration_seconds": number,
      "script": [
        { "sprecher": "string (prénom)", "text": "string (réplique en allemand)" }
      ],
      "aufgaben": [
        { "instruction_fr": "string", "question": "string", "options": ["string","string","string"], "correct": number }
      ]
    }
  ],
  "phonetik": {
    "focus": "string (règle phonétique à travailler pour ce niveau)",
    "exemples": [{ "mot": "string", "prononciation": "string (API simplifié)" }]
  }
}`);
  }

  if (competences.includes("sprechen")) {
    sections.push(`
"sprechen": {
  "uebungen": [
    {
      "title": "string",
      "type": "string (paararbeit|monolog|dialog|rollenspiel)",
      "instruction_fr": "string",
      "instruction_de": "string",
      "aide_vocabulaire": ["string"],
      "ai_correction_criteria": {
        "grammaire": ["string (points à vérifier)"],
        "vocabulaire": ["string (mots attendus)"],
        "pronunciation_tips": ["string"]
      }
    }
  ],
  "ai_correction_system": {
    "prompt_template": "string (prompt système à utiliser pour corriger les réponses orales de l'élève — en français)",
    "scoring_criteria": { "grammaire": number, "vocabulaire": number, "fluidite": number, "pertinence": number }
  }
}`);
  }

  if (competences.includes("schreiben")) {
    sections.push(`
"schreiben": {
  "uebungen": [
    {
      "title": "string",
      "type": "string (email|formulaire|texte_libre|carte_postale|message)",
      "instruction_fr": "string",
      "instruction_de": "string",
      "min_words": number,
      "max_words": number,
      "schreibtipps": ["string (conseil de rédaction en français)"],
      "musterloesung": "string (exemple de réponse modèle en allemand)",
      "ai_correction_criteria": {
        "points_verifies": ["string"],
        "erreurs_communes": ["string"]
      }
    }
  ],
  "schreibtipps": ["string (conseils généraux pour la compétence écrite à ce niveau)"]
}`);
  }

  return `Tu es un expert en didactique de l'allemand langue étrangère (DaF), spécialisé dans le programme Goethe-Institut.

Génère le contenu pédagogique complet pour la lektion suivante, en JSON strict et sans texte autour.

Contexte :
- Manuel : ${manuel}
- Lektion ${lektionNumber} : ${lektionTitle}
- Thème : ${theme}
- Niveau CECR : ${level}
- Compétences à générer : ${competences.join(", ")}

Format JSON attendu (objet racine avec exactement ces clés) :
{
${sections.join(",\n")}
}

Règles absolues :
- Répondre UNIQUEMENT avec le JSON, zéro texte autour
- Le contenu doit être authentiquement pédagogique, adapté au niveau ${level}
- Les textes allemands doivent être idiomatiques et naturels
- Les explications et instructions pour l'élève sont en français
- Respecter strictement le format : pas de champs supplémentaires ni manquants`;
}

// ── Gemini caller with retry ───────────────────────────────────────────────────

async function callGemini(prompt: string, retries = 3): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8000,
              responseMimeType: "application/json",
            },
          }),
          signal: AbortSignal.timeout(60000),
        }
      );

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Gemini HTTP ${res.status}: ${errBody.slice(0, 200)}`);
      }

      const raw = await res.json();
      const text: string = raw.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return JSON.parse(cleaned);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1500 * attempt));
      }
    }
  }

  throw lastError;
}

// ── Module type mapping ────────────────────────────────────────────────────────

function moduleTypeFor(competence: string): ModuleType {
  if (competence === "sprechen") return ModuleType.CONVERSATION;
  return ModuleType.LESSON;
}

// ── POST handler ───────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden — ADMIN only" }, { status: 403 });

  const body = await request.json();
  const {
    lektion_number,
    lektion_title,
    level,
    theme,
    manuel,
    competences,
    save_to_db,
  }: {
    lektion_number: number;
    lektion_title: string;
    level: string;
    theme: string;
    manuel: string;
    competences: string[];
    save_to_db: boolean;
  } = body;

  if (!lektion_number || !lektion_title || !level || !theme || !manuel || !Array.isArray(competences) || competences.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validLevel = Object.values(DifficultyLevel).includes(level as DifficultyLevel);
  if (!validLevel) {
    return NextResponse.json({ error: `Invalid level: ${level}. Must be one of ${Object.values(DifficultyLevel).join(", ")}` }, { status: 400 });
  }

  // ── Generate content ───────────────────────────────────────────────────────

  const prompt = buildPrompt(level, lektion_number, lektion_title, theme, manuel, competences);
  let generatedData: Record<string, unknown>;

  try {
    generatedData = await callGemini(prompt) as Record<string, unknown>;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Gemini generation failed: ${msg}` }, { status: 502 });
  }

  // ── Save to DB (optional) ──────────────────────────────────────────────────

  const moduleIds: string[] = [];

  if (save_to_db) {
    // Find or create the Course for this manuel + level
    let course = await prisma.course.findFirst({
      where: { title: manuel, level: level as DifficultyLevel },
    });

    if (!course) {
      course = await prisma.course.create({
        data: {
          title: manuel,
          description: `Cours basé sur ${manuel} — niveau ${level}`,
          level: level as DifficultyLevel,
          isPublished: false,
          isFree: false,
          tags: [level, "Goethe", manuel.split(" ")[0]],
          sortOrder: lektion_number,
        },
      });
    }

    // Create one module per competence
    for (const comp of competences) {
      const compData = generatedData[comp === "lesen" ? "lektion" : comp] ?? null;

      const module = await prisma.module.create({
        data: {
          courseId: course.id,
          title: `L${lektion_number} — ${lektion_title} (${comp.charAt(0).toUpperCase() + comp.slice(1)})`,
          description: theme,
          type: moduleTypeFor(comp),
          content: compData as object,
          sortOrder: lektion_number,
          isPublished: false,
          xpReward: 50,
        },
      });

      // If lesen content includes quiz questions, create a QUIZ module too
      if (comp === "lesen") {
        const lektion = generatedData.lektion as Record<string, unknown> | undefined;
        const lesetext = lektion?.lesetext as Record<string, unknown> | undefined;
        const questions = lesetext?.questions as unknown[] | undefined;
        if (Array.isArray(questions) && questions.length > 0) {
          const quizModule = await prisma.module.create({
            data: {
              courseId: course.id,
              title: `L${lektion_number} — ${lektion_title} (Quiz Lesen)`,
              description: `Quiz de compréhension écrite — ${theme}`,
              type: ModuleType.QUIZ,
              content: { questions } as object,
              sortOrder: lektion_number,
              isPublished: false,
              xpReward: 30,
            },
          });
          moduleIds.push(quizModule.id);
        }
      }

      moduleIds.push(module.id);
    }
  }

  return NextResponse.json({
    success: true,
    data: generatedData,
    moduleIds,
    saved: save_to_db,
  });
}
