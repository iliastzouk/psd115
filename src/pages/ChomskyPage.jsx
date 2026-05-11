import { useOutletContext } from 'react-router-dom'
import ChomskyLesson from '../components/ChomskyLesson.jsx'

export default function ChomskyPage() {
  const { lessonResetKey, markFlashSeen, chomskyFlashcardsOnly } = useOutletContext()
  return (
    <ChomskyLesson
      key={lessonResetKey}
      chomskyFlashcards={chomskyFlashcardsOnly}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
