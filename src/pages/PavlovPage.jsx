import { useOutletContext } from 'react-router-dom'
import PavlovLesson from '../components/PavlovLesson.jsx'

export default function PavlovPage() {
  const { lessonResetKey, markFlashSeen, pavlovFlashcardsOnly } = useOutletContext()
  return (
    <PavlovLesson key={lessonResetKey} pavlovFlashcards={pavlovFlashcardsOnly} onMarkFlashSeen={markFlashSeen} />
  )
}
