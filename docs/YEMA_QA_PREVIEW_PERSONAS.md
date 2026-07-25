# YEMA · Console QA Preview et personas

**Infrastructure de test Preview uniquement.** Ce document décrit le mode
QA qui permet au propriétaire de YEMA de tester chaque espace (Super
Admin, Teacher, Racines Coach, Center Admin, Student) sans ressaisir les
identifiants, tout en préservant les permissions réelles de chaque rôle.

Ce n'est PAS une fonctionnalité produit destinée aux utilisateurs finaux.

---

## 1. Preview uniquement · Production interdite

Le mode QA est actif **si et seulement si les 4 conditions suivantes sont
simultanément vraies** (voir `src/lib/qa/config.ts`) ·

1. `process.env.VERCEL_ENV === "preview"` (ou fallback local strict via
   `YEMA_QA_ALLOW_LOCAL=true` uniquement, réservé aux tests locaux avec
   le wrapper P-1) ;
2. `getFlag("QA_MODE_ENABLED") === true` (variable `YEMA_QA_MODE_ENABLED`) ;
3. project ref Supabase courant `= kzzagbojjkivdzzcrmxn` (P-1) ;
4. secrets QA présents et de longueur suffisante
   (`YEMA_QA_SESSION_SECRET` et `YEMA_QA_LINK_SIGNING_SECRET`, ≥ 32 chars).

Si une seule condition manque, TOUTES les routes QA répondent
**HTTP 404** stable avec `{"error":"Not found"}` et la page `/[locale]/qa`
rend `notFound()`. Aucune indication que la feature existe.

**En Production** (`VERCEL_ENV=production` ou hors Vercel), les routes
QA sont 404 quoi qu'il arrive. Aucun bypass possible.

## 2. P-1 uniquement (Supabase `kzzagbojjkivdzzcrmxn`)

Aucune référence Supabase autre que P-1 n'est acceptée. Refs interdites ·
`sbjhvlrkbyjckdxujjsk` (deutschcm PROD), `mamofhrurksyuuolucea`,
`qggwvonfumuimjfsgpdz`. Le wrapper P-1 (`scripts/test-baseline/run-p4-5-b2-p1.mjs`)
verrouille toutes les URLs et JWT à P-1 · le mode QA local n'est
utilisable que sous ce wrapper.

## 3. Mode désactivé par défaut

Toutes les variables `YEMA_QA_*` sont absentes ou `false` par défaut ·
`getFlag` retourne `false` pour `QA_MODE_ENABLED` en l'absence de la
variable, ce qui déclenche `reason: "flag_disabled"` dans le gate.

## 4. Variables d'environnement (server-only, jamais NEXT_PUBLIC_*)

À configurer **uniquement en scope Vercel Preview** (via la stratégie
globale Preview → P-1 déjà en place) ·

```
YEMA_QA_MODE_ENABLED=false          # à activer manuellement pour ouvrir QA
YEMA_QA_ADMIN_EMAIL=<votre-email>   # email QA autorisé · exactement un @
YEMA_QA_SESSION_SECRET=<32+ chars>  # HMAC signature cookie QA
YEMA_QA_LINK_SIGNING_SECRET=<32+ chars>  # HMAC signature lien bootstrap
YEMA_QA_SESSION_TTL_MINUTES=120     # 1..240 min · plafonné à 2h côté cookie
YEMA_QA_ALLOWED_PROJECT_REF=kzzagbojjkivdzzcrmxn  # informationnel
```

Aucune variable QA `NEXT_PUBLIC_*` n'existe · la résolution du gate est
strictement server-side.

## 5. Génération du lien QA (bootstrap)

Le lien est signé HMAC-SHA256, à usage unique, valide **10 minutes
maximum**.

