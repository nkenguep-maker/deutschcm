import { AbsoluteFill, Series } from "remotion"
import { IntroSlide } from "./IntroSlide"

interface LessonSlideProps {
  title: string
  subtitle: string
  level: string
  manuel: string
  lektion: number
  backgroundColor?: string
  accentColor?: string
}

export const LessonSlide = (props: LessonSlideProps) => {
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence durationInFrames={300}>
          <IntroSlide {...props} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  )
}
