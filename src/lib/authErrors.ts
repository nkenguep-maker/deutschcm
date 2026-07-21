// Parseur unifié des erreurs auth (Supabase + réseau + timeout).
// Retourne une clé i18n stable (auth.errors.<key>) que le composant
// affiche via useTranslations. Un seul point de vérité pour toutes
// les variations de messages Supabase — on ne joue pas au ping-pong
// avec les libellés qui évoluent d'une version à l'autre du SDK.

export type AuthErrorKey =
  | "invalid_credentials"     // email/mot de passe incorrect
  | "email_not_confirmed"     // compte créé mais e-mail pas validé
  | "already_exists"          // signup avec un compte déjà pris
  | "invalid_email"           // format e-mail invalide
  | "invalid_phone"           // format téléphone invalide
  | "weak_password"           // mot de passe trop court / faible
  | "rate_limited"            // trop de tentatives
  | "network"                 // fetch a échoué, offline, DNS, etc.
  | "timeout"                 // dépasse le timeout que nous imposons
  | "session_expired"         // 401 pendant un flux authentifié (session invalidée)
  | "generic";                // rien d'identifiable

/** Erreur qui porte une clé structurée. Utilisée pour le timeout et
 *  les throws internes (afin de garder un seul chemin de catch). */
export class AuthOpError extends Error {
  readonly key: AuthErrorKey;
  constructor(key: AuthErrorKey, message?: string) {
    super(message ?? key);
    this.key = key;
  }
}

/** Wrappe une promesse Supabase avec un timeout. Rejette avec AuthOpError('timeout')
 *  au-delà de `ms` millisecondes — la promesse d'origine peut continuer côté SDK
 *  mais l'UI reprend la main. */
export function withTimeout<T>(promise: Promise<T>, ms = 15_000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const to = setTimeout(() => reject(new AuthOpError("timeout")), ms);
    promise.then(
      (v) => { clearTimeout(to); resolve(v); },
      (e) => { clearTimeout(to); reject(e); },
    );
  });
}

/** Parseur : tout ce qui peut sortir d'un appel auth → une clé i18n.
 *  Accepte :
 *    · un signInError / signUpError Supabase (a `message`, souvent `status`, `code`)
 *    · une AuthOpError (déjà classifiée — passe direct)
 *    · une Error générique (network, timeout system, exception JS)
 *    · un string libre
 *    · null / undefined → generic (ne devrait pas arriver côté caller propre)
 *
 *  On ne parie PAS sur `error.code` : les codes Supabase varient entre versions
 *  (2.x → 3.x). On matche sur `message.toLowerCase()` avec des motifs stables,
 *  et on tolère les évolutions futures via le fallback "generic". */
export function classifyAuthError(input: unknown): AuthErrorKey {
  if (input == null) return "generic";

  // Déjà classifié (notre timeout, ou un throw interne)
  if (input instanceof AuthOpError) return input.key;

  // Extrait un message + un status + un code depuis les formes courantes
  const anyErr = input as { message?: unknown; status?: unknown; code?: unknown; name?: unknown };
  const rawMsg =
    typeof anyErr.message === "string" ? anyErr.message :
    typeof input === "string" ? input :
    "";
  const msg = rawMsg.toLowerCase();
  const status = typeof anyErr.status === "number" ? anyErr.status : undefined;
  const code = typeof anyErr.code === "string" ? anyErr.code.toLowerCase() : "";
  const name = typeof anyErr.name === "string" ? anyErr.name.toLowerCase() : "";

  // Réseau : fetch API, DNS, offline, aborted
  //   TypeError: Failed to fetch  · TypeError: Network request failed
  //   AbortError  ·  ERR_INTERNET_DISCONNECTED  ·  ENOTFOUND  ·  ECONNREFUSED
  if (
    name === "typeerror" && (msg.includes("fetch") || msg.includes("network")) ||
    name === "aborterror" ||
    msg.includes("failed to fetch") ||
    msg.includes("network request failed") ||
    msg.includes("networkerror") ||
    msg.includes("network error") ||
    msg.includes("err_internet_disconnected") ||
    msg.includes("enotfound") ||
    msg.includes("econnrefused") ||
    msg.includes("econnreset") ||
    code === "network_error"
  ) {
    return "network";
  }

  // Trop de tentatives (Supabase renvoie 429, message varie)
  if (status === 429 || msg.includes("rate limit") || msg.includes("too many requests")) {
    return "rate_limited";
  }

  // E-mail non confirmé — message Supabase stable : "Email not confirmed"
  // Aussi "email_not_confirmed" côté code plus récent, ou message contenant "confirm"
  if (
    code === "email_not_confirmed" ||
    msg.includes("email not confirmed") ||
    msg.includes("not confirmed") ||
    (msg.includes("email") && msg.includes("confirm"))
  ) {
    return "email_not_confirmed";
  }

  // Identifiants invalides — Supabase renvoie "Invalid login credentials"
  // pour BOTH bad password AND unknown email (pas de leak d'info). On garde
  // ça — c'est la doctrine sécurité.
  if (
    code === "invalid_credentials" ||
    msg.includes("invalid login credentials") ||
    msg.includes("invalid credentials") ||
    (status === 400 && msg.includes("invalid"))
  ) {
    return "invalid_credentials";
  }

  // Signup : compte déjà pris
  if (
    code === "user_already_exists" ||
    msg.includes("already registered") ||
    msg.includes("already exists") ||
    msg.includes("user already") ||
    msg.includes("already been registered")
  ) {
    return "already_exists";
  }

  // Formats invalides
  if (msg.includes("email") && (msg.includes("invalid") || msg.includes("valid"))) {
    return "invalid_email";
  }
  if (msg.includes("phone") && (msg.includes("invalid") || msg.includes("valid"))) {
    return "invalid_phone";
  }

  // Mot de passe faible
  if (
    code === "weak_password" ||
    msg.includes("password should be") ||
    msg.includes("password is too") ||
    msg.includes("weak password") ||
    (msg.includes("password") && msg.includes("character"))
  ) {
    return "weak_password";
  }

  return "generic";
}
