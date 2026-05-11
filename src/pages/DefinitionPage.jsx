import { useOutletContext } from 'react-router-dom'
import DefinitionLesson from '../components/DefinitionLesson.jsx'

export default function DefinitionPage() {
  const { lessonResetKey, markFlashSeen, definitionFlashcardsOnly } = useOutletContext()
  return (
    <DefinitionLesson
      key={lessonResetKey}
      definitionFlashcards={definitionFlashcardsOnly}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
