"use client";

import { useEffect } from "react";
import { CourseAudioDock } from "@/features/course-experience/CourseAudioDock";
import { LessonExperience } from "@/features/course-experience/LessonExperience";

type Props = Parameters<typeof LessonExperience>[0];

const AUDIO_COPY: Record<string, string> = {
  "L’audio sera ajouté après validation des voix. Le script reste disponible.":
    "Utilise le bouton « Audio allemand » pour écouter le dialogue, ralentir la voix ou répéter chaque réplique.",
  "L’enregistrement audio sera activé avec les voix et le service de prononciation. Pour ce premier import, réalise la mission à voix haute puis confirme-la.":
    "Utilise le panneau « Audio allemand » pour t’enregistrer et te réécouter, puis confirme l’activité ici.",
};

function AudioCopySync({ lessonId }: { lessonId: string }) {
  useEffect(() => {
    const root = document.querySelector(`[data-audio-lesson="${CSS.escape(lessonId)}"]`);
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const replacement = AUDIO_COPY[node.textContent?.trim() ?? ""];
      if (replacement) node.textContent = replacement;
      node = walker.nextNode();
    }
  }, [lessonId]);

  return null;
}

export function AudioLessonExperience(props: Props) {
  return (
    <div data-audio-lesson={props.lesson.id}>
      <AudioCopySync lessonId={props.lesson.id} />
      <CourseAudioDock unit={props.unit} lesson={props.lesson} />
      <LessonExperience {...props} />
    </div>
  );
}
