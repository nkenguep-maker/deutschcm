import { notFound } from "next/navigation";
import { LessonCompletePreview } from "./LessonCompletePreview";

// Preview dev-only du composant LessonComplete.
// 404 en production, disponible seulement en dev pour valider le rythme
// et les données mockées. NE JAMAIS relier depuis la navigation prod.

export default function DevLessonCompletePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <LessonCompletePreview />;
}
