import { useOutletContext } from 'react-router-dom'
import ClinicalPsychologyLesson from '../components/ClinicalPsychologyLesson.jsx'

export default function ClinicalPsychologyPage() {
  const { lessonResetKey, markFlashSeen, clinicalFlashcardsOnly } = useOutletContext()
  return (
    <ClinicalPsychologyLesson
      key={lessonResetKey}
      clinicalFlashcards={clinicalFlashcardsOnly}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
