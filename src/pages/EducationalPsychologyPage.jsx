import { useOutletContext } from 'react-router-dom'
import EducationalPsychologyLesson from '../components/EducationalPsychologyLesson.jsx'

export default function EducationalPsychologyPage() {
  const { lessonResetKey, markFlashSeen, educationalPsychologyFlashcardsOnly } = useOutletContext()
  return (
    <EducationalPsychologyLesson
      key={lessonResetKey}
      educationalPsychologyFlashcards={educationalPsychologyFlashcardsOnly}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