```bash
# En local (via wrapper P-1) ·
node scripts/test-baseline/run-p4-5-b2-p1.mjs --flag on -- \
  YEMA_QA_ADMIN_EMAIL="votre-email@example.com" \
  YEMA_QA_LINK_SIGNING_SECRET="<32+ chars>" \
  YEMA_QA_MODE_ENABLED=true \
  node scripts/qa/generate-preview-qa-link.mjs \
    --host deutschcm-<preview-hash>-yema.vercel.app
```

**Sortie stdout** · uniquement l'URL final
`https://<host>/api/qa/bootstrap?t=<signed-token>`. À copier une fois et à
envoyer via un canal privé. Ne JAMAIS committer ou partager en public.

## 6. Durée de session et cookie

Après consommation du lien bootstrap, un cookie `yema_qa_session` est
posé ·

- `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`
- `Max-Age` plafonné à 7200 s (2 h)
- payload signé HMAC-SHA256 (aucun token Supabase, aucun mot de passe,
  aucune clé, uniquement `qaAdminEmailHash + deploymentHost + projectRef
  + issuedAt + expiresAt + nonce`)
- expiration REVÉRIFIÉE côté serveur à chaque requête (le `Max-Age` du
  cookie n'est PAS suffisant à lui seul).

Le cookie est lié à ·

- l'adresse QA autorisée (via `qaAdminEmailHash`) ;
- le deployment host Preview (empêche la portabilité inter-hosts) ;
- P-1 (projectRef verrouillé).

## 7. Personas

5 personas · référencés par `id` littéral · destinations = routes
RÉELLEMENT présentes dans le repo (auditées avant sélection) ·

| id             | rôle           | destination                        | fixture email                                          |
|----------------|----------------|------------------------------------|--------------------------------------------------------|
| `super_admin`  | YEMA_ADMIN     | `/[locale]/admin`                  | `test_yema_qa_super_admin@example.com`                 |
| `teacher`      | TEACHER        | `/[locale]/teacher`                | `test_yema_qa_teacher@example.com`                     |
| `coach`        | RACINES_COACH  | `/[locale]/coach/racines`          | `test_yema_qa_coach@example.com`                       |
| `center_admin` | CENTER_ADMIN   | `/[locale]/center`                 | `test_yema_qa_center_admin@example.com`                |
| `student`      | STUDENT/LEARNER| `/[locale]/student/assignments`    | `test_yema_qa_student@example.com`                     |

Les fixtures sont créées par
`scripts/test-baseline/yema-qa-fixtures.mjs` (Prisma users + Auth users
Supabase + bindings + Classroom Monde QA + assignment PUBLISHED +
submissions DRAFT/SUBMITTED + feedback PUBLISHED + enrollment actif).

**Si un espace n'existe pas encore dans la roadmap**, la carte affiche ·
« Espace prévu dans la roadmap — non disponible dans cette Preview. » ·
aucune fonctionnalité fictive n'est créée. Pour ce cycle QA-b1, les 5
espaces sont marqués `available: true`.

## 8. Impersonation sécurisée

La route `POST /api/qa/impersonate` accepte un body allowlist stricte ·

```typescript
{ persona: "super_admin" | "teacher" | "coach" | "center_admin" | "student" }
```

**Aucun email, userId, role, projectRef, host ou header d'autorisation
n'est accepté depuis le body.** Le persona est résolu server-side à
partir de son `id` littéral.

Le service_role Supabase (`SUPABASE_SERVICE_ROLE_KEY`) est utilisé
UNIQUEMENT côté serveur pour appeler `admin.auth.admin.generateLink()`.
Le magic link retourné est renvoyé au browser (via `redirectUrl`) et
authentifie le persona, puis redirige vers `/auth/callback?next=<destination>`
qui crée la vraie session Supabase du persona.

Le cookie `yema_qa_session` **survit** (HttpOnly, path=/) · toute
navigation ultérieure retrouve le mode QA pour afficher la bannière et
permettre le retour à la console.

## 9. Permissions réelles préservées (aucun bypass RLS)

**Aucun resolver métier n'a été modifié.** Les resolvers Teacher, Coach,
Center et Student utilisent leurs règles normales · RLS existante,
enrollments Student, bindings Teacher/Coach, feature flags. Verrouillé
par test structurel (`yema-qa-preview-personas.test.ts` · aucun
`import from "@/lib/qa"` ni `isQaModeActive()` dans les resolvers
métier).

La console QA **change uniquement la session** vers un persona autorisé ·
elle ne donne pas un accès universel aux tables. Cela préserve ·

- isolation cross-tenant ;
- permissions par centre ;
- enrollment Student ;
- bindings Teacher et Coach ;
- feature flags métier (`ASSIGNMENTS_ENABLED`, `TEACHER_WORKSPACE_ENABLED`,
  etc. restent indépendants du gate QA).

## 10. Bandeau QA persistant

Composant `QaBanner` (`src/components/qa/QaBanner.tsx`) affiché en haut
de chaque espace impersonné ·

```
MODE QA · P-1 · DONNÉES DE TEST
Persona: <label> · Expire: <ISO> · Deployment: <host> · projectRef: kzzagbojjkivdzzcrmxn
[Changer de rôle] [Quitter le mode QA]
```

- `Changer de rôle` → `/[locale]/qa` (console persona-picker)
- `Quitter le mode QA` → `POST /api/qa/logout` puis redirect `/[locale]/goodbye`

Le bandeau n'affiche jamais un email complet · uniquement le persona et
le hash implicite via cookie server-side.

## 11. Logs QA anonymisés (§13 du brief · fallback log server-only)

Aucune nouvelle AuditAction n'a été ajoutée à l'enum Prisma dans QA-b1.
Les événements QA sont écrits via `qaLog(...)` (`src/lib/qa/log.ts`) qui
utilise `console.info` avec un préfixe fixe `[yema.qa]` et une allowlist
metadata stricte ·

```
persona | sourceRole | targetRole | deploymentHost | projectRef | reasonCode
```

**Interdits (patterns redactés automatiquement)** · JWT, `sb_secret_`,
`sk-*`, `Bearer *`, email fragments (`@domain.tld`).

Actions loggées ·

```
QA_SESSION_STARTED       · bootstrap consommé, cookie posé
QA_IMPERSONATION_STARTED · persona sélectionné, magic link généré
QA_IMPERSONATION_ENDED   · logout / cookie retiré
QA_SESSION_EXPIRED       · cookie expiré au check serveur
QA_ACCESS_DENIED         · gate KO, nonce replay, host mismatch, etc.
```

Les nouvelles AuditActions (`QA_SESSION_STARTED` etc.) pourront être
ajoutées à l'enum Prisma dans une migration additive séparée si le
besoin d'un audit persistant se confirme. Pour ce cycle QA-b1, le log
server-only est suffisant et évite toute mutation Prisma dans les tests
existants.

## 12. Écriture et données de test (scope strict)

Le mode QA peut exécuter les workflows fonctionnels réels (via les
sessions Supabase des personas), mais uniquement sur les données
préfixées `test_yema_qa_` ou `test_p4_5_b_`. Toute mutation ciblant une
ressource non préfixée doit être refusée par les couches métier
existantes (les personas QA n'ont accès qu'aux fixtures QA).

## 13. Limitations documentées

- **Nonce store DB durable (QA-b1 Gate)** · le store des nonces à usage
  unique n'est plus un `Map` process-scoped mais la table Prisma
  `qa_bootstrap_nonces` (migration `20260726000001`). RLS deny explicite
  pour anon + authenticated · seul le chemin serveur trusted
  (service_role) y accède. La consommation se fait via un UPDATE atomique
  conditionnel (`consumedAt IS NULL AND expiresAt > now AND host/emailHash/
  projectRef match`) · deux requêtes concurrentes sur le même lien
  produisent exactement 1 succès + 1 refus, dans une seule requête
  chacune (aucune séquence SELECT-then-UPDATE). Un cold start Preview
  ou une Preview multi-région ne réinitialise plus le store · toutes
  les instances partagent la même source de vérité DB.
- **Cookie QA path=/** · le cookie couvre tout le site · l'utilisateur
  peut naviguer entre espaces sans le perdre. Il n'est retiré que par
  `POST /api/qa/logout` ou expiration.
- **Exchange OTP server-side** · le magic link Supabase n'est jamais
  exposé au navigateur · `admin.generateLink({type:'magiclink'})` est
  appelé côté serveur, le `hashed_token` est passé directement à
  `supabase.auth.verifyOtp()` via le client SSR canonique qui écrit
  les cookies de session dans le cookie store SSR · réponse 303 vers
  la destination du persona (aucun secret dans le JSON, l'URL, ou une
  prop React).
- **Protection CSRF** · les routes `/api/qa/{impersonate,logout}`
  exigent POST + Content-Type `application/json` + header Origin
  correspondant au deployment host normalisé + Sec-Fetch-Site non
  cross-site. Combiné au cookie QA `SameSite=Lax`, les attaques CSRF
  cross-origin sont bloquées.
- **Impact des changements de flags métier** · si un feature flag métier
  (par exemple `ASSIGNMENTS_ENABLED`) est désactivé sur la Preview, les
  personas QA voient les placeholders `feature_disabled` normaux · le
  mode QA ne contourne pas ces gates.
- **Aucun code vidéo P4.8** dans QA.

## 14. Cleanup

Purger toutes les fixtures QA + Auth users QA ·

```bash
node scripts/test-baseline/run-p4-5-b2-p1.mjs --flag off -- \
  node scripts/test-baseline/yema-qa-cleanup.mjs
```

Sortie stable · `YEMA QA BASELINE CLEANED` (residuals DB = 0, auth users
QA supprimés).

## 15. Procédure de révocation

Pour révoquer immédiatement le mode QA sur une Preview ·

1. `YEMA_QA_MODE_ENABLED=false` (via Vercel Dashboard, scope Preview) ·
   toutes les routes QA passent à 404 au prochain requêtage.
2. Rotation des secrets · régénérer `YEMA_QA_SESSION_SECRET` et
   `YEMA_QA_LINK_SIGNING_SECRET` · invalide instantanément tous les
   cookies et liens existants (signature ne validera plus).
3. Cleanup fixtures · `yema-qa-cleanup.mjs` supprime les Auth users QA ·
   toute session résiduelle expire à la déconnexion Supabase.

## 16. Interdiction Production absolue

Le gate refuse `VERCEL_ENV="production"` explicitement · TOUTES les
routes QA renvoient 404 en Production quoi qu'il arrive. Aucun bypass
via query string, cookie fixe, mot de passe codé en dur, clé
`NEXT_PUBLIC_*`, ou règle `YEMA_ADMIN` universelle n'existe.

## 17. Aucun bypass RLS

- Aucune policy Postgres n'a été modifiée pour QA.
- Aucun resolver métier n'a de branche `YEMA_ADMIN → full access`.
- Aucun composant client n'importe `SUPABASE_SERVICE_ROLE_KEY` (verrou
  structurel · voir `yema-qa-preview-personas.test.ts` §"aucun
  service_role dans composants client").
- Toutes les mutations passent par les mêmes services B1/routes serveur
  que les workflows fonctionnels normaux.

## 18. Statut actuel · QA-b1 VALIDATED

Ce document décrit l'implémentation QA-b1 (code + tests structurels + docs).
Reporté à QA-b2 · configuration Vercel Preview des variables QA_*,
génération d'un premier lien bootstrap, smoke test navigateur Playwright
de la console + impersonation réelle des 5 personas.
