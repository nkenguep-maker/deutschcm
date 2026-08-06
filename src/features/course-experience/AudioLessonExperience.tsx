"use client";

import { CourseAudioDock } from "@/features/course-experience/CourseAudioDock";
import { LessonExperience } from "@/features/course-experience/LessonExperience";

type Props = Parameters<typeof LessonExperience>[0];

export function AudioLessonExperience(props: Props) {
  return (
    <>
      <CourseAudioDock unit={props.unit} lesson={props.lesson} />
      <LessonExperience {...props} />
    </>
  );
}
