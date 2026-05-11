import { useOutletContext } from 'react-router-dom'
import FunctionalismLesson from '../components/FunctionalismLesson.jsx'

export default function FunctionalismPage() {
  const { lessonResetKey, markFlashSeen, functionalismFlashcardsOnly } = useOutletContext()
  return (
    <FunctionalismLesson
      key={lessonResetKey}
      functionalismFlashcards={functionalismFlashcardsOnly}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
