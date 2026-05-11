import { useOutletContext } from 'react-router-dom'
import ThorndikeLesson from '../components/ThorndikeLesson.jsx'

export default function ThorndikePage() {
  const { lessonResetKey, markFlashSeen, thorndikeFlashcardsOnly } = useOutletContext()
  return (
    <ThorndikeLesson
      key={lessonResetKey}
      thorndikeFlashcards={thorndikeFlashcardsOnly}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
