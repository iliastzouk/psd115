import { useOutletContext } from 'react-router-dom'
import PsychoanalysisLesson from '../components/PsychoanalysisLesson.jsx'

export default function PsychoanalysisPage() {
  const { lessonResetKey, markFlashSeen, psychoanalysisFlashcardsOnly } = useOutletContext()
  return (
    <PsychoanalysisLesson
      key={lessonResetKey}
      psychoanalysisFlashcards={psychoanalysisFlashcardsOnly}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
