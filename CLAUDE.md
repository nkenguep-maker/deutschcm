@~/.claude/CLAUDE-STANDARDS.md

# deutschcm / Yema Languages

Plateforme d'apprentissage de l'allemand alignée CEFR (A1 → C1), positionnée
comme alternative indépendante aux organismes officiels. Édition YEMA.

**Repo** : github.com/nkenguep-maker/deutschcm
**Supabase** : project `sbjhvlrkbyjckdxujjsk`

## Stack

- Next.js (App Router avec `src/` layout) + TS
- Supabase (auth + DB + progression)
- Prisma pour les modèles user progress
- i18n via `[locale]` segment (EN/FR)
- Vercel

## Règles projet-specific — non-négociables

1. **Compliance CEFR — jamais citer** : Goethe-Institut, TELC, Klett, Netzwerk neu,
   Aspekte neu, TestDaF. Utiliser "official German language exams" génériquement.
   Voir `.claude/memory/project_a1_beta_track.md`.
2. **middleware.ts location** : layout `src/app/` → middleware DOIT être `src/middleware.ts`.
   Root `middleware.ts` = silencieusement ignoré. Voir mémoire globale `lesson_nextjs_src_middleware.md`.
3. **Vercel framework=nextjs** : projet a déjà eu framework=null → NOT_FOUND sur toutes
   les routes. Vérifier au moindre doute. Voir mémoire `lesson_vercel_framework_null.md`.
4. **Fork Desktop obsolète** : `~/Desktop/deutschcm/` est ancien, ne PAS l'utiliser.
   Le projet canonique est `~/deutschcm/`.

## Contenu métier

- A1 Beta Track : 5 leçons × 5 module types = 25 modules
- Grammar guardrail : `src/lib/grammarGuardrail.ts` — client-side check sein/haben
- Locale-aware modules : `src/app/[locale]/courses/[courseId]/modules/[moduleId]/page.tsx`

## Pointeurs

- Rules chargées auto : `~/.claude/rules/nextjs-16-breaking.md`, `supabase-security.md`, `i18n-locale-aware.md`
- Skills utiles : `supabase-schema-seed`, `vercel-deploy-verify`, `env-var-sync`
- Contexte A1 Beta : `.claude/memory/project_a1_beta_track.md`
- Migrations : `supabase/migrations/`, Prisma : `prisma/`

## MCP

- `supabase` — read-only, `sbjhvlrkbyjckdxujjsk`

Config dans `.mcp.json` (gitignored, contient le PAT).
