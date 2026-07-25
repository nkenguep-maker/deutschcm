// P4.5-B2b3b-a Gate UI Teacher · badge de statut assignment/submission/
// feedback utilisant les tokens YEMA (brass/creme/oxblood) plutôt que
// des couleurs Tailwind arbitraires. Le libellé est traduit et
// accessibilisé (non communiqué UNIQUEMENT par la couleur · le texte
// porte l'information).

import type { AssignmentStatus, SubmissionStatus, FeedbackStatus } from "@prisma/client";

type AnyStatus =
  | AssignmentStatus
  | SubmissionStatus
  | FeedbackStatus;

interface Props {
  locale: string;
  status: AnyStatus;
}

const LABELS = {
  fr: {
    DRAFT: "Brouillon",
    PUBLISHED: "Publié",
    CLOSED: "Fermé",
    ARCHIVED: "Archivé",
    SUBMITTED: "Envoyé",
    WITHDRAWN: "Retiré",
    SUPERSEDED: "Ancienne version",
    ADDENDUM: "Complément",
    RETRACTED_BY_ADMIN: "Retiré (admin)",
  },
  en: {
    DRAFT: "Draft",
    PUBLISHED: "Published",
    CLOSED: "Closed",
    ARCHIVED: "Archived",
    SUBMITTED: "Submitted",
    WITHDRAWN: "Withdrawn",
    SUPERSEDED: "Previous version",
    ADDENDUM: "Addendum",
    RETRACTED_BY_ADMIN: "Retracted (admin)",
  },
} as const;

/**
 * Retourne un token de couleur YEMA selon le statut. La couleur est
 * complémentaire · le texte porte l'information (a11y).
 */
function colorTokenFor(status: AnyStatus): string {
  switch (status) {
    case "DRAFT":
    case "SUBMITTED":
      return "var(--brass)"; // accent en cours
    case "PUBLISHED":
    case "ADDENDUM":
      return "var(--creme)"; // état actif final
    case "CLOSED":
    case "SUPERSEDED":
    case "ARCHIVED":
    case "WITHDRAWN":
      return "var(--creme-mute)"; // état dim
    case "RETRACTED_BY_ADMIN":
      return "var(--oxblood)"; // attention
    default:
      return "var(--creme-mute)";
  }
}

export default function AssignmentStatusBadge({ locale, status }: Props) {
  const labels = locale === "en" ? LABELS.en : LABELS.fr;
  const label = labels[status] ?? String(status);
  const color = colorTokenFor(status);
  return (
    <span
      className="inline-block text-xs font-medium"
      style={{ color }}
      data-status={status}
    >
      {label}
    </span>
  );
}

export const ASSIGNMENT_STATUS_LABELS = LABELS;
