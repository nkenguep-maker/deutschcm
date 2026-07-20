// typo.ts — helpers micro-typographie (§1.11 doctrine).
// Espaces insécables + guillemets par langue.

const NBSP = " ";        // no-break space (U+00A0)
const NNBSP = " ";       // narrow no-break (U+202F) — pour :;!?

/** Applique les règles françaises · espace fine insécable avant :;!?%€°
 *  + apostrophe typographique ’ + points de suspension … + guillemets « ».
 *  Passé par tous les composants publics via t(s). */
export function frTypo(input: string): string {
  return input
    .replace(/ ([:;!?%€°])/g, `${NNBSP}$1`)
    .replace(/« ?/g, `«${NBSP}`)
    .replace(/ ?»/g, `${NBSP}»`)
    .replace(/'/g, "’")
    .replace(/\.\.\./g, "…");
}

/** Rend la copy interpolable avec guillemets par langue. */
export function quotes(locale: string, text: string): string {
  if (locale === "de") return `„${text}"`;
  if (locale === "en") return `"${text}"`;
  return `«${NBSP}${text}${NBSP}»`;
}

export { NBSP, NNBSP };
