// requireSession · guard SSR pour les pages authentifiées.
//
// Le proxy (src/proxy.ts) bloque déjà les anon sur /onboarding, mais il
// se base sur la présence d'un cookie sb-*-auth-token. Un cookie corrompu,
// une session révoquée côté Supabase ou une session expirée passeront le
// filtre proxy pour être rejetés seulement à l'appel API suivant (401).
//
// Ce guard fait le vrai check : getUser() côté serveur. Si null → redirect
// vers /login?next=... AVANT que la page ne rende quoi que ce soit. Zéro
// flash, zéro formulaire à remplir pour rien.

import { redirect } from "@/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export interface SessionGuardParams {
  locale: string;
  /** Chemin nu (pas préfixé par la locale) vers lequel l'user reviendra
   *  après reconnexion. Doit commencer par "/" — ex. "/onboarding/monde". */
  returnTo: string;
}

/** Vérifie la session côté serveur. Redirige vers /login si absente/invalide.
 *  Retourne l'objet User Supabase si tout va bien. */
export async function requireSession({ locale, returnTo }: SessionGuardParams): Promise<User> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // On préserve la locale ET le chemin nu de retour pour que /login
    // pousse l'user vers /{locale}{returnTo} après reconnexion.
    redirect({
      href: { pathname: "/login", query: { next: `/${locale}${returnTo}` } },
      locale,
    });
    // redirect() throw — inaccessible, mais TS ne le sait pas.
    throw new Error("unreachable");
  }
  return user;
}
