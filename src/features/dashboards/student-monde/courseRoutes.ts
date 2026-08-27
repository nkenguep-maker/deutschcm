export const OFFICIAL_A1_COURSE_ID = "monde-adulte-de-a1";

type NextModule = {
  courseId: string;
  moduleId: string;
};

export function mondeCourseHref(locale: string): string {
  return `/${locale}/learn/${OFFICIAL_A1_COURSE_ID}`;
}

export function mondeLessonHref(locale: string, nextModule: NextModule): string {
  return `${mondeCourseHref(locale)}/${encodeURIComponent(nextModule.courseId)}/${encodeURIComponent(nextModule.moduleId)}`;
}
