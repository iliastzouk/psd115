import { useOutletContext } from 'react-router-dom'
import GestaltLesson from '../components/GestaltLesson.jsx'

export default function GestaltPage() {
  const { lessonResetKey, markFlashSeen, gestaltFlashcardsOnly } = useOutletContext()
  return (
    <GestaltLesson
      key={lessonResetKey}
      gestaltFlashcards={gestaltFlashcardsOnly}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
