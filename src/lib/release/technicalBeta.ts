import "server-only";

/**
 * Pendant la bêta technique, le contenu réellement prêt peut être ouvert sans
 * créer de faux AccessGrant ni simuler un paiement.
 *
 * Par défaut la bêta est ouverte. Pour revenir au modèle strict AccessGrant,
 * définir YEMA_TECHNICAL_BETA_COURSE_ACCESS=false côté serveur.
 */
export function isTechnicalBetaCourseAccessEnabled(): boolean {
  return process.env.YEMA_TECHNICAL_BETA_COURSE_ACCESS !== "false";
}
