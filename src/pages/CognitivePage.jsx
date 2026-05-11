import { useOutletContext } from 'react-router-dom'
import CognitiveLesson from '../components/CognitiveLesson.jsx'

export default function CognitivePage() {
  const { lessonResetKey, markFlashSeen, cognitiveFlashcardsOnly } = useOutletContext()
  return (
    <CognitiveLesson
      key={lessonResetKey}
      cognitiveFlashcards={cognitiveFlashcardsOnly}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
