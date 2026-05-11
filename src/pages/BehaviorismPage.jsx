import { useOutletContext } from 'react-router-dom'
import BehaviorismLesson from '../components/BehaviorismLesson.jsx'

export default function BehaviorismPage() {
  const { lessonResetKey, markFlashSeen, behaviorismFlashcardsOnly } = useOutletContext()
  return (
    <BehaviorismLesson
      key={lessonResetKey}
      behaviorismFlashcards={behaviorismFlashcardsOnly}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
